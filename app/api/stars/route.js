import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';

const STREAK_MILESTONES = [
  { days:   3, stars:  0, label: '3-Day Streak',   icon: '🌱', color: '#34d399' },
  { days:   7, stars:  1, label: '7-Day Streak',   icon: '⭐', color: '#fbbf24' },
  { days:  14, stars:  2, label: '2-Week Streak',  icon: '⭐⭐', color: '#f59e0b' },
  { days:  30, stars:  4, label: '30-Day Streak',  icon: '💫', color: '#f97316' },
  { days:  60, stars:  7, label: '60-Day Streak',  icon: '🌟', color: '#ef4444' },
  { days: 100, stars: 15, label: '100-Day Legend', icon: '👑', color: '#8b5cf6' },
];

const STAR_DISCOUNT = [
  { stars:  1, discount:  5 },
  { stars:  3, discount: 10 },
  { stars:  5, discount: 15 },
  { stars: 10, discount: 25 },
  { stars: 15, discount: 35 },
  { stars: 20, discount: 50 },
];

// ── GET — star wallet data ────────────────────────────────────────────────────
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });

    await connectDB();
    const user = await User.findById(session.user.id)
      .select('currentStreak longestStreak totalStars availableStars redeemedStars starHistory celebratedMilestones');

    if (!user) return NextResponse.json({ message: 'User not found' }, { status: 404 });

    // Calculate uncelebrated milestones
    const newMilestones = STREAK_MILESTONES.filter(
      m => user.currentStreak >= m.days && !(user.celebratedMilestones||[]).includes(m.days)
    );

    // Discount user can currently get
    const availStars  = user.availableStars || 0;
    const bestDiscount = [...STAR_DISCOUNT].reverse().find(d => availStars >= d.stars);

    // Star expiry — mark expired stars
    const now = new Date();
    const validStars = (user.starHistory||[]).filter(s => !s.expiresAt || new Date(s.expiresAt) > now);

    return NextResponse.json({
      totalStars:     user.totalStars     || 0,
      availableStars: user.availableStars || 0,
      redeemedStars:  user.redeemedStars  || 0,
      starHistory:    validStars.slice(-10).reverse(),
      currentStreak:  user.currentStreak  || 0,
      longestStreak:  user.longestStreak  || 0,
      milestones:     STREAK_MILESTONES,
      celebratedMilestones: user.celebratedMilestones || [],
      newMilestones,
      bestDiscount:   bestDiscount || null,
      discountTable:  STAR_DISCOUNT,
    }, { status: 200 });
  } catch (err) {
    console.error('[STARS GET]', err);
    return NextResponse.json({ message: 'Failed' }, { status: 500 });
  }
}

// ── POST — award stars for a milestone + mark celebrated ──────────────────────
export async function POST(request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });

    const { milestoneDays } = await request.json();
    await connectDB();

    const user      = await User.findById(session.user.id);
    if (!user) return NextResponse.json({ message: 'User not found' }, { status: 404 });

    const milestone = STREAK_MILESTONES.find(m => m.days === milestoneDays);
    if (!milestone) return NextResponse.json({ message: 'Invalid milestone' }, { status: 400 });

    // Don't double-award
    if ((user.celebratedMilestones||[]).includes(milestoneDays)) {
      return NextResponse.json({ message: 'Already awarded', alreadyAwarded: true }, { status: 200 });
    }

    // Mark as celebrated
    if (!user.celebratedMilestones) user.celebratedMilestones = [];
    user.celebratedMilestones.push(milestoneDays);

    // Award stars if any
    if (milestone.stars > 0) {
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 90); // expires in 90 days

      user.totalStars     = (user.totalStars     || 0) + milestone.stars;
      user.availableStars = (user.availableStars  || 0) + milestone.stars;
      if (!user.starHistory) user.starHistory = [];
      user.starHistory.push({
        stars:    milestone.stars,
        reason:   milestone.label,
        expiresAt,
      });

      // Add notification
      if (!user.notifications) user.notifications = [];
      user.notifications.push({
        type:    'star_earned',
        title:   `${milestone.stars} Star${milestone.stars>1?'s':''} Earned! ⭐`,
        message: `You hit a ${milestone.days}-day streak! Use your stars for a premium discount.`,
        icon:    '⭐',
        link:    '/dashboard/rewards',
      });
    }

    await user.save();
    return NextResponse.json({
      starsAwarded:   milestone.stars,
      totalStars:     user.totalStars,
      availableStars: user.availableStars,
    }, { status: 200 });
  } catch (err) {
    console.error('[STARS POST]', err);
    return NextResponse.json({ message: 'Failed' }, { status: 500 });
  }
}