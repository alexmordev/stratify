import Anthropic from '@anthropic-ai/sdk';
import fs from 'fs';
import path from 'path';

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export const AGENT_01_SYSTEM_PROMPT = fs.readFileSync(
  path.join(process.cwd(), 'docs', 'agent_pm_metas.md'),
  'utf8'
);

export const AGENT_02_SYSTEM_PROMPT = fs.readFileSync(
  path.join(process.cwd(), 'docs', 'agent_pm_hitos.md'),
  'utf8'
);

export const AGENT_03_SYSTEM_PROMPT = fs.readFileSync(
  path.join(process.cwd(), 'docs', 'agent_pm_objetivos.md'),
  'utf8'
);

/**
 * Streams a Claude response chunk by chunk.
 * @param {Array<{role: 'user'|'assistant', content: string}>} messages
 * @param {string} [systemPrompt]
 * @returns {AsyncIterable<string>}
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
 * Proposes quarterly milestones (hitos) for an approved meta.
 * Returns a JSON array of hito objects.
 *
 * @param {object} metaSummary - { title, horizon, why, obstaculo_interno, plan_respuesta }
 * @returns {Promise<Array>}
 */
export async function proposeHitos(metaSummary) {
  const payload = {
    title: metaSummary.title ?? '',
    horizon: metaSummary.horizon ?? metaSummary.horizonte ?? '',
    why: metaSummary.why ?? metaSummary.motivacion ?? '',
    obstaculo_interno: metaSummary.obstaculo_interno ?? '',
    plan_respuesta: metaSummary.plan_respuesta ?? '',
    startDate: new Date().toISOString().slice(0, 10),
  };

  const message = await client.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 4096,
    system: AGENT_02_SYSTEM_PROMPT,
    messages: [{ role: 'user', content: JSON.stringify(payload) }],
  });

  const text = message.content[0]?.text ?? '[]';
  return parseJsonArray(text);
}

/**
 * Proposes 12 weekly objectives for a specific hito.
 * Returns a JSON array of 12 objective objects.
 *
 * @param {object} meta - { title, horizon, why, obstaculo_interno }
 * @param {object} hito - { arc, enunciado, criterio_verificacion, fecha_objetivo, puente_con_meta }
 * @returns {Promise<Array>}
 */
export async function proposeObjetivosForHito(meta, hito) {
  const payload = {
    meta: {
      title: meta.title ?? '',
      horizon: meta.horizon ?? meta.horizonte ?? '',
      why: meta.why ?? meta.motivacion ?? '',
      obstaculo_interno: meta.obstaculo_interno ?? '',
    },
    hito: {
      arc: hito.arc ?? '',
      enunciado: hito.enunciado ?? '',
      criterio_verificacion: hito.criterio_verificacion ?? '',
      fecha_objetivo: hito.fecha_objetivo ?? '',
      puente_con_meta: hito.puente_con_meta ?? '',
    },
  };

  const message = await client.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 8192,
    system: AGENT_03_SYSTEM_PROMPT,
    messages: [{ role: 'user', content: JSON.stringify(payload) }],
  });

  const text = message.content[0]?.text ?? '[]';
  return parseJsonArray(text);
}

/** Robust JSON array parser with fallback extraction. */
function parseJsonArray(text) {
  try {
    const parsed = JSON.parse(text);
    return Array.isArray(parsed) ? parsed : parsed.hitos ?? parsed.objetivos ?? [];
  } catch {
    const match = text.match(/\[[\s\S]*\]/);
    if (match) {
      try { return JSON.parse(match[0]); } catch { /* fall through */ }
    }
    return [];
  }
}
