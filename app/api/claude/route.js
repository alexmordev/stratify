import { streamChat, proposeObjetivos, AGENT_01_SYSTEM_PROMPT } from '@/lib/claude';

export const runtime = 'nodejs';

export async function POST(request) {
  try {
    const body = await request.json();
    const { messages, mode, metaSummary, lang } = body;

    if (mode === 'propose') {
      // Single call to propose objectives — no streaming needed
      const objetivos = await proposeObjetivos(metaSummary, lang ?? 'es');
      return Response.json({ objetivos });
    }

    // Default: streaming chat
    const encoder = new TextEncoder();

    const stream = new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of streamChat(messages, AGENT_01_SYSTEM_PROMPT)) {
            controller.enqueue(encoder.encode(chunk));
          }
          controller.close();
        } catch (err) {
          controller.error(err);
        }
      },
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Transfer-Encoding': 'chunked',
        'Cache-Control': 'no-cache',
      },
    });
  } catch (err) {
    console.error('[claude route]', err);
    return Response.json({ error: err.message }, { status: 500 });
  }
}
