# AliBot

AliBot is the small assistant docked in the corner of [alirad.dev](https://alirad.dev). Ask it
something about my work and it answers from the site's own content instead of from whatever a
general model happens to remember. It is a single Cloudflare Worker, and I built it to learn
retrieval augmented generation properly, end to end: hybrid retrieval, reranking, a grounding
gate, and streamed generation, all running on free infrastructure.

The widget you actually see lives in the site source, at `src/components/AliBot.astro` and
`src/scripts/alibot.ts`. Everything below is the Worker behind it.

## How a question gets answered

Every question walks the same path.

1. It arrives at `/chat` and clears a rate limit of ten a minute per address.
2. The question is turned into a 768 dimensional vector by a BGE embedding model.
3. That vector searches Cloudflare Vectorize for the twelve nearest chunks, while a BM25
   keyword pass reads the bundled corpus for its own top twelve. Dense search catches what a
   question means, keyword search catches the exact words it used, and each one covers the
   other's blind spots.
4. The two ranked lists are fused by position with reciprocal rank fusion, so the cosine
   scores and the BM25 scores never have to share a scale. The top eight survive.
5. A cross encoder reranker reads the question and each candidate together and scores them for
   real relevance rather than mere proximity. The best four become the sources.
6. If even the best score sits below the gate, AliBot declines right here and the model is
   never called at all. An off topic question costs nothing and cannot be answered wrongly.
7. Otherwise the four sources go to Llama 3.3 70B, told to answer only from them and to mark
   each sentence with the source it leaned on. Tokens stream back to the browser as they land.
8. Every stage is timed and every token counted, so the widget can show you exactly what an
   answer retrieved, how long it took, and what it would have cost.

None of this can ever bill me. The account has no payment method, so once the free allowance of
ten thousand neurons a day is spent the call simply fails, and the Worker takes that in stride
by handing back the retrieved sections verbatim with their citations instead of an error.

## The endpoints

| Method | Path | What it is for |
|---|---|---|
| `GET` | `/health` | What is deployed, and how many vectors are indexed |
| `GET` | `/search?q=` | Retrieval on its own, as JSON, which is how I watch what the rankers are doing |
| `POST` | `/chat` | The widget's endpoint, streamed as server sent events |
| `POST` | `/ingest` | Embeds the corpus into Vectorize |

## The corpus

The corpus is generated, committed, and bundled straight into the Worker, so the text seen when
content is embedded and the text seen when a question runs can never quietly drift apart. It is
built from the same data file the site renders (`src/data/site.ts`), the AliBot write up in
`src/data/alibot.ts`, and the README of each public project.

Each chunk carries an id that matches a marker on the page, and that is the small trick that
lets a citation chip scroll you straight to the card an answer came from.

## How I know it works

A golden set of 33 questions runs against the deployed Worker: twenty the site can answer, each
labelled with the chunk that ought to come back, a handful it should refuse as out of scope, and
a few prompt injection attempts trying to talk it out of its own instructions. The harness
records how often the right chunk is retrieved, how often an answer cites a real source, how
reliably it declines what it should, how well it shrugs off injection, and the latency and
neuron cost of every turn.

That set is also how I settled real decisions instead of guessing at them. Choosing between the
70B and the 8B model, or deciding where the gate should sit, came down to running the questions
both ways and keeping whichever numbers were better.

## Where the knobs are

Everything worth adjusting is a plain variable in `wrangler.toml`: the three models, the gate
(the reranker score below which AliBot would rather say nothing than guess), and the list of
allowed origins. If it ever answers something it should have left alone, the gate goes up; if it
turns away a question the site plainly covers, the gate comes down. The `/search` endpoint shows
what each ranker returned, which is usually enough to see why it behaved the way it did.
