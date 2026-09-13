/* Hybrid retrieval: dense vectors from Vectorize, sparse BM25 over the bundled
   corpus, fused with reciprocal rank fusion, then reordered by a cross-encoder.

   The corpus is small (tens of chunks), so BM25 runs in the isolate in well
   under a millisecond — comfortably inside the Workers free plan's 10 ms CPU
   budget, which the awaited AI calls do not count against. */

import { chunks, byId, type Chunk } from './corpus.js';
import { runAI, type EmbedResponse, type RerankResponse } from './ai.js';

export type Scored = { id: string; score: number };

export type Retrieval = {
  vector: Scored[];
  keyword: Scored[];
  fused: string[];
  reranked: (Scored & { chunk: Chunk })[];
  timings: { embed: number; vector: number; keyword: number; rerank: number };
  degraded: 'none' | 'no-embed' | 'no-rerank';
  embedTokens: number;
  rerankTokens: number;
};

const STOPWORDS = new Set([
  'a', 'about', 'an', 'and', 'any', 'are', 'as', 'at', 'be', 'but', 'by', 'can', 'did', 'do',
  'does', 'for', 'from', 'had', 'has', 'have', 'he', 'her', 'him', 'his', 'how', 'i', 'in', 'is',
  'it', 'its', 'me', 'my', 'of', 'on', 'or', 'our', 'she', 'so', 'that', 'the', 'their', 'them',
  'then', 'there', 'they', 'this', 'to', 'too', 'us', 'was', 'we', 'were', 'what', 'when', 'where',
  'which', 'who', 'why', 'will', 'with', 'you', 'your',
]);

export function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .split(/[^a-z0-9+#.]+/)
    .map((t) => t.replace(/^[.]+|[.]+$/g, ''))
    .filter((t) => t.length > 1 && !STOPWORDS.has(t));
}

/* ── BM25 ──────────────────────────────────────────────────────────────── */

type Bm25Index = {
  docs: { id: string; length: number; freq: Map<string, number> }[];
  df: Map<string, number>;
  avgLength: number;
};

let bm25Index: Bm25Index | null = null;

/** Built once per isolate and reused across requests. */
function index(): Bm25Index {
  if (bm25Index) return bm25Index;

  const docs = chunks.map((c) => {
    const terms = tokenize(`${c.title} ${c.text}`);
    const freq = new Map<string, number>();
    for (const term of terms) freq.set(term, (freq.get(term) ?? 0) + 1);
    return { id: c.id, length: terms.length, freq };
  });

  const df = new Map<string, number>();
  for (const doc of docs) {
    for (const term of doc.freq.keys()) df.set(term, (df.get(term) ?? 0) + 1);
  }

  const avgLength = docs.reduce((sum, d) => sum + d.length, 0) / Math.max(1, docs.length);
  bm25Index = { docs, df, avgLength };
  return bm25Index;
}

export function bm25(query: string, topK = 12, k1 = 1.2, b = 0.75): Scored[] {
  const { docs, df, avgLength } = index();
  const terms = tokenize(query);
  if (terms.length === 0) return [];

  const n = docs.length;
  const scores: Scored[] = [];

  for (const doc of docs) {
    let score = 0;
    for (const term of terms) {
      const tf = doc.freq.get(term);
      if (!tf) continue;
      const idf = Math.log(1 + (n - (df.get(term) ?? 0) + 0.5) / ((df.get(term) ?? 0) + 0.5));
      score += idf * ((tf * (k1 + 1)) / (tf + k1 * (1 - b + (b * doc.length) / avgLength)));
    }
    if (score > 0) scores.push({ id: doc.id, score });
  }

  return scores.sort((a, b2) => b2.score - a.score).slice(0, topK);
}

/* ── Dense search ──────────────────────────────────────────────────────── */

export async function embed(env: Env, text: string): Promise<number[]> {
  const result = await runAI<EmbedResponse>(env, env.EMBED_MODEL, { text: [text] });
  const vector = result.data?.[0];
  if (!vector) throw new Error('embedding model returned no vector');
  return vector;
}

async function vectorSearch(env: Env, embedding: number[], topK = 12): Promise<Scored[]> {
  const result = await env.VECTORIZE.query(embedding, { topK });
  return result.matches.map((m) => ({ id: m.id, score: m.score }));
}

/* ── Fusion ────────────────────────────────────────────────────────────── */

/** Reciprocal rank fusion: rewards chunks both rankers place highly, without
    needing cosine similarity and BM25 to share a scale. */
export function rrf(lists: Scored[][], topK = 8, k = 60): string[] {
  const totals = new Map<string, number>();
  for (const list of lists) {
    list.forEach((item, rank) => {
      totals.set(item.id, (totals.get(item.id) ?? 0) + 1 / (k + rank + 1));
    });
  }
  return [...totals.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, topK)
    .map(([id]) => id);
}

/* ── Cross-encoder rerank ──────────────────────────────────────────────── */

async function rerank(
  env: Env,
  query: string,
  candidates: Chunk[],
  topK = 4,
): Promise<(Scored & { chunk: Chunk })[]> {
  const result = await runAI<RerankResponse>(env, env.RERANK_MODEL, {
    query,
    contexts: candidates.map((c) => ({ text: `${c.title}. ${c.text}` })),
  });

  return result.response
    .map((r) => ({ id: candidates[r.id]!.id, score: r.score, chunk: candidates[r.id]! }))
    .sort((a, b) => b.score - a.score)
    .slice(0, topK);
}

/* ── Pipeline ──────────────────────────────────────────────────────────── */

export async function retrieve(env: Env, query: string): Promise<Retrieval> {
  const timings = { embed: 0, vector: 0, keyword: 0, rerank: 0 };
  let degraded: Retrieval['degraded'] = 'none';
  let embedTokens = 0;

  const keywordStart = Date.now();
  const keyword = bm25(query);
  timings.keyword = Date.now() - keywordStart;

  let vector: Scored[] = [];
  try {
    const embedStart = Date.now();
    const embedding = await embed(env, query);
    timings.embed = Date.now() - embedStart;
    embedTokens = Math.ceil(query.length / 4);

    const vectorStart = Date.now();
    vector = await vectorSearch(env, embedding);
    timings.vector = Date.now() - vectorStart;
  } catch (err) {
    // Vectorize or the embedding model is unavailable: BM25 alone still cites.
    console.log(JSON.stringify({ type: 'degraded', stage: 'embed', error: String(err) }));
    degraded = 'no-embed';
  }

  const fused = rrf([vector, keyword]);
  const candidates = fused.map((id) => byId(id)).filter((c): c is Chunk => c !== undefined);

  let reranked: (Scored & { chunk: Chunk })[];
  let rerankTokens = 0;

  if (candidates.length === 0) {
    reranked = [];
  } else {
    try {
      const rerankStart = Date.now();
      reranked = await rerank(env, query, candidates);
      timings.rerank = Date.now() - rerankStart;
      rerankTokens = Math.ceil(
        (query.length * candidates.length +
          candidates.reduce((sum, c) => sum + c.title.length + c.text.length, 0)) /
          4,
      );
    } catch (err) {
      // Fall back to fusion order, with scores the gate cannot read as confident.
      console.log(JSON.stringify({ type: 'degraded', stage: 'rerank', error: String(err) }));
      degraded = degraded === 'none' ? 'no-rerank' : degraded;
      reranked = candidates.slice(0, 4).map((chunk) => ({ id: chunk.id, score: 0.5, chunk }));
    }
  }

  return { vector, keyword, fused, reranked, timings, degraded, embedTokens, rerankTokens };
}
