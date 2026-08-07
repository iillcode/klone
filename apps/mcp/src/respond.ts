/**
 * Response helpers for MCP tools.
 *
 * Every tool returns a consistent structured-JSON envelope:
 *   success: { "ok": true,  "data": <payload> }
 *   error:   { "ok": false, "error": "<message>" }   (with isError set for MCP clients)
 *
 * The payload schema differs per tool but the envelope is always the same,
 * so agents can parse responses uniformly.
 */

export function ok(data: unknown) {
  return {
    content: [
      {
        type: "text" as const,
        text: JSON.stringify({ ok: true, data }, null, 2),
      },
    ],
  };
}

export function err(message: string) {
  return {
    content: [
      {
        type: "text" as const,
        text: JSON.stringify({ ok: false, error: message }, null, 2),
      },
    ],
    isError: true,
  };
}
