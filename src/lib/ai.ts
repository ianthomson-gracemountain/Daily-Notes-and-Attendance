export interface AIEnhanceResult {
  success: boolean;
  enhanced?: string;
  error?: string;
}

const SYSTEM_PROMPT = `You are a writing assistant for a foster care service provider's daily notes.
Your job is to improve the grammar, spelling, punctuation, and professional clarity of the note provided.

Rules:
- Do NOT change the meaning of any statement
- Do NOT add medical or clinical terminology not present in the original
- Do NOT add facts, observations, or details not stated in the original
- Do NOT remove any information from the original
- Keep the tone professional but warm
- Maintain first-person or third-person voice as used in the original
- Return ONLY the improved text, with no preamble or explanation`;

export async function enhanceNote(
  originalText: string,
  apiKey: string
): Promise<AIEnhanceResult> {
  if (!apiKey) {
    return { success: false, error: 'No API key configured' };
  }

  if (!originalText.trim()) {
    return { success: false, error: 'No text to enhance' };
  }

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user', content: originalText },
        ],
        temperature: 0.3,
        max_tokens: 1000,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const message = (errorData as { error?: { message?: string } })?.error?.message || `API error: ${response.status}`;
      return { success: false, error: message };
    }

    const data = await response.json() as {
      choices: Array<{ message: { content: string } }>;
    };
    const enhanced = data.choices?.[0]?.message?.content?.trim();

    if (!enhanced) {
      return { success: false, error: 'No response from AI' };
    }

    return { success: true, enhanced };
  } catch (error) {
    return { success: false, error: String(error) };
  }
}

export interface AIAnalysisResult {
  success: boolean;
  analysis?: string;
  error?: string;
}

const ANALYSIS_PROMPT = `You are analyzing daily service notes written by a foster care service provider about their clients.

Review the notes below and provide a concise synopsis of patterns you observe. Focus on:
- Attendance patterns (frequency of services vs. absences)
- Recurring themes in client activities or behaviors
- Notable changes or trends over time
- Any concerns or positive developments worth highlighting

Keep your response to 3-5 short paragraphs. Use professional, objective language. Do not use bullet points. Do not repeat the notes back. Focus only on patterns and insights.`;

export async function analyzeNotePatterns(
  notes: Array<{ date: string; clientName: string; servicesProvided: boolean; notes: string }>,
  apiKey: string
): Promise<AIAnalysisResult> {
  if (!apiKey) {
    return { success: false, error: 'No API key configured. Add one in Settings.' };
  }
  if (notes.length < 3) {
    return { success: false, error: 'Need at least 3 notes to analyze patterns.' };
  }

  const notesSummary = notes
    .slice(0, 60)
    .map(n => `[${n.date}] ${n.clientName} — ${n.servicesProvided ? 'Services provided' : 'Absent'}: ${n.notes}`)
    .join('\n\n');

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: ANALYSIS_PROMPT },
          { role: 'user', content: notesSummary },
        ],
        temperature: 0.4,
        max_tokens: 1500,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const message = (errorData as { error?: { message?: string } })?.error?.message || `API error: ${response.status}`;
      return { success: false, error: message };
    }

    const data = await response.json() as {
      choices: Array<{ message: { content: string } }>;
    };
    const analysis = data.choices?.[0]?.message?.content?.trim();

    if (!analysis) {
      return { success: false, error: 'No response from AI' };
    }

    return { success: true, analysis };
  } catch (error) {
    return { success: false, error: String(error) };
  }
}

/**
 * Test if an OpenAI API key is valid by making a minimal request.
 */
export async function testApiKey(apiKey: string): Promise<{ valid: boolean; error?: string }> {
  try {
    const response = await fetch('https://api.openai.com/v1/models/gpt-4o-mini', {
      headers: {
        'Authorization': `Bearer ${apiKey}`,
      },
    });

    if (response.ok) {
      return { valid: true };
    }

    const errorData = await response.json().catch(() => ({}));
    const message = (errorData as { error?: { message?: string } })?.error?.message || `Error: ${response.status}`;
    return { valid: false, error: message };
  } catch (error) {
    return { valid: false, error: String(error) };
  }
}
