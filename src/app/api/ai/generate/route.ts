import { NextRequest, NextResponse } from 'next/server';
import { callLLMJson, isLLMConfigured, parseJsonLoose } from '@/lib/llm';
import { generateFallbackAIContent, type ExperienceInput, type EducationInput } from '@/lib/fallbackAI';

// Reasoning models can take a while; Vercel's default limit would cut them off
export const maxDuration = 30;

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      targetPosition = '',
      age = null,
      hasNoExperience = false,
      tone = 'dynamic',
      experience = [],
      education = [],
      skills = [],
    } = body;

    if (!isLLMConfigured()) {
      const fallback = generateFallbackAIContent(
        targetPosition,
        age,
        hasNoExperience,
        tone,
        experience,
        education,
        skills
      );
      return NextResponse.json({ ...fallback, fallback: true });
    }

    const systemPrompt = `You are an elite career strategist, executive resume editor, and HR specialist.
Generate a structured Russian resume summary and key professional highlights (selling points).

Strict Rules:
1. Always write in Russian.
2. Tone:
   - "formal": Highly professional corporate Russian.
   - "dynamic": Modern, energetic, outcome-focused Russian.
   - "concise": Punchy, crisp, dense Russian without fluff.
3. If hasNoExperience is true: Focus on education, analytical/technical foundation, transferable skills, passion for the role.
4. If candidate has experience: Highlight business results, ownership, methodologies, tech stack.
5. Do NOT invent specific fake metrics (e.g. "увеличил выручку на 47%"), unless mentioned by the user.
6. Return ONLY valid JSON in format:
{
  "summary": "3-4 cohesive sentences",
  "highlights": ["3-5 strong bullet highlights"],
  "suggestedSkills": ["3-5 relevant skill suggestions"]
}`;

    // Anonymized payload (no names, phones, contacts)
    const sanitizedPayload = {
      targetPosition,
      age: age ? `${age} лет` : undefined,
      hasNoExperience,
      experience: experience.map((e: ExperienceInput) => ({
        company: e.company,
        position: e.position,
        period: `${e.startDate || ''} - ${e.isCurrent ? 'н.в.' : e.endDate || ''}`,
        description: e.aiBullets?.length ? e.aiBullets.join('; ') : e.rawDescription,
      })),
      education: education.map((ed: EducationInput) => ({
        institution: ed.institution,
        faculty: ed.faculty,
        level: ed.level,
        year: ed.graduationYear,
      })),
      skills,
    };

    try {
      const content = await callLLMJson({
        system: systemPrompt,
        user: JSON.stringify(sanitizedPayload),
        maxTokens: 3000,
      });
      if (!content) throw new Error('No LLM configured');

      const parsed = parseJsonLoose(content) as Record<string, unknown>;
      const toStrings = (v: unknown): string[] =>
        Array.isArray(v) ? v.filter((x): x is string => typeof x === 'string' && x.trim() !== '') : [];
      if (typeof parsed.summary !== 'string' || !parsed.summary.trim()) {
        throw new Error('LLM returned no summary');
      }
      return NextResponse.json({
        summary: parsed.summary.trim(),
        highlights: toStrings(parsed.highlights),
        suggestedSkills: toStrings(parsed.suggestedSkills),
      });
    } catch (llmErr) {
      console.warn('OpenAI generate call failed or timed out, using smart fallback:', llmErr);
      const fallback = generateFallbackAIContent(
        targetPosition,
        age,
        hasNoExperience,
        tone,
        experience,
        education,
        skills
      );
      return NextResponse.json({ ...fallback, fallback: true });
    }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
