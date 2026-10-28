import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';

export async function POST(request) {
  try {
    const body = await request.json();
    const { name, email, password, goal } = body;
if (!name || !email || !password) {
  return NextResponse.json(
    { message: 'Name, email, and password are required.' },
    { status: 400 }
  );
}

if (password.length < 8) {
  return NextResponse.json(
    { message: 'Password must be at least 8 characters.' },
    { status: 400 }
  );
}
    // ✅ Connect to DB BEFORE anything else
    try {
      await connectDB();
    } catch (dbError) {
      console.error('DB Connection failed:', dbError);
      return NextResponse.json(
        { message: 'Database connection failed. Check your MONGODB_URI.' },
        { status: 500 }
      );
    }

    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing) {
      return NextResponse.json(
        { message: 'An account with this email already exists.' },
        { status: 409 }
      );
    }

    const user = await User.create({
      name: name.trim(),
      email: email.toLowerCase().trim(),
      password,
      goal: goal || 'habit',
    });

    return NextResponse.json(
      { message: 'Account created!', user: { id: user._id, name: user.name } },
      { status: 201 }
    );

  } catch (error) {
    console.error('[SIGNUP ERROR]', error.message);

    if (error.name === 'ValidationError') {
      const msg = Object.values(error.errors)[0].message;
      return NextResponse.json({ message: msg }, { status: 400 });
    }

    // ✅ Always return a clean message, never expose raw errors
    return NextResponse.json(
      { message: error.message || 'Something went wrong. Please try again.' },
      { status: 500 }
    );
  }
}