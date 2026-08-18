import { createClient as createServerClient } from "@/lib/supabase/server";
import { getSession } from "@/lib/auth";

/**
 * Server-only data access for the `generations` table — one row per
 * editor Save click, recording a snapshot of what the user saved
 * (title + full canvas HTML) linked to its document row and source
 * template. RLS: user_id = auth.uid().
 */

export interface GenerationRow {
  id: string;
  user_id: string;
  document_id: string | null;
  template_id: string | null;
  title: string;
  html_code: string;
  metadata: Record<string, unknown>;
  created_at: string;
}

const GENERATION_FIELDS =
  "id, user_id, document_id, template_id, title, created_at";

/**
 * Record a save snapshot for an EXISTING document. Looks up the document's
 * title/template link, then inserts the generation row. Returns true on
 * success.
 */
export async function recordGenerationForDocument(
  documentId: string,
  htmlCode: string,
): Promise<boolean> {
  const session = await getSession();
  if (!session) return false;

  const supabase = await createServerClient();

  // Fetch the linkable details of the saved document (title, template id
  // — fall back to the slug for template-saved docs that store the slug).
  const { data: doc } = await supabase
    .from("visual_implementations")
    .select("title, template_id, template_slug")
    .eq("id", documentId)
    .eq("user_id", session.userId)
    .maybeSingle();

  if (!doc) {
    console.error("[generations] recordGenerationForDocument: document not found");
    return false;
  }

  let templateId = (doc.template_id as string | null) ?? null;
  if (!templateId && doc.template_slug) {
    const { data: tpl } = await supabase
      .from("pdf_templates")
      .select("id")
      .eq("slug", doc.template_slug)
      .maybeSingle();
    templateId = (tpl?.id as string | undefined) ?? null;
  }

  const { error } = await supabase
    .from("generations")
    .insert({
      user_id: session.userId,
      document_id: documentId,
      template_id: templateId,
      title: doc.title,
      html_code: htmlCode,
    });

  if (error) {
    console.error("[generations] recordGenerationForDocument:", error.message);
    return false;
  }

  return true;
}

/**
 * Record a save snapshot with already-known details (used right after a new
 * document is created). Returns the new row id, or null on failure.
 */
export async function recordGeneration(input: {
  document_id: string;
  template_id?: string | null;
  title: string;
  html_code: string;
}): Promise<string | null> {
  const session = await getSession();
  if (!session) return null;

  const supabase = await createServerClient();
  const { data, error } = await supabase
    .from("generations")
    .insert({
      user_id: session.userId,
      document_id: input.document_id,
      template_id: input.template_id ?? null,
      title: input.title,
      html_code: input.html_code,
    })
    .select(GENERATION_FIELDS)
    .single();

  if (error) {
    console.error("[generations] recordGeneration:", error.message);
    return null;
  }

  return (data?.id as string | undefined) ?? null;
}
