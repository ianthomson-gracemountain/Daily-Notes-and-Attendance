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
