import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import connectDB from '@/lib/mongodb';
import Subject from '@/models/Subject';

export async function GET(request, { params }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }
    await connectDB();
    const subject = await Subject.findOne({ _id: params.id, userId: session.user.id });
    if (!subject) return NextResponse.json({ message: 'Subject not found' }, { status: 404 });
    return NextResponse.json({ subject }, { status: 200 });
  } catch (err) {
    return NextResponse.json({ message: 'Failed' }, { status: 500 });
  }
}

export async function PATCH(request, { params }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }
    const body = await request.json();
    await connectDB();
    const subject = await Subject.findOneAndUpdate(
      { _id: params.id, userId: session.user.id },
      { $set: body },
      { new: true, runValidators: true }
    );
    if (!subject) return NextResponse.json({ message: 'Subject not found' }, { status: 404 });
    return NextResponse.json({ subject }, { status: 200 });
  } catch (err) {
    return NextResponse.json({ message: 'Failed to update' }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }
    await connectDB();
    const subject = await Subject.findOneAndDelete({ _id: params.id, userId: session.user.id });
    if (!subject) return NextResponse.json({ message: 'Subject not found' }, { status: 404 });
    return NextResponse.json({ message: 'Deleted' }, { status: 200 });
  } catch (err) {
    return NextResponse.json({ message: 'Failed to delete' }, { status: 500 });
  }
}