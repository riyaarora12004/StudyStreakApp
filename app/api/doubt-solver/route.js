import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { generateAI, AIError } from '@/lib/gemini';
import connectDB from '@/lib/mongodb';
import Subject from '@/models/Subject';
import DoubtSession from '@/models/DoubtSession';

export async function GET(request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get('sessionId');
    await connectDB();

    if (sessionId) {
      const ds = await DoubtSession.findOne({ _id: sessionId, userId: session.user.id });
      if (!ds) return NextResponse.json({ message: 'Not found' }, { status: 404 });
      return NextResponse.json({ messages: ds.messages }, { status: 200 });
    }

    const sessions = await DoubtSession.find({ userId: session.user.id })
      .sort({ updatedAt: -1 }).limit(20)
      .select('subjectId subjectName subjectEmoji subjectColor totalQuestions updatedAt messages');

    return NextResponse.json({
      sessions: sessions.map(ds => ({
        _id: ds._id, subjectId: ds.subjectId, subjectName: ds.subjectName,
        subjectEmoji: ds.subjectEmoji, subjectColor: ds.subjectColor,
        totalQuestions: ds.totalQuestions, updatedAt: ds.updatedAt,
        lastQuestion: ds.messages.filter(m => m.role === 'user').slice(-1)[0]?.content || '',
      }))
    }, { status: 200 });
  } catch (err) {
    return NextResponse.json({ message: 'Failed' }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });

    const { question, subjectId, sessionId, conversationHistory = [] } = await request.json();
    if (!question?.trim()) return NextResponse.json({ message: 'Question is required' }, { status: 400 });

    await connectDB();

    let subjectContext = '';
    let subjectMeta    = { subjectName: 'General', subjectEmoji: '📚', subjectColor: '#7c3aed' };

    if (subjectId) {
      const subject = await Subject.findOne({ _id: subjectId, userId: session.user.id });
      if (subject) {
        subjectMeta = { subjectName: subject.name, subjectEmoji: subject.emoji, subjectColor: subject.color };
        const completedTopics = (subject.topics || []).filter(t => t.status === 'completed');
        const weakTopics      = (subject.topics || []).filter(t => (t.quizAttempts||[]).some(a => !a.passed));
        subjectContext = `\nSUBJECT: ${subject.name}\nCompleted Topics: ${completedTopics.map(t=>t.name).join(', ')||'None'}\nWeak Areas: ${weakTopics.map(t=>t.name).join(', ')||'None'}\n${subject.syllabusNotes?'Syllabus: '+subject.syllabusNotes.slice(0,200):''}`;
      }
    }

    const historyText = conversationHistory.slice(-6).map(m =>
      (m.role === 'user' ? 'Student: ' : 'AI Tutor: ') + m.content
    ).join('\n');

    const prompt = `You are an expert AI tutor. Be clear, encouraging, and use examples.
${subjectContext}
${historyText ? 'PREVIOUS:\n' + historyText + '\n' : ''}
QUESTION: ${question}

Answer in 150-300 words. Use markdown (**bold**, \`code\`, numbered steps). End with "**Key Takeaway:** ..."`;

    const answer = await generateAI(prompt);

    let doubtSession;
    if (sessionId) {
      doubtSession = await DoubtSession.findOne({ _id: sessionId, userId: session.user.id });
    }
    if (!doubtSession) {
      doubtSession = new DoubtSession({ userId: session.user.id, subjectId: subjectId||null, ...subjectMeta, messages: [] });
    }

    doubtSession.messages.push({ role: 'user', content: question });
    doubtSession.messages.push({ role: 'ai',   content: answer   });
    doubtSession.totalQuestions = (doubtSession.totalQuestions||0) + 1;
    if (doubtSession.messages.length > 100) doubtSession.messages = doubtSession.messages.slice(-100);
    await doubtSession.save();

    return NextResponse.json({ answer, sessionId: doubtSession._id, messageId: doubtSession.messages.slice(-1)[0]._id }, { status: 200 });
  } catch (err) {
    if (err instanceof AIError) {
      return NextResponse.json({ message: err.message }, { status: err.status });
    }
    return NextResponse.json({ message: err.message || 'Failed' }, { status: 500 });
  }
}

export async function PATCH(request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    const { sessionId, messageId, helpful } = await request.json();
    await connectDB();
    const ds  = await DoubtSession.findOne({ _id: sessionId, userId: session.user.id });
    if (!ds) return NextResponse.json({ message: 'Not found' }, { status: 404 });
    const msg = ds.messages.id(messageId);
    if (msg) { msg.helpful = helpful; await ds.save(); }
    return NextResponse.json({ success: true }, { status: 200 });
  } catch (err) {
    return NextResponse.json({ message: 'Failed' }, { status: 500 });
  }
}