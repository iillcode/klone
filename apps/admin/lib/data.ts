/**
 * Server-only template data access for the Klone admin app
 * (public.pdf_templates).
 *
 * Types + constants live in `@/lib/template-types` (client-safe). Re-exported
 * here so server modules can import types from `@/lib/data`.
 */
import { createServerClient } from "@/lib/supabase/server";
import {
  TEMPLATE_FIELDS,
  type TemplateRow,
} from "@/lib/template-types";

export type {
  TemplateComponent,
  TemplatePageSettings,
  TemplateBlueprint,
  TemplateRow,
} from "@/lib/template-types";
export {
  TEMPLATE_CATEGORIES,
  DEFAULT_STRUCTURE,
} from "@/lib/template-types";

export async function getTemplates(): Promise<TemplateRow[]> {
  const supabase = await createServerClient();
  const { data, error } = await supabase
    .from("pdf_templates")
    .select(TEMPLATE_FIELDS)
    .order("name", { ascending: true });
  if (error) throw new Error(error.message);
  return (data ?? []) as TemplateRow[];
}

export async function getTemplate(id: string): Promise<TemplateRow | null> {
  const supabase = await createServerClient();
  const { data, error } = await supabase
    .from("pdf_templates")
    .select(TEMPLATE_FIELDS)
    .eq("id", id)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return (data as TemplateRow | null) ?? null;
}