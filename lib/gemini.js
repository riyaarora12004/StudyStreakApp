import { GoogleGenAI } from '@google/genai';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

/**
 * Wrapper around Gemini with friendly error messages
 * @param {string} prompt
 * @param {object} options
 * @returns {Promise<string>} text response
 */
export async function generateAI(prompt, options = {}) {
  const model = options.model || 'gemini-3-flash-preview';

  try {
    const response = await ai.models.generateContent({
      model,
      contents: prompt,
    });
    return response.text;
  } catch (err) {
    const msg = err?.message || '';

    // Rate limit / quota exceeded
    if (msg.includes('RESOURCE_EXHAUSTED') || msg.includes('quota') || msg.includes('rate') || msg.includes('429')) {
      const retryMatch = msg.match(/retry in (\d+)/i);
      const waitSecs   = retryMatch ? parseInt(retryMatch[1]) : 60;
      throw new AIError(
        waitSecs > 50
          ? `Daily AI quota exceeded. Please try again tomorrow or upgrade your Gemini API plan at https://aistudio.google.com/apikey`
          : `AI is busy right now. Please wait ${waitSecs} seconds and try again.`,
        'QUOTA_EXCEEDED',
        429
      );
    }

    // Invalid API key
    if (msg.includes('API_KEY_INVALID') || msg.includes('401')) {
      throw new AIError(
        'Invalid Gemini API key. Please check your GEMINI_API_KEY in .env.local',
        'INVALID_KEY',
        401
      );
    }

    // Model not found
    if (msg.includes('NOT_FOUND') || msg.includes('404')) {
      throw new AIError(
        'AI model not available. Please try again.',
        'MODEL_NOT_FOUND',
        404
      );
    }

    // Generic fallback
    throw new AIError(
      'AI service temporarily unavailable. Please try again in a moment.',
      'AI_ERROR',
      500
    );
  }
}

export class AIError extends Error {
  constructor(message, code, status) {
    super(message);
    this.name   = 'AIError';
    this.code   = code;
    this.status = status;
  }
}