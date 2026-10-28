import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route'; // ← ADD THIS
import connectDB from '@/lib/mongodb';
import Subject from '@/models/Subject';

export async function GET(request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    const subjects = await Subject.find({ userId: session.user.id })
      .sort({ createdAt: -1 })
      .lean();   // ✅ prevents virtual crash

    return NextResponse.json({ subjects }, { status: 200 });

  } catch (error) {
    console.error('[SUBJECTS GET ERROR]', error);
    return NextResponse.json({ message: 'Failed to fetch subjects' }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const session = await getServerSession(authOptions); // ← ADD authOptions
    if (!session?.user?.id) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }
    const body = await request.json();
    const {
    name,
    totalChapters,   // ✅ ADD THIS
    emoji,
    color,
    examDate,
    dailyTargetHours,
    priority,
    notes
  } = body;

if (!name || !totalChapters || !examDate) {
  return NextResponse.json(
    { message: 'Name, total chapters, and exam date are required.' },
    { status: 400 }
  );
}

    if (!name || !totalChapters || !examDate) {
      return NextResponse.json(
        { message: 'Name, total chapters, and exam date are required.' },
        { status: 400 }
      );
    }
    if (new Date(examDate) < new Date()) {
      return NextResponse.json(
        { message: 'Exam date must be in the future.' },
        { status: 400 }
      );
    }
    await connectDB();
    const subject = await Subject.create({
      userId: session.user.id,
      name,
      totalChapters: Number(totalChapters),   // ✅ ADD THIS
      completedChapters: 0,                  // ✅ important
      emoji: emoji || '📚',
      color: color || '#7c3aed',
      examDate: new Date(examDate),
      dailyTargetHours: Number(dailyTargetHours) || 1,
      priority: priority || 'medium',
      notes: notes || '',
    });
    return NextResponse.json({ message: 'Subject added!', subject }, { status: 201 });
  } catch (error) {
    console.error('[SUBJECTS POST ERROR]', error);
    if (error.name === 'ValidationError') {
      const msg = Object.values(error.errors)[0].message;
      return NextResponse.json({ message: msg }, { status: 400 });
    }
    return NextResponse.json({ message: 'Failed to create subject' }, { status: 500 });
  }
}