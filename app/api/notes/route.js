import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import connectDB from '@/lib/mongodb';
import Subject from '@/models/Subject';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });

    await connectDB();

    const subjects = await Subject.find({ userId: session.user.id })
      .select('name emoji color examDate syllabusNotes weakPoints importantPoints topics')
      .lean();

    // Build a flat notes structure
    const result = subjects.map(sub => {
      const topicNotes = (sub.topics || [])
        .filter(t => t.weakPoints || t.importantPoints)
        .map(t => ({
          topicId:        t._id,
          topicName:      t.name,
          status:         t.status,
          weak:           t.weakPoints || '',
          important:      t.importantPoints || '',
          bestScore:      t.bestScore || null,
        }));

      return {
        subjectId:    sub._id,
        subjectName:  sub.name,
        subjectEmoji: sub.emoji,
        subjectColor: sub.color,
        examDate:     sub.examDate,
        subjectNotes: {
          syllabus:  sub.syllabusNotes  || '',
          weak:      sub.weakPoints     || '',
          important: sub.importantPoints|| '',
        },
        topicNotes,
        hasAnyNotes: !!(sub.syllabusNotes || sub.weakPoints || sub.importantPoints || topicNotes.length),
      };
    }).filter(s => s.hasAnyNotes);

    const totalTopicNotes   = result.reduce((a, s) => a + s.topicNotes.length, 0);
    const totalSubjectNotes = result.filter(s => s.subjectNotes.syllabus || s.subjectNotes.weak || s.subjectNotes.important).length;

    return NextResponse.json({ notes: result, totalTopicNotes, totalSubjectNotes }, { status: 200 });
  } catch (err) {
    console.error('[NOTES GET]', err);
    return NextResponse.json({ message: 'Failed' }, { status: 500 });
  }
}