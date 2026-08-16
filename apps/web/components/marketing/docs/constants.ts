/**
 * Shared connection details shown in the docs guides.
 *
 * NOTE: Update `MCP_URL` once the worker ships behind a custom domain —
 * every code snippet on the page interpolates this single constant.
 */

/** Hosted Klone MCP endpoint (POST, JSON-RPC). */
export const MCP_URL = "https://klone-mcp.your-domain.workers.dev/mcp";

/** Local development endpoint while running `pnpm dev` inside `apps/mcp`. */
export const LOCAL_MCP_URL = "http://127.0.0.1:8789/mcp";

/** Supabase project backing Klone auth and storage. */
export const SUPABASE_URL = "https://jdzhnwmfbfdocqncwfay.supabase.co";

/** Publishable anon key for the Supabase project (safe to share client-side). */
export const SUPABASE_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Impkemhud21mYmZkb2NxbmN3ZmF5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODYwMDg2NjYsImV4cCI6MjEwMTU4NDY2Nn0.eopsD2QWQiJ7yByczGYf7rZokpl12W4kMw85u-WrkRc";

/** Placeholder every snippet uses for the user's own access token. */
export const TOKEN_PLACEHOLDER = "<KLONE_ACCESS_TOKEN>";

/** Curl command that exchanges Klone credentials for a Supabase JWT. */
export const TOKEN_CURL = `curl -s -X POST "${SUPABASE_URL}/auth/v1/token?grant_type=password" \\
  -H "apikey: ${SUPABASE_ANON_KEY}" \\
  -H "Content-Type: application/json" \\
  -d '{"email": "you@example.com", "password": "your-password"}'`;

/** Headers every MCP request must carry. */
export const REQUEST_HEADERS_SNIPPET = `Authorization: Bearer ${TOKEN_PLACEHOLDER}
Content-Type: application/json
Accept: application/json, text/event-stream`;
