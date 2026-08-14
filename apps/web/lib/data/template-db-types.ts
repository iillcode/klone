/**
 * Client-safe types for template rows loaded from `public.pdf_templates`.
 *
 * Mirrors the admin app's `TemplateRow` shape (minus the heavy `blueprint`,
 * which the web app never needs) so both server data layers and client
 * components can use these types safely. Intentionally has NO server-only
 * imports.
 */

/** A row from `public.pdf_templates` as consumed by the web app. */
export type TemplateRow = {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  category: string | null;
  /** Self-contained sample HTML built from the template's components. */
  preview_html: string | null;
  tags: string[] | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};
