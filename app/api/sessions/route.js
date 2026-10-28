import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import connectDB from '@/lib/mongodb';
import StudySession from '@/models/StudySession';
import User from '@/models/User';
import Subject from '@/models/Subject';

// ── GET — fetch recent sessions ──────────────────────────────────────────────
export async function GET(request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();
    const sessions = await StudySession
      .find({ userId: session.user.id })
      .sort({ createdAt: -1 })
      .limit(20);

    return NextResponse.json({ sessions }, { status: 200 });
  } catch (err) {
    console.error('[SESSIONS GET]', err);
    return NextResponse.json({ message: 'Failed to fetch sessions' }, { status: 500 });
  }
}

// ── POST — save a completed session ─────────────────────────────────────────
export async function POST(request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const {
      subjectId, subjectName, subjectEmoji, subjectColor,
      mode, durationSeconds, targetSeconds, pomodoroCount,
    } = body;

    if (!durationSeconds || durationSeconds < 30) {
      return NextResponse.json(
        { message: 'Session too short (minimum 30 seconds).' },
        { status: 400 }
      );
    }

    await connectDB();

    // ── Calculate XP earned (1 XP per minute, bonus for pomodoro) ────────────
    const minutesStudied = Math.floor(durationSeconds / 60);
    let xpEarned = minutesStudied; // base: 1 XP/min
    if (mode === 'pomodoro') xpEarned += pomodoroCount * 10; // bonus per pomodoro
    if (durationSeconds >= 3600) xpEarned += 20;             // bonus for 1h+ session

    // ── Save session ──────────────────────────────────────────────────────────
    const studySession = await StudySession.create({
      userId: session.user.id,
      subjectId: subjectId || null,
      subjectName: subjectName || 'General Study',
      subjectEmoji: subjectEmoji || '📚',
      subjectColor: subjectColor || '#7c3aed',
      mode,
      durationSeconds,
      targetSeconds: targetSeconds || 0,
      pomodoroCount: pomodoroCount || 0,
      xpEarned,
    });

    // ── Update user XP & streak ───────────────────────────────────────────────
    const today     = new Date();
    today.setHours(0, 0, 0, 0);
    const user      = await User.findById(session.user.id);
    const lastStudy = user.lastStudiedDate
      ? new Date(user.lastStudiedDate)
      : null;

    let newStreak = user.currentStreak || 0;

    if (lastStudy) {
      const lastDay = new Date(lastStudy);
      lastDay.setHours(0, 0, 0, 0);
      const diff = Math.round((today - lastDay) / 86400000);
      if (diff === 0)      newStreak = user.currentStreak; // already studied today
      else if (diff === 1) newStreak = user.currentStreak + 1; // consecutive day
      else                 newStreak = 1; // streak broken
    } else {
      newStreak = 1; // first ever session
    }

    const newXP     = (user.totalXP || 0) + xpEarned;
    const newLevel  = Math.floor(newXP / 500) + 1;
    const longest   = Math.max(newStreak, user.longestStreak || 0);

    await User.findByIdAndUpdate(session.user.id, {
      totalXP:         newXP,
      level:           newLevel,
      currentStreak:   newStreak,
      longestStreak:   longest,
      lastStudiedDate: new Date(),
    });

    // ── Update subject hours studied ──────────────────────────────────────────
    if (subjectId) {
      await Subject.findByIdAndUpdate(subjectId, {
        $inc: { totalHoursStudied: durationSeconds / 3600 },
      });
    }

    return NextResponse.json({
      message: 'Session saved!',
      session: studySession,
      xpEarned,
      newStreak,
      newXP,
    }, { status: 201 });

  } catch (err) {
    console.error('[SESSIONS POST]', err);
    return NextResponse.json({ message: 'Failed to save session' }, { status: 500 });
  }
}