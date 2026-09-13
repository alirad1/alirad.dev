/* Server-sent event helpers. The widget reads this protocol:

     event: meta      sources, model, timings so far
     event: token     one fragment of the answer
     event: fallback  the sources verbatim, when the model is unavailable
     event: done      citations, timings, tokens, neurons, cost
     event: error     a code the widget turns into a sentence
*/

const encoder = new TextEncoder();

export type SseEvent = 'meta' | 'token' | 'fallback' | 'done' | 'error';

export function encode(event: SseEvent, data: unknown): Uint8Array {
  return encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
}

export function sseHeaders(origin: string | null): HeadersInit {
  return {
    'content-type': 'text/event-stream; charset=utf-8',
    'cache-control': 'no-cache, no-transform',
    connection: 'keep-alive',
    'x-accel-buffering': 'no',
    ...(origin ? { 'access-control-allow-origin': origin } : {}),
  };
}

/** Parses the `data:` payloads out of an SSE byte stream. */
export function sseLines(chunk: string): string[] {
  return chunk
    .split('\n')
    .filter((line) => line.startsWith('data:'))
    .map((line) => line.slice(5).trim());
}
