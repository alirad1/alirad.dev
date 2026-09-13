/* Neuron and dollar accounting.

   Workers AI bills in "neurons". The free plan allows 10,000 a day and then
   fails the call rather than charging, so nothing here is ever actually paid —
   but an assistant whose price you cannot see is one you cannot reason about,
   so every answer reports what it would have cost at the published rate. */

export const USD_PER_1K_NEURONS = 0.011;

type Rate = { in: number; out?: number };

/** Neurons per million tokens, from developers.cloudflare.com/workers-ai/platform/pricing. */
export const RATES: Record<string, Rate> = {
  '@cf/baai/bge-base-en-v1.5': { in: 6058 },
  '@cf/baai/bge-small-en-v1.5': { in: 1841 },
  '@cf/baai/bge-large-en-v1.5': { in: 12547 },
  '@cf/baai/bge-reranker-base': { in: 283 },
  '@cf/meta/llama-3.3-70b-instruct-fp8-fast': { in: 26668, out: 204805 },
  '@cf/meta/llama-3.1-8b-instruct-fp8-fast': { in: 4119, out: 34868 },
  '@cf/meta/llama-3.1-8b-instruct-fast': { in: 4119, out: 34868 },
};

/** Rough token count. Good enough for a cost readout, and free to compute. */
export function tokensOf(text: string): number {
  return Math.ceil(text.length / 4);
}

export function neuronsFor(model: string, inTokens: number, outTokens = 0): number {
  const rate = RATES[model];
  if (!rate) return 0;
  return (inTokens / 1e6) * rate.in + (outTokens / 1e6) * (rate.out ?? 0);
}

export function usdFor(neurons: number): number {
  return (neurons / 1000) * USD_PER_1K_NEURONS;
}
