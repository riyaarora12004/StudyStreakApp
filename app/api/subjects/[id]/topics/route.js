import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import connectDB from '@/lib/mongodb';
import Subject from '@/models/Subject';

// ── PATCH /api/subjects/[id]/topics ─────────────────────────────────────────
// Actions: addTopics | logStudyTime | updateNotes | reorderTopics | deleteTopic
export async function PATCH(request, { params }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { action } = body;

    await connectDB();

    const subject = await Subject.findOne({ _id: params.id, userId: session.user.id });
    if (!subject) return NextResponse.json({ message: 'Subject not found' }, { status: 404 });

    // ── Add/replace topics ────────────────────────────────────────────────────
    if (action === 'addTopics') {
      const { topics, studyMinutesRequired = 20 } = body;
      subject.topics = topics.map((name, i) => ({
        name,
        order: i,
        status: 'unlocked',
        studyMinutesRequired,
        studyMinutesLogged: 0,
      }));
      await subject.save();
      return NextResponse.json({ subject }, { status: 200 });
    }

    // ── Log study time to a topic ─────────────────────────────────────────────
    if (action === 'logStudyTime') {
      const { topicId, minutes } = body;
      const topic = subject.topics.id(topicId);
      if (!topic) return NextResponse.json({ message: 'Topic not found' }, { status: 404 });
      topic.studyMinutesLogged = Math.round((topic.studyMinutesLogged || 0) + minutes);
      await subject.save();
      return NextResponse.json({
        topicId,
        studyMinutesLogged: topic.studyMinutesLogged,
        quizUnlocked: topic.studyMinutesLogged >= topic.studyMinutesRequired,
      }, { status: 200 });
    }

    // ── Update topic notes (weak / important) ─────────────────────────────────
    if (action === 'updateTopicNotes') {
      const { topicId, weakPoints, importantPoints } = body;
      const topic = subject.topics.id(topicId);
      if (!topic) return NextResponse.json({ message: 'Topic not found' }, { status: 404 });
      if (weakPoints      !== undefined) topic.weakPoints      = weakPoints;
      if (importantPoints !== undefined) topic.importantPoints = importantPoints;
      await subject.save();
      return NextResponse.json({ topic }, { status: 200 });
    }

    // ── Save quiz result for a topic ──────────────────────────────────────────
    if (action === 'saveQuizResult') {
      const { topicId, score, totalQ, passed, weakAreas } = body;
      const topic = subject.topics.id(topicId);
      if (!topic) return NextResponse.json({ message: 'Topic not found' }, { status: 404 });

      topic.quizAttempts.push({ score, totalQ, passed, weakAreas: weakAreas || [] });
      topic.bestScore = Math.max(topic.bestScore || 0, score);

      if (passed) {
        topic.status      = 'completed';
        topic.completedAt = new Date();
      }

      // Check if all topics complete → subject done
      const allDone = subject.topics.every(t => t.status === 'completed');
      if (allDone) subject.isCompleted = true;

      await subject.save();
      return NextResponse.json({ topic, allTopicsDone: allDone }, { status: 200 });
    }

    // ── Save full syllabus quiz result ────────────────────────────────────────
    if (action === 'saveFullQuiz') {
      const { score, weakAreas } = body;
      subject.fullQuizDone      = true;
      subject.fullQuizScore     = score;
      subject.fullQuizWeakAreas = weakAreas || [];
      await subject.save();
      return NextResponse.json({ subject }, { status: 200 });
    }

    // ── Update subject notes ──────────────────────────────────────────────────
    if (action === 'updateSubjectNotes') {
      const { syllabusNotes, weakPoints, importantPoints } = body;
      if (syllabusNotes   !== undefined) subject.syllabusNotes   = syllabusNotes;
      if (weakPoints      !== undefined) subject.weakPoints      = weakPoints;
      if (importantPoints !== undefined) subject.importantPoints = importantPoints;
      await subject.save();
      return NextResponse.json({ subject }, { status: 200 });
    }

    // ── Delete single topic ───────────────────────────────────────────────────
    if (action === 'deleteTopic') {
      const { topicId } = body;
      subject.topics = subject.topics.filter(t => t._id.toString() !== topicId);
      await subject.save();
      return NextResponse.json({ subject }, { status: 200 });
    }

    return NextResponse.json({ message: 'Unknown action' }, { status: 400 });
  } catch (err) {
    console.error('[TOPICS PATCH]', err);
    return NextResponse.json({ message: err.message || 'Failed' }, { status: 500 });
  }
} 