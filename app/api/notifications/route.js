import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';
import Subject from '@/models/Subject';

// ── Star milestones ───────────────────────────────────────────────────────────
const STREAK_STARS = [
  { days:   7, stars:  1 },
  { days:  14, stars:  2 },
  { days:  30, stars:  4 },
  { days:  60, stars:  7 },
  { days: 100, stars: 15 },
];

// ── GET — fetch notifications + check for new ones ────────────────────────────
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });

    await connectDB();
    const user = await User.findById(session.user.id);
    if (!user) return NextResponse.json({ message: 'User not found' }, { status: 404 });

    // ── Auto-generate smart notifications ─────────────────────────────────────
    const newNotifs = [];

    // 1. Streak risk — hasn't studied today and has an active streak
    if (user.currentStreak > 0 && user.lastStudyDate) {
      const lastDate  = new Date(user.lastStudyDate);
      const today     = new Date();
      const yesterday = new Date(today); yesterday.setDate(today.getDate() - 1);
      const lastStr   = lastDate.toDateString();
      const todayStr  = today.toDateString();
      const ystrdStr  = yesterday.toDateString();
      const now       = today.getHours();

      // If last study was yesterday and it's past noon — warn
      if (lastStr === ystrdStr && now >= 12) {
        const already = user.notifications.some(
          n => n.type === 'streak_risk' && new Date(n.createdAt).toDateString() === todayStr
        );
        if (!already) {
          newNotifs.push({
            type: 'streak_risk',
            title: 'Streak at Risk! 🔥',
            message: `Your ${user.currentStreak}-day streak will break tonight if you don't study. Open the timer now!`,
            icon: '⚠️',
            link: '/dashboard/timer',
          });
        }
      }
    }

    // 2. Exam soon — subjects with exams in ≤5 days
    const subjects = await Subject.find({ userId: user._id, isCompleted: false });
    for (const s of subjects) {
      const days    = Math.ceil((new Date(s.examDate) - new Date()) / 86400000);
      const todayStr = new Date().toDateString();
      if (days > 0 && days <= 5) {
        const already = user.notifications.some(
          n => n.type === 'exam_soon' && n.title.includes(s.name) && new Date(n.createdAt).toDateString() === todayStr
        );
        if (!already) {
          const remaining = (s.topics||[]).filter(t => t.status !== 'completed').length;
          newNotifs.push({
            type: 'exam_soon',
            title: `${s.emoji} ${s.name} in ${days} day${days===1?'':'s'}!`,
            message: `${remaining} topic${remaining===1?'':'s'} left to complete. Keep pushing!`,
            icon: '📅',
            link: `/dashboard/subjects/${s._id}`,
          });
        }
      }
    }

    // 3. Quiz unlocked — topics that crossed the study time threshold
    for (const s of subjects) {
      for (const t of (s.topics||[])) {
        if (t.status !== 'completed' && (t.studyMinutesLogged||0) >= (t.studyMinutesRequired||20)) {
          const todayStr = new Date().toDateString();
          const already  = user.notifications.some(
            n => n.type === 'quiz_unlock' && n.message.includes(t.name) && new Date(n.createdAt).toDateString() === todayStr
          );
          if (!already) {
            newNotifs.push({
              type: 'quiz_unlock',
              title: '🧠 Quiz Unlocked!',
              message: `"${t.name}" in ${s.name} is ready for a quiz. Test your knowledge!`,
              icon: '🔓',
              link: `/dashboard/subjects/${s._id}`,
            });
          }
        }
      }
    }

    // Push new notifications (keep last 50)
    if (newNotifs.length > 0) {
      user.notifications.push(...newNotifs);
      if (user.notifications.length > 50) {
        user.notifications = user.notifications.slice(-50);
      }
      await user.save();
    }

    const unread = user.notifications.filter(n => !n.read).length;
    const recent = [...user.notifications].reverse().slice(0, 20);

    return NextResponse.json({ notifications: recent, unreadCount: unread }, { status: 200 });
  } catch (err) {
    console.error('[NOTIFICATIONS GET]', err);
    return NextResponse.json({ message: 'Failed' }, { status: 500 });
  }
}

// ── PATCH — mark notifications as read ───────────────────────────────────────
export async function PATCH(request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });

    const { markAllRead, notifId } = await request.json();
    await connectDB();

    const user = await User.findById(session.user.id);
    if (!user) return NextResponse.json({ message: 'User not found' }, { status: 404 });

    if (markAllRead) {
      user.notifications.forEach(n => { n.read = true; });
    } else if (notifId) {
      const n = user.notifications.id(notifId);
      if (n) n.read = true;
    }

    await user.save();
    return NextResponse.json({ success: true }, { status: 200 });
  } catch (err) {
    return NextResponse.json({ message: 'Failed' }, { status: 500 });
  }
} 