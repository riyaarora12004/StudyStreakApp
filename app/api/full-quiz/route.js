import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { GoogleGenAI } from '@google/genai';
import connectDB from '@/lib/mongodb';
import Subject from '@/models/Subject';
 
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

// ── POST /api/full-quiz — generate quiz questions ─────────────────────────────
export async function POST(request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const { subjectId } = await request.json();
    await connectDB();

    const subject = await Subject.findOne({ _id: subjectId, userId: session.user.id });
    if (!subject) return NextResponse.json({ message: 'Subject not found' }, { status: 404 });

    const completedTopics = subject.topics.filter(t => t.status === 'completed');
    if (completedTopics.length < 2) {
      return NextResponse.json(
        { message: 'Complete at least 2 topics before taking the full syllabus quiz.' },
        { status: 400 }
      );
    }

    // Build context from all topics, notes, weak points
    const topicContext = completedTopics.map(t =>
      `- ${t.name}${t.importantPoints ? ` (Key: ${t.importantPoints.slice(0,100)})` : ''}${t.weakPoints ? ` (Weak: ${t.weakPoints.slice(0,80)})` : ''}`
    ).join('\n');

    const subjectContext = [
      subject.syllabusNotes   ? `Syllabus: ${subject.syllabusNotes.slice(0,300)}`   : '',
      subject.importantPoints ? `Key points: ${subject.importantPoints.slice(0,200)}` : '',
      subject.weakPoints      ? `Weak areas: ${subject.weakPoints.slice(0,200)}`      : '',
    ].filter(Boolean).join('\n');

    const numQ = Math.min(20, Math.max(10, completedTopics.length * 2));

    const prompt = `You are an expert examiner. Generate a comprehensive ${numQ}-question final exam quiz.

SUBJECT: ${subject.name}
COMPLETED TOPICS:
${topicContext}
${subjectContext ? `\nCONTEXT:\n${subjectContext}` : ''}

Generate ${numQ} MCQ questions covering ALL topics evenly. Include harder questions that test deep understanding.

Return ONLY valid JSON array, no markdown, no backticks:
[
  {
    "question": "Question text?",
    "topic": "Which topic this tests",
    "difficulty": "easy|medium|hard",
    "options": ["Option A", "Option B", "Option C", "Option D"],
    "correct": 0,
    "explanation": "Why this answer is correct (1-2 sentences)"
  }
]`;

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
    });
    const raw = response.text.trim();

    let questions;
    try {
      const cleaned = raw.replace(/^```json\s*/i,'').replace(/^```\s*/i,'').replace(/\s*```$/i,'').trim();
      questions = JSON.parse(cleaned);
      if (!Array.isArray(questions)) throw new Error('Not array');
    } catch {
      return NextResponse.json({ message: 'AI error generating quiz. Try again.' }, { status: 500 });
    }

    return NextResponse.json({ questions, totalTopics: completedTopics.length }, { status: 200 });

  } catch (err) {
    console.error('[FULL QUIZ POST]', err);
    return NextResponse.json({ message: err.message || 'Failed' }, { status: 500 });
  }
}

// ── PUT /api/full-quiz — save results + generate AI analysis ──────────────────
export async function PUT(request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const { subjectId, score, answers, questions } = await request.json();
    await connectDB();

    const subject = await Subject.findOne({ _id: subjectId, userId: session.user.id });
    if (!subject) return NextResponse.json({ message: 'Subject not found' }, { status: 404 });

    // Analyze results by topic
    const topicScores = {};
    questions.forEach((q, i) => {
      const topic = q.topic || 'General';
      if (!topicScores[topic]) topicScores[topic] = { correct: 0, total: 0 };
      topicScores[topic].total++;
      if (answers[i] === q.correct) topicScores[topic].correct++;
    });

    const weakAreas = Object.entries(topicScores)
      .filter(([_, s]) => s.correct / s.total < 0.7)
      .map(([topic, s]) => ({
        topic,
        score: Math.round((s.correct / s.total) * 100),
        correct: s.correct,
        total: s.total,
      }))
      .sort((a, b) => a.score - b.score);

    const strongAreas = Object.entries(topicScores)
      .filter(([_, s]) => s.correct / s.total >= 0.7)
      .map(([topic, s]) => ({
        topic,
        score: Math.round((s.correct / s.total) * 100),
      }))
      .sort((a, b) => b.score - a.score);

    // Generate AI analysis
    const weakSummary = weakAreas.map(w => `${w.topic}: ${w.score}%`).join(', ');
    const strongSummary = strongAreas.slice(0, 3).map(s => `${s.topic}: ${s.score}%`).join(', ');

    const analysisPrompt = `A student just completed a full syllabus quiz for "${subject.name}".

Overall score: ${score}%
Weak areas (below 70%): ${weakSummary || 'None'}
Strong areas: ${strongSummary || 'None'}
Total questions: ${questions.length}

Write a personalized 4-part study analysis. Return ONLY valid JSON, no markdown:
{
  "overallFeedback": "2-3 sentences of honest, encouraging feedback on overall performance",
  "weakAreaAdvice": [
    { "topic": "topic name", "advice": "specific 1-sentence study advice for this weak area" }
  ],
  "studyPlan": "3-4 sentence recommended study plan focusing on weak areas first, then revision",
  "motivationalNote": "1 powerful motivational sentence personalized to their score"
}`;

    let analysis = null;
    try {
      const analysisResponse = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: analysisPrompt,
      });
      const rawAnalysis = analysisResponse.text.trim();
      const cleanedAnalysis = rawAnalysis.replace(/^```json\s*/i,'').replace(/^```\s*/i,'').replace(/\s*```$/i,'').trim();
      analysis = JSON.parse(cleanedAnalysis);
    } catch {
      analysis = {
        overallFeedback: `You scored ${score}% on the full ${subject.name} quiz.`,
        weakAreaAdvice: weakAreas.map(w => ({ topic: w.topic, advice: `Review this topic and practice more questions.` })),
        studyPlan: `Focus on your weak areas first, then do a complete revision before your exam.`,
        motivationalNote: score >= 70 ? `Great work! Keep pushing forward!` : `Every expert was once a beginner. Review and retry!`,
      };
    }

    // Save to subject
    subject.fullQuizDone      = true;
    subject.fullQuizScore     = score;
    subject.fullQuizWeakAreas = weakAreas.map(w => w.topic);
    await subject.save();

    return NextResponse.json({
      score,
      weakAreas,
      strongAreas,
      topicScores,
      analysis,
    }, { status: 200 });

  } catch (err) {
    console.error('[FULL QUIZ PUT]', err);
    return NextResponse.json({ message: err.message || 'Failed to save results' }, { status: 500 });
  }
}