import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import connectDB from '@/lib/mongodb';
import Deadline from '@/models/Deadline';
import Subject from '@/models/Subject';

// ── GET — fetch all deadlines ─────────────────────────────────────────────────
export async function GET(request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });

    await connectDB();

    const deadlines = await Deadline.find({ userId: session.user.id })
      .sort({ dueDate: 1 });

    // Auto-update overdue status
    const now = new Date();
    const toUpdate = deadlines.filter(
      d => d.status === 'pending' && new Date(d.dueDate) < now
    );
    if (toUpdate.length) {
      await Deadline.updateMany(
        { _id: { $in: toUpdate.map(d => d._id) } },
        { status: 'overdue' }
      );
      toUpdate.forEach(d => { d.status = 'overdue'; });
    }

    // Stats
    const stats = {
      total:       deadlines.length,
      overdue:     deadlines.filter(d => d.status === 'overdue' || (d.status !== 'completed' && new Date(d.dueDate) < now)).length,
      today:       deadlines.filter(d => d.status !== 'completed' && new Date(d.dueDate).toDateString() === now.toDateString()).length,
      thisWeek:    deadlines.filter(d => { const diff = Math.ceil((new Date(d.dueDate) - now) / 86400000); return d.status !== 'completed' && diff >= 0 && diff <= 7; }).length,
      completed:   deadlines.filter(d => d.status === 'completed').length,
      pending:     deadlines.filter(d => d.status === 'pending' || d.status === 'in_progress').length,
    };

    return NextResponse.json({ deadlines, stats }, { status: 200 });
  } catch (err) {
    console.error('[DEADLINES GET]', err);
    return NextResponse.json({ message: 'Failed to fetch deadlines' }, { status: 500 });
  }
}

// ── POST — create deadline ────────────────────────────────────────────────────
export async function POST(request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });

    const body = await request.json();
    const { title, type, priority, dueDate, notes, subjectId, estimatedMins, reminder } = body;

    if (!title?.trim()) return NextResponse.json({ message: 'Title is required' }, { status: 400 });
    if (!dueDate)        return NextResponse.json({ message: 'Due date is required' }, { status: 400 });

    await connectDB();

    // Fetch subject info
    let subjectData = { subjectId: null, subjectName: 'General', subjectEmoji: '📚', subjectColor: '#7c3aed' };
    if (subjectId) {
      const sub = await Subject.findOne({ _id: subjectId, userId: session.user.id });
      if (sub) subjectData = { subjectId: sub._id, subjectName: sub.name, subjectEmoji: sub.emoji, subjectColor: sub.color };
    }

    const deadline = await Deadline.create({
      userId: session.user.id,
      ...subjectData,
      title:  title.trim(),
      type:   type     || 'assignment',
      priority: priority || 'medium',
      dueDate: new Date(dueDate),
      notes:  notes    || '',
      estimatedMins: estimatedMins || 0,
      reminder: reminder !== false,
      status: new Date(dueDate) < new Date() ? 'overdue' : 'pending',
    });

    return NextResponse.json({ deadline }, { status: 201 });
  } catch (err) {
    console.error('[DEADLINES POST]', err);
    return NextResponse.json({ message: 'Failed to create deadline' }, { status: 500 });
  }
}

// ── PATCH — update / complete / delete ───────────────────────────────────────
export async function PATCH(request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });

    const { id, action, ...updates } = await request.json();
    await connectDB();

    const deadline = await Deadline.findOne({ _id: id, userId: session.user.id });
    if (!deadline) return NextResponse.json({ message: 'Not found' }, { status: 404 });

    if (action === 'complete') {
      deadline.status      = 'completed';
      deadline.completedAt = new Date();
    } else if (action === 'uncomplete') {
      deadline.status      = new Date(deadline.dueDate) < new Date() ? 'overdue' : 'pending';
      deadline.completedAt = null;
    } else if (action === 'setStatus') {
      deadline.status = updates.status;
    } else if (action === 'update') {
      if (updates.title)          deadline.title    = updates.title;
      if (updates.dueDate)        deadline.dueDate  = new Date(updates.dueDate);
      if (updates.priority)       deadline.priority = updates.priority;
      if (updates.notes !== undefined) deadline.notes = updates.notes;
      if (updates.estimatedMins !== undefined) deadline.estimatedMins = updates.estimatedMins;
    } else if (action === 'delete') {
      await Deadline.deleteOne({ _id: id });
      return NextResponse.json({ deleted: true }, { status: 200 });
    }

    await deadline.save();
    return NextResponse.json({ deadline }, { status: 200 });
  } catch (err) {
    console.error('[DEADLINES PATCH]', err);
    return NextResponse.json({ message: 'Failed to update' }, { status: 500 });
  }
} 