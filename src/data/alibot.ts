/* AliBot's configuration and its own write-up. The prose in `alibotSections`
   renders on /alibot and is also ingested as corpus chunks, so asking the bot
   how it works retrieves the same text a reader would see on the page. */

/* The deployed Worker. Override at build time with PUBLIC_ALIBOT_URL when
   pointing the widget at a local `wrangler dev` instance. Read defensively so
   this module also imports cleanly under plain Node, where the corpus builder
   runs it outside Astro. */
const buildEnv = (import.meta as unknown as { env?: Record<string, string | undefined> }).env;

export const ALIBOT_URL: string =
  buildEnv?.PUBLIC_ALIBOT_URL ?? 'https://alibot.alirad1.workers.dev';

export const SUGGESTED_QUESTIONS: string[] = [
  'What has Ali built?',
  'What does Ali use Python for?',
  'How does AliBot work?',
];

export type AliBotSection = { id: string; title: string; body: string };

export const alibotSections: AliBotSection[] = [
  {
    id: 'what',
    title: 'What it is',
    body:
      'AliBot is a small chat assistant docked in the corner of this site. It answers questions about ' +
      "Ali's projects and experience using only the content on alirad.dev and the README of each project " +
      'repository. Every answer carries citations, and clicking one scrolls to the exact card or entry the ' +
      'sentence came from. If the retrieved sources do not answer a question, AliBot says so instead of ' +
      'guessing. It was built to practise retrieval-augmented generation end to end rather than to wire up ' +
      'a chat box around a general-purpose model.',
  },
  {
    id: 'retrieval',
    title: 'How retrieval works',
    body:
      'The corpus is generated from the same data file the site renders, so a chunk id always matches an ' +
      'element on the page. A question is embedded with bge-base-en-v1.5 into a 768-dimension vector and ' +
      'searched against Cloudflare Vectorize for the twelve nearest chunks. In parallel the Worker runs BM25 ' +
      'keyword scoring over the bundled corpus for its own top twelve. The two ranked lists are combined with ' +
      'reciprocal rank fusion, which rewards chunks that both methods rank highly without needing the two ' +
      'score scales to be comparable. The fused top eight then go through a cross-encoder reranker, ' +
      'bge-reranker-base, which reads the question and each chunk together and scores real relevance rather ' +
      'than vector proximity. The best four become the sources for the answer.',
  },
  {
    id: 'generation',
    title: 'How answers are generated',
    body:
      'The four reranked chunks are numbered and placed in the system prompt, and the model is instructed to ' +
      'answer only from them and to mark each sentence with the number of the source it used. Generation runs ' +
      'on Llama 3.3 70B through Workers AI with streaming enabled, so tokens reach the browser over server-sent ' +
      'events as they are produced. The bracketed numbers in the finished answer are swapped for citation chips ' +
      'in the widget. Answers are capped at 400 tokens and run at a low temperature, because the job is to ' +
      'report what the sources say, not to write freely.',
  },
  {
    id: 'guardrails',
    title: 'Guardrails',
    body:
      'A grounding gate sits between retrieval and generation: if the best reranker score falls below a ' +
      'threshold tuned against the eval set, AliBot declines without calling the model at all, which makes an ' +
      'off-topic question both safer and free. The question is capped at 500 characters and the history at six ' +
      'turns. Visitor text only ever appears in the user turn of the prompt, never spliced into the system ' +
      'instructions, and the sources are Ali’s own content rather than arbitrary web pages. Model output is ' +
      'rendered as text nodes, never as HTML, so nothing it produces can execute in the page. A rate-limit ' +
      'binding allows ten questions per minute per address.',
  },
  {
    id: 'evals',
    title: 'Evaluation',
    body:
      'A thirty-question golden set runs against the deployed Worker: twenty questions that the site can ' +
      'answer, each labelled with the chunk that should be retrieved, six that it should refuse as out of ' +
      'scope, and four prompt-injection attempts. The harness records recall at four, the share of answers ' +
      'that cite a real source, how reliably out-of-scope questions are declined, resistance to injection, and ' +
      'the latency and neuron cost of every turn. Choosing between the 70B and 8B models was settled by ' +
      'running the same set against both rather than by preference.',
  },
  {
    id: 'cost',
    title: 'What it costs',
    body:
      'Nothing, structurally. The Worker, the Vectorize index and the inference all sit on Cloudflare free ' +
      'tiers, and there is no payment method on the account, so exceeding the daily allowance of ten thousand ' +
      'neurons returns an error rather than a bill. When that happens AliBot falls back to returning the ' +
      'retrieved sections verbatim with their citations, which needs no model call. The widget still reports ' +
      'what each answer would have cost at the paid rate, because an assistant whose price you cannot see is ' +
      'an assistant you cannot reason about.',
  },
];
