import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { getSupabase } from "./supabase";
import { registerTemplateTools } from "./templates";
import { registerDocumentTools } from "./documents";

/**
 * Tool surface:
 *
 * PDF templates (read from public.pdf_templates):
 *   - list_pdf_templates   browse available blueprint outlines (metadata)
 *   - get_pdf_template     fetch the full blueprint outline for authoring
 *
 * Documents (CRUD on public.visual_implementations, the user's documents):
 *   - create_document      save a composed HTML document
 *   - list_documents       list the user's documents
 *   - get_document         fetch one document
 *   - update_document      update fields of a document
 *   - delete_document      delete a document
 *
 * All tools return the same structured-JSON envelope ({ok, data} / {ok, error}).
 */
export function registerTools(
  server: McpServer,
  env: { SUPABASE_URL: string; SUPABASE_ANON_KEY: string },
  userId: string,
  token?: string,
) {
  const supabase = getSupabase(env, token);

  registerTemplateTools(server, supabase);
  registerDocumentTools(server, supabase, userId);
}
