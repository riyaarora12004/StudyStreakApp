import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import connectDB from '@/lib/mongodb';
import StudySession from '@/models/StudySession';
import Subject from '@/models/Subject';
import User from '@/models/User';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();
    const userId = session.user.id;

    // ── Last 14 days daily study time ────────────────────────────────────────
    const fourteenDaysAgo = new Date();
    fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 13);
    fourteenDaysAgo.setHours(0, 0, 0, 0);

    const allSessions = await StudySession.find({
      userId,
      createdAt: { $gte: fourteenDaysAgo },
    }).sort({ createdAt: 1 });

    // Build 14-day chart data
    const dailyMap = {};
    for (let i = 13; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const key = d.toDateString();
      dailyMap[key] = { date: key, minutes: 0, sessions: 0, label: d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) };
    }
    allSessions.forEach(s => {
      const key = new Date(s.createdAt).toDateString();
      if (dailyMap[key]) {
        dailyMap[key].minutes  += Math.round(s.durationSeconds / 60);
        dailyMap[key].sessions += 1;
      }
    });
    const dailyData = Object.values(dailyMap);

    // ── Subject breakdown (all time, only EXISTING subjects) ─────────────────
    const allTimeSessions = await StudySession.find({ userId });

    // Get the IDs of subjects that still exist
    const existingSubjects = await Subject.find({ userId }).select('_id name emoji color').lean();
    const existingIds = new Set(existingSubjects.map(s => s._id.toString()));

    const subjectMap = {};
    allTimeSessions.forEach(s => {
      // Skip sessions from deleted subjects (subjectId no longer exists)
      if (s.subjectId && !existingIds.has(s.subjectId.toString())) return;

      const name = s.subjectName || 'General';
      if (!subjectMap[name]) {
        subjectMap[name] = { name, minutes: 0, sessions: 0, color: s.subjectColor || '#7c3aed', emoji: s.subjectEmoji || '📚' };
      }
      subjectMap[name].minutes  += Math.round(s.durationSeconds / 60);
      subjectMap[name].sessions += 1;
    });
    const subjectBreakdown = Object.values(subjectMap)
      .sort((a, b) => b.minutes - a.minutes)
      .slice(0, 6);

    // ── Mode breakdown ───────────────────────────────────────────────────────
    const modeMap = { stopwatch: 0, pomodoro: 0, countdown: 0 };
    allTimeSessions.forEach(s => { modeMap[s.mode] = (modeMap[s.mode] || 0) + 1; });

    // ── Weekly comparison (this week vs last week) ───────────────────────────
    const now       = new Date();
    const startThis = new Date(now); startThis.setDate(now.getDate() - now.getDay()); startThis.setHours(0,0,0,0);
    const startLast = new Date(startThis); startLast.setDate(startThis.getDate() - 7);

    const thisWeekMins = allSessions
      .filter(s => new Date(s.createdAt) >= startThis)
      .reduce((a, s) => a + Math.round(s.durationSeconds / 60), 0);
    const lastWeekMins = allSessions
      .filter(s => new Date(s.createdAt) >= startLast && new Date(s.createdAt) < startThis)
      .reduce((a, s) => a + Math.round(s.durationSeconds / 60), 0);

    // ── Best study time (hour of day) ────────────────────────────────────────
    const hourMap = {};
    allTimeSessions.forEach(s => {
      const h = new Date(s.createdAt).getHours();
      hourMap[h] = (hourMap[h] || 0) + Math.round(s.durationSeconds / 60);
    });
    const bestHour = Object.entries(hourMap).sort((a, b) => b[1] - a[1])[0];
    const bestHourLabel = bestHour
      ? `${bestHour[0] % 12 || 12}${Number(bestHour[0]) < 12 ? 'am' : 'pm'}`
      : null;

    // ── All-time totals ───────────────────────────────────────────────────────
    const totalMinutes  = allTimeSessions.reduce((a, s) => a + Math.round(s.durationSeconds / 60), 0);
    const totalSessions = allTimeSessions.length;
    const avgPerDay     = dailyData.filter(d => d.minutes > 0).length
      ? Math.round(totalMinutes / Math.max(1, dailyData.filter(d => d.minutes > 0).length))
      : 0;

    // ── Subject progress (reuse already-fetched subjects) ────────────────────
    const subjects = existingSubjects;

    // ── User for XP history ──────────────────────────────────────────────────
    const user = await User.findById(userId).select('totalXP currentStreak longestStreak');

    return NextResponse.json({
      dailyData,
      subjectBreakdown,
      modeMap,
      weekComparison: { thisWeek: thisWeekMins, lastWeek: lastWeekMins },
      totals: { minutes: totalMinutes, sessions: totalSessions, avgPerDay },
      bestHour: bestHourLabel,
      subjects,
      user: { totalXP: user.totalXP, currentStreak: user.currentStreak, longestStreak: user.longestStreak },
    });
  } catch (err) {
    console.error('[ANALYTICS GET]', err);
    return NextResponse.json({ message: 'Failed to fetch analytics' }, { status: 500 });
  }
}