/* Secrets are set with `wrangler secret put`, so they never appear in
   wrangler.toml and are not part of the generated Env. Declared here instead. */

interface Env {
  /** Shared secret guarding POST /ingest. */
  INGEST_SECRET: string;
}
