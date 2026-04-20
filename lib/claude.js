import Anthropic from '@anthropic-ai/sdk';

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export const AGENT_SYSTEM_PROMPT = `Eres un agente de planificación estratégica que ayuda a los usuarios a clarificar y definir sus metas a largo plazo.

Tu objetivo es guiar al usuario a través de 3-5 preguntas para entender:
1. **Por qué** quieren lograr esta meta (motivación profunda)
2. **Criterios de éxito** — cómo sabrán que lo lograron
3. **Horizonte temporal** — en qué plazo esperan conseguirlo

Sé conciso, empático y directo. Haz una sola pregunta a la vez. Cuando tengas suficiente información, resume la meta con los campos: título, por qué, criterios de éxito y horizonte.

Responde siempre en el mismo idioma que el usuario.`;

/**
 * Streams a Claude response to a WritableStream/TransformStream.
 * Called from the API route.
 *
 * @param {Array<{role: 'user'|'assistant', content: string}>} messages
 * @param {string} [systemPrompt]
 * @returns {AsyncIterable<string>} — stream of text chunks
 */
export async function* streamChat(messages, systemPrompt = AGENT_SYSTEM_PROMPT) {
  const stream = await client.messages.stream({
    model: 'claude-sonnet-4-6',
    max_tokens: 1024,
    system: systemPrompt,
    messages,
  });

  for await (const chunk of stream) {
    if (
      chunk.type === 'content_block_delta' &&
      chunk.delta?.type === 'text_delta'
    ) {
      yield chunk.delta.text;
    }
  }
}

/**
 * Asks Claude to propose weekly objectives for an approved meta as JSON.
 *
 * @param {object} metaSummary - { title, why, success, horizon }
 * @param {string} [lang] - 'es' | 'en'
 * @returns {Promise<Array<{title: string, color: string, weeklyLoad: number}>>}
 */
export async function proposeObjetivos(metaSummary, lang = 'es') {
  const prompt =
    lang === 'en'
      ? `Given the following goal, propose 3-5 weekly objectives that would help achieve it. Return ONLY a valid JSON array of objects with keys: "title" (string), "color" (one of: blush, peach, sand, moss, lagoon, sky, violet, graphite), "weeklyLoad" (integer 1-7). No extra text, just the JSON array.

Goal: ${JSON.stringify(metaSummary)}`
      : `Dado el siguiente meta, propón 3-5 objetivos semanales que ayudarían a lograrlo. Devuelve SOLO un array JSON válido de objetos con las claves: "title" (string), "color" (uno de: blush, peach, sand, moss, lagoon, sky, violet, graphite), "weeklyLoad" (entero 1-7). Sin texto extra, solo el array JSON.

Meta: ${JSON.stringify(metaSummary)}`;

  const message = await client.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 1024,
    messages: [{ role: 'user', content: prompt }],
  });

  const text = message.content[0]?.text ?? '[]';
  try {
    return JSON.parse(text);
  } catch {
    // Attempt to extract JSON array from text
    const match = text.match(/\[[\s\S]*\]/);
    if (match) return JSON.parse(match[0]);
    return [];
  }
}
