import { createClient as createServerClient } from "@/lib/supabase/server";
import { getSession } from "@/lib/auth";
import type { ComponentGroup, TemplateComponent } from "./types";
// Bundled fixed catalog — used as a fallback when a template's blueprint has
// no `components` of its own (e.g. legacy v1 templates). Keeps the component
// dock usable without a manual DB backfill.
import catalog from "./template-catalog.json";

/**
 * Server-only data access for template components (the reusable blocks stored
 * inside a `pdf_templates.blueprint.components` row). These are the building
 * blocks the editor's "Insert component" dock lists and injects into the
 * document.
 *
 * Components are scoped to the SINGLE template a document was created from
 * (via `visual_implementations.template_id`), so the dock only offers blocks
 * that belong to the document's own template.
 *
 * Mirrors the query contract used by the admin app
 * (`apps/admin/lib/template-components.ts`) and the MCP server
 * (`apps/mcp/src/types.ts`).
 */

const TEMPLATE_FIELDS = "id, slug, name, is_active, blueprint";

/** Normalize a raw blueprint.components entry into our client-safe shape. */
function normalize(raw: TemplateComponent): TemplateComponent {
  return {
    key: raw.key,
    name: raw.name,
    description: raw.description ?? "",
    html: raw.html ?? "",
    css: raw.css ?? "",
    tags: Array.isArray(raw.tags) ? raw.tags : [],
    group: raw.group ?? "Other",
  };
}

/**
 * Group a flat list of components by their `group` field, preserving
 * first-seen group order for a stable, predictable dock layout.
 */
function groupComponents(
  components: TemplateComponent[],
): ComponentGroup[] {
  const grouped = new Map<string, TemplateComponent[]>();
  for (const component of components) {
    const group = component.group ?? "Other";
    if (!grouped.has(group)) grouped.set(group, []);
    grouped.get(group)!.push(component);
  }
  return Array.from(grouped.entries()).map(([name, items]) => ({
    name,
    components: items,
  }));
}

/**
 * Build grouped components from the bundled fixed catalog (fallback used when
 * a template's blueprint has no `components` of its own).
 */
function fromCatalog(): ComponentGroup[] {
  const components = (catalog as TemplateComponent[]).map(normalize);
  return groupComponents(components);
}

/**
 * Fetch the component blocks for one template, identified by its id. Returns
 * the blocks grouped for display. When the template's blueprint has no
 * `components`, falls back to the bundled fixed catalog so the dock is always
 * usable.
 */
export async function getTemplateComponentsByTemplateId(
  templateId: string,
): Promise<ComponentGroup[]> {
  const session = await getSession();
  if (!session) return [];
  // An empty id (e.g. a document with no linked template) must not be sent to
  // Postgres — `.eq("id", "")` throws "invalid input syntax for type uuid".
  // Skip the query and use the bundled catalog fallback instead.
  if (!templateId) return fromCatalog();

  const supabase = await createServerClient();
  const { data, error } = await supabase
    .from("pdf_templates")
    .select(TEMPLATE_FIELDS)
    .eq("id", templateId)
    .maybeSingle();

  if (error) {
    console.error("[template-components] load by id failed:", error.message);
    return fromCatalog();
  }
  if (!data) return fromCatalog();

  const components = (
    (data.blueprint as { components?: TemplateComponent[] })?.components ?? []
  ).map(normalize);

  return components.length > 0 ? groupComponents(components) : fromCatalog();
}

/**
 * Fetch the component blocks for one template, identified by its slug. Used
 * for unsaved drafts opened via `/preview/<slug>` (no document row yet).
 * Falls back to the bundled fixed catalog when the template has no blocks.
 */
export async function getTemplateComponentsBySlug(
  slug: string,
): Promise<ComponentGroup[]> {
  const session = await getSession();
  if (!session) return [];
  if (!slug) return fromCatalog();

  const supabase = await createServerClient();
  const { data, error } = await supabase
    .from("pdf_templates")
    .select(TEMPLATE_FIELDS)
    .eq("slug", slug)
    .maybeSingle();

  if (error) {
    console.error("[template-components] load by slug failed:", error.message);
    return fromCatalog();
  }
  if (!data) return fromCatalog();

  const components = (
    (data.blueprint as { components?: TemplateComponent[] })?.components ?? []
  ).map(normalize);

  return components.length > 0 ? groupComponents(components) : fromCatalog();
}
