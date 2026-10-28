import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { GoogleGenAI } from '@google/genai';
 
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export async function POST(request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });

    const { syllabusText, subjectName, examBoard } = await request.json();
    if (!syllabusText && !subjectName) {
      return NextResponse.json({ message: 'Provide syllabus text or subject name.' }, { status: 400 });
    }

    const prompt = syllabusText
      ? `Extract ALL topics from this syllabus. Return ONLY a JSON array of topic name strings. No markdown, no backticks, just raw JSON array.

SYLLABUS:
${syllabusText.slice(0, 6000)}

Rules: 2-8 words per topic, 5-30 topics, no duplicates, specific and clear.
Example: ["Topic One", "Topic Two", "Topic Three"]`

      : `Generate a comprehensive topic list for: ${subjectName}${examBoard ? ` (${examBoard})` : ''}

Return ONLY a JSON array of topic name strings. No markdown, no backticks, just raw JSON array.
Rules: 2-8 words per topic, 10-20 topics, ordered logically (foundational to advanced).
Example: ["Topic One", "Topic Two", "Topic Three"]`;

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
    });
    const raw = response.text.trim();

    let topics;
    try {
      const cleaned = raw.replace(/^```json\s*/i,'').replace(/^```\s*/i,'').replace(/\s*```$/i,'').trim();
      topics = JSON.parse(cleaned);
      if (!Array.isArray(topics)) throw new Error('Not array');
      topics = topics.filter(t => typeof t === 'string' && t.trim()).map(t => t.trim());
    } catch {
      return NextResponse.json({ message: 'AI returned invalid format. Try again.' }, { status: 500 });
    }

    return NextResponse.json({ topics }, { status: 200 });
  } catch (err) {
    console.error('[EXTRACT TOPICS]', err);
    return NextResponse.json({ message: err.message || 'Failed' }, { status: 500 });
  }
}