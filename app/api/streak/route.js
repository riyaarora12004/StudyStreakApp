import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';
import StudySession from '@/models/StudySession';

// ── Badge definitions ────────────────────────────────────────────────────────
export const BADGES = [
  // Streak badges
  { id: 'streak_3',    icon: '🥉', name: 'On a Roll',       desc: '3-day streak',         type: 'streak',  threshold: 3    },
  { id: 'streak_7',    icon: '🥈', name: 'Week Warrior',    desc: '7-day streak',         type: 'streak',  threshold: 7    },
  { id: 'streak_14',   icon: '🥇', name: 'Fortnight Fire',  desc: '14-day streak',        type: 'streak',  threshold: 14   },
  { id: 'streak_30',   icon: '💎', name: 'Monthly Master',  desc: '30-day streak',        type: 'streak',  threshold: 30   },
  { id: 'streak_60',   icon: '👑', name: 'Consistency King',desc: '60-day streak',        type: 'streak',  threshold: 60   },
  { id: 'streak_100',  icon: '🌟', name: 'Century Scholar', desc: '100-day streak',       type: 'streak',  threshold: 100  },
  // XP badges
  { id: 'xp_500',      icon: '⚡', name: 'Spark',           desc: 'Earn 500 XP',          type: 'xp',      threshold: 500  },
  { id: 'xp_1500',     icon: '🔋', name: 'Charged',         desc: 'Earn 1,500 XP',        type: 'xp',      threshold: 1500 },
  { id: 'xp_3000',     icon: '💥', name: 'Powerhouse',      desc: 'Earn 3,000 XP',        type: 'xp',      threshold: 3000 },
  { id: 'xp_6000',     icon: '🚀', name: 'Rocket Scholar',  desc: 'Earn 6,000 XP',        type: 'xp',      threshold: 6000 },
  // Session badges
  { id: 'sessions_1',  icon: '🌱', name: 'First Step',      desc: 'Complete 1 session',   type: 'sessions',threshold: 1    },
  { id: 'sessions_10', icon: '🌿', name: 'Budding Scholar', desc: 'Complete 10 sessions', type: 'sessions',threshold: 10   },
  { id: 'sessions_25', icon: '🌳', name: 'Study Tree',      desc: 'Complete 25 sessions', type: 'sessions',threshold: 25   },
  { id: 'sessions_50', icon: '🏔️', name: 'Mountain Climber',desc: 'Complete 50 sessions', type: 'sessions',threshold: 50   },
  // Hours badges
  { id: 'hours_10',    icon: '⏰', name: 'Clock Watcher',   desc: 'Study 10 hours total', type: 'hours',   threshold: 10   },
  { id: 'hours_50',    icon: '📅', name: 'Time Investor',   desc: 'Study 50 hours total', type: 'hours',   threshold: 50   },
  { id: 'hours_100',   icon: '🎓', name: 'Graduate',        desc: 'Study 100 hours total',type: 'hours',   threshold: 100  },
];

export const LEVELS = [
  { level: 1, name: 'Beginner',   minXP: 0,     maxXP: 499,   color: '#94a3b8', icon: '🌱' },
  { level: 2, name: 'Scholar',    minXP: 500,   maxXP: 1499,  color: '#34d399', icon: '📗' },
  { level: 3, name: 'Expert',     minXP: 1500,  maxXP: 2999,  color: '#38bdf8', icon: '💡' },
  { level: 4, name: 'Master',     minXP: 3000,  maxXP: 5999,  color: '#a78bfa', icon: '🔮' },
  { level: 5, name: 'Legend',     minXP: 6000,  maxXP: 99999, color: '#fbbf24', icon: '👑' },
];

export function getLevelInfo(xp) {
  return LEVELS.find(l => xp >= l.minXP && xp <= l.maxXP) || LEVELS[0];
}

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    const user = await User.findById(session.user.id).select(
      'currentStreak longestStreak totalXP level lastStudiedDate createdAt name'
    );

    // Get total sessions count
    const totalSessions = await StudySession.countDocuments({ userId: session.user.id });

    // Get total hours studied
    const hoursAgg = await StudySession.aggregate([
      { $match: { userId: user._id } },
      { $group: { _id: null, total: { $sum: '$durationSeconds' } } },
    ]);
    const totalHours = hoursAgg.length ? Math.round(hoursAgg[0].total / 3600) : 0;

    // Get last 30 days activity (for calendar heatmap)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 29);

    const recentSessions = await StudySession.find({
      userId: user._id,
      createdAt: { $gte: thirtyDaysAgo },
    }).select('createdAt durationSeconds');

    // Build day-by-day activity map
    const activityMap = {};
    recentSessions.forEach(s => {
      const key = new Date(s.createdAt).toDateString();
      activityMap[key] = (activityMap[key] || 0) + s.durationSeconds;
    });

    // Calculate earned badges
    const earnedBadges = BADGES.filter(b => {
      if (b.type === 'streak')   return (user.longestStreak || 0) >= b.threshold;
      if (b.type === 'xp')       return (user.totalXP || 0) >= b.threshold;
      if (b.type === 'sessions') return totalSessions >= b.threshold;
      if (b.type === 'hours')    return totalHours >= b.threshold;
      return false;
    }).map(b => b.id);

    // Next badge to earn
    const nextBadge = BADGES.find(b => {
      if (b.type === 'streak')   return (user.longestStreak || 0) < b.threshold;
      if (b.type === 'xp')       return (user.totalXP || 0) < b.threshold;
      if (b.type === 'sessions') return totalSessions < b.threshold;
      if (b.type === 'hours')    return totalHours < b.threshold;
      return false;
    });

    const levelInfo = getLevelInfo(user.totalXP || 0);

    return NextResponse.json({
      user: {
        name:           user.name,
        currentStreak:  user.currentStreak || 0,
        longestStreak:  user.longestStreak  || 0,
        totalXP:        user.totalXP        || 0,
        level:          levelInfo,
        lastStudiedDate:user.lastStudiedDate,
        joinedDate:     user.createdAt,
      },
      stats: {
        totalSessions,
        totalHours,
      },
      earnedBadges,
      nextBadge,
      activityMap,
      allBadges: BADGES,
    });
  } catch (err) {
    console.error('[STREAK GET]', err);
    return NextResponse.json({ message: 'Failed to fetch streak data' }, { status: 500 });
  }
}