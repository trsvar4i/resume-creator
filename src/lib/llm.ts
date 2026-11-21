/**
 * Single entry point for LLM calls. Provider is picked by which key is in .env.local:
 *   GEMINI_API_KEY (preferred) -> Google Gemini
 *   GROQ_API_KEY / OPENAI_API_KEY -> OpenAI-compatible chat completions
 * Returns null when no key is configured, so callers can use their offline fallback.
 */

interface LLMRequest {
  system: string;
  user: string;
  maxTokens?: number;
  temperature?: number;
  timeoutMs?: number;
}

export function isLLMConfigured(): boolean {
  return Boolean(process.env.GEMINI_API_KEY || process.env.GROQ_API_KEY || process.env.OPENAI_API_KEY);
}

/** Calls the configured model and returns the raw JSON text it produced (null = no key configured). */
export async function callLLMJson(req: LLMRequest): Promise<string | null> {
  const { system, user, maxTokens = 800, temperature = 0.7, timeoutMs = 15000 } = req;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const geminiKey = process.env.GEMINI_API_KEY?.trim();
    if (geminiKey) {
      const model = process.env.GEMINI_MODEL?.trim() || 'gemini-2.5-flash';
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'x-goog-api-key': geminiKey },
          body: JSON.stringify({
            systemInstruction: { parts: [{ text: system }] },
            contents: [{ role: 'user', parts: [{ text: user }] }],
            generationConfig: {
              responseMimeType: 'application/json',
              temperature,
              maxOutputTokens: maxTokens,
              // Thinking tokens would eat the output budget for these short JSON answers
              thinkingConfig: { thinkingBudget: 0 },
            },
          }),
          signal: controller.signal,
        }
      );
      if (!response.ok) throw new Error(`Gemini responded with status ${response.status}`);
      const data = await response.json();
      const text = data.candidates?.[0]?.content?.parts?.map((p: { text?: string }) => p.text ?? '').join('');
      if (!text) throw new Error('Empty response from Gemini');
      return text;
    }

    const groqKey = process.env.GROQ_API_KEY?.trim();
    const openaiKey = process.env.OPENAI_API_KEY?.trim();
    const apiKey = groqKey || openaiKey;
    if (!apiKey) return null;

    const isGroq = Boolean(groqKey || openaiKey?.startsWith('gsk_'));
    const endpoint = isGroq
      ? 'https://api.groq.com/openai/v1/chat/completions'
      : `${process.env.OPENAI_BASE_URL || 'https://api.openai.com/v1'}/chat/completions`;
    const model = isGroq
      ? process.env.GROQ_MODEL || 'llama-3.3-70b-versatile'
      : process.env.OPENAI_MODEL || 'gpt-4o-mini';

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({
        model,
        response_format: { type: 'json_object' },
        messages: [
          { role: 'system', content: system },
          { role: 'user', content: user },
        ],
        temperature,
        max_tokens: maxTokens,
      }),
      signal: controller.signal,
    });
    if (!response.ok) throw new Error(`LLM API responded with status ${response.status}`);
    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;
    if (!content) throw new Error('Empty response from LLM');
    return content;
  } finally {
    clearTimeout(timeout);
  }
}
