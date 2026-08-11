import { createClient as createServerClient } from "@/lib/supabase/server";
import { getSession } from "@/lib/auth";
import type { Document } from "@/lib/types";

/**
 * Server-only data access for user documents backed by the
 * `visual_implementations` table (RLS: user_id = auth.uid()).
 * Mirrors the query contract used by the MCP server (apps/mcp/src/tools.ts).
 */
const DOCUMENT_FIELDS =
  "id, title, description, html_code, template_id, created_at, updated_at";

/** List the current user's documents, most recently updated first. */
export async function listDocuments(): Promise<Document[]> {
  const session = await getSession();
  if (!session) return [];

  const supabase = await createServerClient();
  const { data, error } = await supabase
    .from("visual_implementations")
    .select(DOCUMENT_FIELDS)
    .eq("user_id", session.userId)
    .order("updated_at", { ascending: false });

  if (error) {
    console.error("[documents] listDocuments:", error.message);
    return [];
  }

  return (data ?? []) as Document[];
}

/** Fetch a single document owned by the current user, or null. */
export async function getDocument(id: string): Promise<Document | null> {
  const session = await getSession();
  if (!session) return null;

  const supabase = await createServerClient();
  const { data, error } = await supabase
    .from("visual_implementations")
    .select(DOCUMENT_FIELDS)
    .eq("id", id)
    .eq("user_id", session.userId)
    .maybeSingle();

  if (error) {
    console.error("[documents] getDocument:", error.message);
    return null;
  }

  return (data as Document | null) ?? null;
}

/** Create a new document for the current user. Returns the row or null. */
export async function createDocument(input: {
  title: string;
  html_code: string;
  /** Linked source template id, if created from a template. */
  template_id?: string | null;
  /** Linked source template slug, resolved to an id when an id isn't given. */
  template_slug?: string | null;
}): Promise<Document | null> {
  const session = await getSession();
  if (!session) return null;

  // Resolve the template id from the slug when only a slug is known (e.g. a
  // direct /preview/<slug> visit being saved as a new document). This keeps
  // the document linked to its template so the editor can later load that
  // template's component blocks.
  let templateId = input.template_id ?? null;
  if (!templateId && input.template_slug) {
    const { data: tpl } = await createServerClient()
      .from("pdf_templates")
      .select("id")
      .eq("slug", input.template_slug)
      .maybeSingle();
    templateId = (tpl?.id as string | undefined) ?? null;
  }

  const supabase = await createServerClient();
  const { data, error } = await supabase
    .from("visual_implementations")
    .insert({
      user_id: session.userId,
      title: input.title,
      html_code: input.html_code,
      template_id: templateId,
      template_slug: input.template_slug ?? null,
    })
    .select(DOCUMENT_FIELDS)
    .single();

  if (error) {
    console.error("[documents] createDocument:", error.message);
    return null;
  }

  return data as Document;
}

/** Persist the current canvas HTML for a document. Returns success. */
export async function updateDocumentContent(
  id: string,
  html_code: string,
): Promise<boolean> {
  const session = await getSession();
  if (!session) return false;

  const supabase = await createServerClient();
  const { error } = await supabase
    .from("visual_implementations")
    .update({ html_code, updated_at: new Date().toISOString() })
    .eq("id", id)
    .eq("user_id", session.userId);

  if (error) {
    console.error("[documents] updateDocumentContent:", error.message);
    return false;
  }

  return true;
}
