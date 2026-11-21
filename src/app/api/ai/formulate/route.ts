import { NextRequest, NextResponse } from 'next/server';
import { callLLMJson, isLLMConfigured } from '@/lib/llm';
import { generateFallbackBullets } from '@/lib/fallbackAI';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { company = '', position = '', rawDescription = '', targetPosition = '', tone = 'dynamic' } = body;

    if (!isLLMConfigured()) {
      // Smart fallback mode without requiring API key
      const bullets = generateFallbackBullets(position, company, rawDescription, tone);
      return NextResponse.json({ bullets });
    }

    const systemPrompt = `You are an expert executive resume writer and career consultant.
Your task is to transform raw job duty notes into powerful, achievement-oriented bullet points for a Russian resume.

Rules:
1. Always write in Russian.
2. Begin each bullet with a strong action verb (e.g., Разработал, Внедрил, Оптимизировал, Руководил).
3. Focus on responsibility, scale, and business outcome.
4. Do NOT hallucinate specific numbers (such as exact percentages or dollar revenues) unless the user explicitly provided them in the raw notes.
5. Tone:
   - "formal": Strictly formal business Russian, professional corporate terminology.
   - "dynamic": Modern, energetic, outcome-focused Russian, proactive wording.
   - "concise": Crisp, punchy, telegraphic style (max 10-12 words per bullet).
6. Return ONLY valid JSON in format: { "bullets": ["bullet 1", "bullet 2", "bullet 3"] }`;

    const userPrompt = `Целевая должность: ${targetPosition || position}
Компания: ${company}
Должность: ${position}
Черновые заметки:
${rawDescription || 'Стандартные обязанности по должности'}`;

    try {
      const content = await callLLMJson({ system: systemPrompt, user: userPrompt, maxTokens: 600 });
      if (!content) throw new Error('No LLM configured');

      const parsed = JSON.parse(content);
      const llmBullets: string[] = Array.isArray(parsed.bullets)
        ? parsed.bullets.filter((b: unknown): b is string => typeof b === 'string' && b.trim() !== '')
        : [];
      const bullets = llmBullets.length > 0
        ? llmBullets
        : generateFallbackBullets(position, company, rawDescription, tone);

      return NextResponse.json({ bullets });
    } catch (llmError) {
      console.warn('LLM call failed or timed out, using smart fallback:', llmError);
      const bullets = generateFallbackBullets(position, company, rawDescription, tone);
      return NextResponse.json({ bullets, fallback: true });
    }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
