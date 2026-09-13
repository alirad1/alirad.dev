/* One typed door onto the AI binding.

   Model ids live in wrangler.toml as plain strings so they can be swapped with
   `--var` during an eval run, which the binding's own literal-union signature
   will not accept. The single cast is here rather than at every call site. */

type AiRun = (model: string, inputs: unknown, options?: unknown) => Promise<unknown>;

export function runAI<T>(env: Env, model: string, inputs: unknown): Promise<T> {
  const run = env.AI.run.bind(env.AI) as unknown as AiRun;
  return run(model, inputs) as Promise<T>;
}

export type EmbedResponse = { data: number[][] };
export type RerankResponse = { response: { id: number; score: number }[] };
