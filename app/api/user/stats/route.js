import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }
    await connectDB();
    const user = await User.findById(session.user.id).select(
      'currentStreak longestStreak totalXP level lastStudiedDate'
    );
    if (!user) return NextResponse.json({ message: 'User not found' }, { status: 404 });

    return NextResponse.json({
      streak:    user.currentStreak,
      longest:   user.longestStreak,
      xp:        user.totalXP,
      level:     user.level,
      lastStudy: user.lastStudiedDate,
    });
  } catch (err) {
    return NextResponse.json({ message: 'Failed' }, { status: 500 });
  }
}