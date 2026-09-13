/* Embeds every corpus chunk and upserts it into Vectorize.

   Runs behind a shared secret, triggered by hand after a corpus change. The
   same AI binding embeds here and at query time, so index-time and query-time
   vectors can never drift apart. */

import { chunks } from './corpus.js';
import { runAI, type EmbedResponse } from './ai.js';
import { tokensOf, neuronsFor } from './cost.js';

const BATCH = 50;

export type IngestResult = {
  upserted: number;
  deleted: number;
  batches: number;
  ms: number;
  neurons: number;
};

export async function ingest(env: Env): Promise<IngestResult> {
  const started = Date.now();
  let upserted = 0;
  let batches = 0;
  let tokens = 0;

  for (let i = 0; i < chunks.length; i += BATCH) {
    const batch = chunks.slice(i, i + BATCH);
    const texts = batch.map((c) => `${c.title}. ${c.text}`);

    const embedded = await runAI<EmbedResponse>(env, env.EMBED_MODEL, { text: texts });
    tokens += texts.reduce((sum, t) => sum + tokensOf(t), 0);

    await env.VECTORIZE.upsert(
      batch.map((chunk, n) => ({
        id: chunk.id,
        values: embedded.data[n]!,
        metadata: { kind: chunk.kind, title: chunk.title },
      })),
    );

    upserted += batch.length;
    batches += 1;
  }

  const deleted = await deleteStale(env);

  return {
    upserted,
    deleted,
    batches,
    ms: Date.now() - started,
    neurons: Math.round(neuronsFor(env.EMBED_MODEL, tokens)),
  };
}

/* Vectorize has no "list all ids", so stale entries are found by probing with
   a couple of embeddings and removing any hit the corpus no longer contains.
   The corpus only ever loses a chunk when Ali removes something from the site,
   so this is a tidy-up, not a hot path. */
async function deleteStale(env: Env): Promise<number> {
  const live = new Set(chunks.map((c) => c.id));
  const stale = new Set<string>();

  const probes = ['Ali Rad projects and experience', 'AliBot retrieval architecture and clubs'];

  for (const probe of probes) {
    try {
      const embedding = await runAI<EmbedResponse>(env, env.EMBED_MODEL, { text: [probe] });
      const result = await env.VECTORIZE.query(embedding.data[0]!, { topK: 100 });
      for (const match of result.matches) {
        if (!live.has(match.id)) stale.add(match.id);
      }
    } catch (err) {
      console.log(JSON.stringify({ type: 'ingest_probe_failed', error: String(err) }));
    }
  }

  if (stale.size === 0) return 0;
  await env.VECTORIZE.deleteByIds([...stale]);
  return stale.size;
}
