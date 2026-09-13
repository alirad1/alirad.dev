/* AliBot — the whole backend for the chat widget on alirad.dev.

   GET  /health        what is deployed and how much of it is indexed
   GET  /search?q=     retrieval only, as JSON: the tuning and debugging view
   POST /chat          the widget's endpoint, streamed as server-sent events
   POST /ingest        embed the bundled corpus into Vectorize (shared secret)
   cron                the same ingest, weekly, so the index cannot go stale

   Runs on the Workers free plan with no payment method on the account, so
   exhausting the daily inference allowance returns an error rather than a bill.
   Every path degrades instead of failing: see chat.ts and retrieve.ts. */

import { chunks } from './corpus.js';
import { retrieve } from './retrieve.js';
import { ingest } from './ingest.js';
import { handleChat } from './chat.js';

const JSON_HEADERS = { 'content-type': 'application/json; charset=utf-8' };

function allowedOrigin(env: Env, request: Request): string | null {
  const origin = request.headers.get('origin');
  if (!origin) return null;
  const allowed = env.ALLOWED_ORIGINS.split(',').map((o) => o.trim());
  return allowed.includes(origin) ? origin : null;
}

function corsHeaders(origin: string | null): Record<string, string> {
  return origin
    ? {
        'access-control-allow-origin': origin,
        'access-control-allow-methods': 'POST, GET, OPTIONS',
        'access-control-allow-headers': 'content-type, authorization',
        'access-control-max-age': '86400',
        vary: 'origin',
      }
    : {};
}

function json(data: unknown, status: number, origin: string | null): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...JSON_HEADERS, ...corsHeaders(origin) },
  });
}

/** Length-independent comparison, so a wrong secret leaks no timing signal. */
function secretsMatch(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    const origin = allowedOrigin(env, request);

    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: corsHeaders(origin) });
    }

    /* ── Health ────────────────────────────────────────────────────────── */

    if (url.pathname === '/health' && request.method === 'GET') {
      let indexed: number | null = null;
      try {
        const info = await env.VECTORIZE.describe();
        indexed = info.vectorsCount ?? null;
      } catch {
        indexed = null;
      }
      return json(
        {
          ok: true,
          model: env.MODEL,
          embedModel: env.EMBED_MODEL,
          rerankModel: env.RERANK_MODEL,
          chunks: chunks.length,
          indexed,
        },
        200,
        origin,
      );
    }

    /* ── Retrieval debugging ───────────────────────────────────────────── */

    if (url.pathname === '/search' && request.method === 'GET') {
      const q = url.searchParams.get('q')?.trim();
      if (!q) return json({ error: 'bad_request', detail: 'missing q' }, 400, origin);

      const result = await retrieve(env, q.slice(0, 500));
      return json(
        {
          query: q,
          degraded: result.degraded,
          timings: result.timings,
          vector: result.vector.slice(0, 6),
          keyword: result.keyword.slice(0, 6),
          fused: result.fused,
          reranked: result.reranked.map((r) => ({
            id: r.id,
            score: Number(r.score.toFixed(4)),
            title: r.chunk.title,
          })),
        },
        200,
        origin,
      );
    }

    /* ── Chat ──────────────────────────────────────────────────────────── */

    if (url.pathname === '/chat' && request.method === 'POST') {
      if (!origin) return json({ error: 'forbidden_origin' }, 403, null);
      return handleChat(request, env, origin);
    }

    /* ── Ingest ────────────────────────────────────────────────────────── */

    if (url.pathname === '/ingest' && request.method === 'POST') {
      const auth = request.headers.get('authorization') ?? '';
      const token = auth.startsWith('Bearer ') ? auth.slice(7) : '';
      if (!env.INGEST_SECRET || !secretsMatch(token, env.INGEST_SECRET)) {
        return json({ error: 'unauthorized' }, 401, origin);
      }

      try {
        const result = await ingest(env);
        return json({ ok: true, ...result }, 200, origin);
      } catch (err) {
        console.log(JSON.stringify({ type: 'ingest_failed', error: String(err) }));
        return json({ error: 'ingest_failed', detail: String(err) }, 500, origin);
      }
    }

    return json({ error: 'not_found' }, 404, origin);
  },

  /* The corpus is bundled with the Worker, so a deploy already carries new
     text; this is what refreshes the embeddings that go with it. */
  async scheduled(_event: ScheduledController, env: Env, ctx: ExecutionContext): Promise<void> {
    ctx.waitUntil(
      ingest(env)
        .then((result) => console.log(JSON.stringify({ type: 'cron_ingest', ...result })))
        .catch((err) => console.log(JSON.stringify({ type: 'cron_ingest_failed', error: String(err) }))),
    );
  },
} satisfies ExportedHandler<Env>;
