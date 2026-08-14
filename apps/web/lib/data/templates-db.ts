/**
 * Server-only data access for templates backed by `public.pdf_templates`.
 *
 * Replaces the previously hardcoded starter templates (`lib/data/templates.ts`
 * + `lib/data/template-meta.ts`). The landing page, sidebar and "new document"
 * flow now read real templates from the database and render each card's
 * `preview_html` as a live scaled preview.
 *
 * Templates are public reference data, so they are readable by any signed-in
 * (authenticated) user. We filter to `is_active = true` to match the admin
 * and MCP server contracts.
 */
import { createClient as createServerClient } from "@/lib/supabase/server";
import type { TemplateRow } from "./template-db-types";

/** Columns fetched from pdf_templates by the web app server layer. */
export const TEMPLATE_ROW_FIELDS =
  "id, slug, name, description, category, preview_html, tags, is_active, created_at, updated_at";

/** List active templates, ordered by name. */
export async function listTemplates(): Promise<TemplateRow[]> {
  const supabase = await createServerClient();
  const { data, error } = await supabase
    .from("pdf_templates")
    .select(TEMPLATE_ROW_FIELDS)
    .eq("is_active", true)
    .order("name", { ascending: true });

  if (error) {
    console.error("[templates-db] listTemplates:", error.message);
    return [];
  }

  return (data ?? []) as TemplateRow[];
}

/** Fetch a single template by slug, or null. */
export async function getTemplateBySlug(
  slug: string,
): Promise<TemplateRow | null> {
  const supabase = await createServerClient();
  const { data, error } = await supabase
    .from("pdf_templates")
    .select(TEMPLATE_ROW_FIELDS)
    .eq("slug", slug)
    .maybeSingle();

  if (error) {
    console.error("[templates-db] getTemplateBySlug:", error.message);
    return null;
  }

  return (data as TemplateRow | null) ?? null;
}

/** Fetch a single template by id, or null. */
export async function getTemplateById(id: string): Promise<TemplateRow | null> {
  const supabase = await createServerClient();
  const { data, error } = await supabase
    .from("pdf_templates")
    .select(TEMPLATE_ROW_FIELDS)
    .eq("id", id)
    .maybeSingle();

  if (error) {
    console.error("[templates-db] getTemplateById:", error.message);
    return null;
  }

  return (data as TemplateRow | null) ?? null;
}

/** Whether a slug corresponds to an active template in the database. */
export async function isTemplateSlug(slug: string): Promise<boolean> {
  if (!slug) return false;
  const tpl = await getTemplateBySlug(slug);
  return !!tpl;
}
