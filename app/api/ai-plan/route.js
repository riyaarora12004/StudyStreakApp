import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route'; // ← ADD THIS
import connectDB from '@/lib/mongodb';
import Subject from '@/models/Subject';
import StudyPlan from '@/models/StudyPlan';
import { GoogleGenAI } from "@google/genai";

const genAI = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
});
 
export async function GET() {
  try {
    const session = await getServerSession(authOptions); // ← ADD authOptions
    if (!session?.user?.id) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }
    await connectDB();
    const plan = await StudyPlan.findOne({ userId: session.user.id }).sort({ createdAt: -1 });
    return NextResponse.json({ plan }, { status: 200 });
  } catch (err) {
    console.error('[AI PLAN GET ERROR]', err);
    return NextResponse.json({ message: 'Failed to fetch plan' }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const session = await getServerSession(authOptions); // ← ADD authOptions
    if (!session?.user?.id) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const { availableHours = 4 } = await request.json();
    await connectDB();

    const subjects = await Subject.find({ userId: session.user.id, isCompleted: false });
    if (!subjects.length) {
      return NextResponse.json(
        { message: 'Please add at least one subject before generating a plan.' },
        { status: 400 }
      );
    }

    const subjectSummary = subjects.map(s => {
    const remaining = s.totalChapters - s.completedChapters;
    const days = Math.max(
        1,
        Math.ceil((new Date(s.examDate) - new Date()) / 86400000)
    );

    let urgency;
    if (days <= 3) urgency = "extremely urgent";
    else if (days <= 7) urgency = "urgent";
    else urgency = "normal";

    return `
    - ${s.name} (${s.emoji})
    Chapters left: ${remaining}
    Exam in: ${days} days (${urgency})
    Priority: ${s.priority}
    Daily target: ${s.dailyTargetHours}h
    Student notes: ${s.notes?.trim() || "None"}
    `;
    }).join('\n');

    const today    = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);
    const fmtDate  = (d) => d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });

    const prompt = `You are an expert study planner AI for a student app. Generate a focused 2-day study plan.

STUDENT'S SUBJECTS:
${subjectSummary}

CONSTRAINTS:
- Available study hours per day: ${availableHours} hours
- Today: ${fmtDate(today)}
- Tomorrow: ${fmtDate(tomorrow)}
- Prioritize subjects with urgent exam dates and high priority
- Each task should have a specific topic to study
- Keep tasks between 0.5h and 3h each

IMPORTANT: Respond ONLY with valid JSON. No markdown, no backticks, no extra text. Just raw JSON like this:
{
  "aiMessage": "2-sentence motivational message for the student",
  "days": [
    {
      "label": "Today",
      "date": "${today.toISOString()}",
      "motivation": "Short motivational quote",
      "tasks": [
        {
          "subjectName": "Mathematics",
          "emoji": "📐",
          "color": "#7c3aed",
          "topic": "Differential Calculus - Chain Rule",
          "hours": 1.5,
          "priority": "high",
          "tip": "Focus on practice problems"
        }
      ]
    },
    {
      "label": "Tomorrow",
      "date": "${tomorrow.toISOString()}",
      "motivation": "Short motivational quote",
      "tasks": []
    }
  ]
}`;

    // ── Gemini API call ───────────────────────────────────────────────────────
    const response = await genAI.models.generateContent({
  model: "gemini-3-flash-preview",
  contents: prompt,
});

const rawText = response.text;

    // ── Parse response ────────────────────────────────────────────────────────
    let planData;
    try {
      // Strip any accidental markdown
      const cleaned = rawText
        .replace(/^```json\s*/i, '')
        .replace(/^```\s*/i, '')
        .replace(/\s*```$/i, '')
        .trim();
      planData = JSON.parse(cleaned);
    } catch (parseErr) {
      console.error('[AI PARSE ERROR] Raw text:', rawText);
      return NextResponse.json(
        { message: 'AI returned invalid JSON. Please try again.' },
        { status: 500 }
      );
    }

    // Attach subject IDs + calculate totalHours
    planData.days = planData.days.map(day => {
      const tasks = (day.tasks || []).map(task => {
        const match = subjects.find(s =>
          s.name.toLowerCase() === task.subjectName.toLowerCase()
        );
        return {
          ...task,
          subjectId: match?._id?.toString() || '',
          color:     match?.color || task.color || '#7c3aed',
          emoji:     match?.emoji || task.emoji || '📚',
        };
      });
      return {
        ...day,
        tasks,
        totalHours: tasks.reduce((a, t) => a + (t.hours || 0), 0),
      };
    });

    const saved = await StudyPlan.create({
      userId:         session.user.id,
      availableHours: Number(availableHours),
      days:           planData.days,
      aiMessage:      planData.aiMessage || '',
    });

    return NextResponse.json({ plan: saved }, { status: 201 });

  } catch (err) {
    console.error('[AI PLAN POST ERROR]', err.message);
    return NextResponse.json(
      { message: err.message || 'Failed to generate plan.' },
      { status: 500 }
    );
  }
} 