import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';

// Helper: get start of current week (Monday)
function getWeekStart() {
  const d = new Date();
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  d.setDate(diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

export async function GET(request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type') || 'xp'; // xp | streak
    const period = searchParams.get('period') || 'alltime'; // alltime | weekly

    await connectDB();

    let sortField, projection;

    if (type === 'streak') {
      sortField = { currentStreak: -1, longestStreak: -1 };
      projection = { name: 1, currentStreak: 1, longestStreak: 1, totalXP: 1 };
    } else {
      sortField = { totalXP: -1 };
      projection = { name: 1, totalXP: 1, level: 1, currentStreak: 1 };
    }

    // Get top 50 users
    const users = await User.find({}, projection)
      .sort(sortField)
      .limit(50)
      .lean();

    // Find current user's rank
    const myId = session.user.id;
    let myRank = -1;
    const myUser = users.find((u, i) => {
      if (u._id.toString() === myId) { myRank = i + 1; return true; }
      return false;
    });

    // If user not in top 50, find their actual rank
    if (myRank === -1) {
      if (type === 'streak') {
        const me = await User.findById(myId).select('currentStreak').lean();
        myRank = await User.countDocuments({ currentStreak: { $gt: me?.currentStreak || 0 } }) + 1;
      } else {
        const me = await User.findById(myId).select('totalXP').lean();
        myRank = await User.countDocuments({ totalXP: { $gt: me?.totalXP || 0 } }) + 1;
      }
    }

    // Format leaderboard entries with medal
    const board = users.map((u, i) => ({
      rank:     i + 1,
      name:     u.name || 'Anonymous',
      xp:       u.totalXP || 0,
      streak:   u.currentStreak || 0,
      longest:  u.longestStreak || 0,
      level:    u.level || 1,
      isMe:     u._id.toString() === myId,
      medal:    i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : null,
    }));

    // My stats
    const myData = await User.findById(myId)
      .select('totalXP currentStreak longestStreak level name')
      .lean();

    return NextResponse.json({
      board,
      myRank,
      myStats: {
        xp:      myData?.totalXP      || 0,
        streak:  myData?.currentStreak || 0,
        longest: myData?.longestStreak || 0,
        level:   myData?.level         || 1,
        name:    myData?.name          || 'You',
      },
      totalUsers: await User.countDocuments(),
    }, { status: 200 });

  } catch (err) {
    console.error('[LEADERBOARD]', err);
    return NextResponse.json({ message: 'Failed' }, { status: 500 });
  }
}