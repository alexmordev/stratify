import Anthropic from '@anthropic-ai/sdk';
import fs from 'fs';
import path from 'path';

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export const AGENT_01_SYSTEM_PROMPT = fs.readFileSync(
  path.join(process.cwd(), 'docs', 'agente_01_meta_superordinada.md'),
  'utf8'
);

export const AGENT_02_SYSTEM_PROMPT = fs.readFileSync(
  path.join(process.cwd(), 'docs', 'agente_02_objetivos_subordinados.md'),
  'utf8'
);

/**
 * Streams a Claude response to a WritableStream/TransformStream.
 * Called from the API route.
 *
 * @param {Array<{role: 'user'|'assistant', content: string}>} messages
 * @param {string} [systemPrompt]
 * @returns {AsyncIterable<string>} — stream of text chunks
 */
export async function* streamChat(messages, systemPrompt = AGENT_01_SYSTEM_PROMPT) {
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
      ? `The following goal has been validated by the user. Apply your full methodology as a subordinate objectives constructor to propose the objectives this goal genuinely requires — let the goal determine the number, do not cap it arbitrarily.

Return ONLY a valid JSON array of objects with these exact keys:
- "area": short name of the focus area (string, e.g. "Technical skills")
- "tipo": "Learning" or "Performance" — Learning if the person lacks the base skill, Performance if they already have it
- "title": full objective statement in first person, specific and measurable, with a clear deadline (string)
- "conexion": one sentence explaining why this objective directly and measurably advances the goal (string)
- "plazo": specific timeframe for this objective (string, e.g. "3 months", "before October 2026")
- "siEntonces": implementation intention using a natural, predictable trigger — "If [concrete signal/situation], then [specific action]." (string)
- "seguimiento": tracking system — the exact metric to review, how often, and how (string)
- "color": one of: blush, peach, sand, moss, lagoon, sky, violet, graphite
- "weeklyLoad": realistic weekly hours this objective requires (integer 1-7)

No extra text, just the JSON array.

Goal: ${JSON.stringify(metaSummary)}`
      : `La siguiente meta ha sido validada por el usuario. Aplica tu metodología completa como constructor de objetivos subordinados para proponer los objetivos que esta meta genuinamente requiere — deja que la meta determine el número, no lo limites arbitrariamente.

Devuelve SOLO un array JSON válido de objetos con estas claves exactas:
- "area": nombre corto del área de enfoque (string, ej: "Habilidades técnicas")
- "tipo": "Aprendizaje" o "Rendimiento" — Aprendizaje si la persona carece de la habilidad base, Rendimiento si ya la tiene
- "title": enunciado completo del objetivo en primera persona, específico y medible, con plazo claro (string)
- "conexion": una oración explicando por qué este objetivo avanza directa y mediblemente hacia la meta (string)
- "plazo": horizonte temporal específico de este objetivo (string, ej: "3 meses", "antes de octubre 2026")
- "siEntonces": intención de implementación con un disparador natural y predecible — "Si [señal/situación concreta], entonces [acción específica]." (string)
- "seguimiento": sistema de seguimiento — la métrica exacta a revisar, con qué frecuencia y cómo (string)
- "color": uno de: blush, peach, sand, moss, lagoon, sky, violet, graphite
- "weeklyLoad": horas semanales realistas que requiere este objetivo (entero 1-7)

Sin texto extra, solo el array JSON.

Meta: ${JSON.stringify(metaSummary)}`;

  const message = await client.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 4096,
    system: AGENT_02_SYSTEM_PROMPT,
    messages: [{ role: 'user', content: prompt }],
  });

  const text = message.content[0]?.text ?? '[]';
  try {
    return JSON.parse(text);
  } catch {
    const match = text.match(/\[[\s\S]*\]/);
    if (match) return JSON.parse(match[0]);
    return [];
  }
}
