# AliBot

The backend for the assistant docked on [alirad.dev](https://alirad.dev). A single
Cloudflare Worker that answers questions about the site using the site's own content:
hybrid retrieval, cross-encoder reranking, a grounding gate, and streamed generation.

Read the write-up at [alirad.dev/alibot](https://alirad.dev/alibot). The widget itself
lives in the site source, at `src/components/AliBot.astro` and `src/scripts/alibot.ts`.

## How a question is answered

```
POST /chat ──▶  rate limit (10/min per address)
                embed question         bge-base-en-v1.5, 768-d
                vector search           Vectorize, top 12
                keyword search          BM25 over the bundled corpus, top 12
                reciprocal rank fusion  top 8
                rerank                  bge-reranker-base, top 4
                gate                    below GATE → decline, no model call
                generate                Llama 3.3 70B, streamed as SSE
                account                 per-stage latency, tokens, neurons, dollars
```

Nothing here can bill: the account has no payment method, so exceeding the free
allowance of 10,000 neurons a day fails the call. That failure is handled — the Worker
returns the retrieved sections verbatim with their citations instead of an error.

## Endpoints

| Method | Path | Purpose |
|---|---|---|
| `GET` | `/health` | What is deployed and how many vectors are indexed |
| `GET` | `/search?q=` | Retrieval only, as JSON. How you tune ranking |
| `POST` | `/chat` | The widget's endpoint. Server-sent events |
| `POST` | `/ingest` | Embed the corpus into Vectorize. Bearer `INGEST_SECRET` |

## The corpus

`src/corpus.json` is generated, committed, and bundled into the Worker, so ingest time
and query time can never see different text. It is built from `src/data/site.ts` (the
same file the site renders), `src/data/alibot.ts`, and the README of each public project
repository.

Chunk ids match `data-chunk` attributes on the page, which is what lets a citation chip
scroll to the card it came from.

```bash
npm run corpus      # rebuild src/corpus.json (run from alibot/, or npm run alibot:corpus at the root)
```

Rebuild it whenever site content changes, then re-run `/ingest`.

## Setup

Once, from this directory:

```bash
npm install
npx wrangler login
npx wrangler vectorize create alibot --dimensions=768 --metric=cosine
npx wrangler secret put INGEST_SECRET
```

`INGEST_SECRET` is any long random string you invent. There is no Cloudflare API token
anywhere in this project — the AI and Vectorize bindings authenticate implicitly inside
the Worker.

## Deploy

```bash
npm run check                     # wrangler deploy --dry-run
npm run deploy
curl -X POST https://alibot.<your-subdomain>.workers.dev/ingest \
  -H "authorization: Bearer <INGEST_SECRET>"
```

Then put the deployed URL in `src/data/alibot.ts` as `ALIBOT_URL`, or set
`PUBLIC_ALIBOT_URL` at site build time to point the widget somewhere else.

## Develop

```bash
npm run dev                       # wrangler dev on :8787
npm run types                     # regenerate worker-configuration.d.ts after config changes
npx tsc --noEmit                  # type check
```

To point the site's widget at a local worker:

```bash
PUBLIC_ALIBOT_URL=http://localhost:8787 npm run build   # from the repository root
```

## Evals

```bash
npm run eval                                      # against the deployed worker
ALIBOT_URL=http://localhost:8787 npm run eval     # against wrangler dev
```

33 questions: ones the site can answer (each labelled with the chunk that should be
retrieved), ones it should refuse, and prompt-injection attempts. The harness records
recall@4, citation rate, decline accuracy, injection resistance, p50/p95 latency, and
mean neurons, then writes `evals/results.json`, which the `/alibot` page renders.

A full run costs roughly 4,000 neurons on the 70B model, so run it deliberately rather
than in a loop. To compare models, deploy with `--var MODEL:@cf/meta/llama-3.1-8b-instruct-fp8-fast`,
run the set, then redeploy the default and keep the better result.

## Tuning

Everything adjustable is a var in `wrangler.toml`: `MODEL`, `EMBED_MODEL`,
`RERANK_MODEL`, `GATE` (the reranker score below which AliBot declines), and
`ALLOWED_ORIGINS`. Raise `GATE` if it answers things it should refuse; lower it if it
refuses things the site plainly covers. `/search?q=` shows what each ranker returned.
