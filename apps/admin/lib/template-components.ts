/**
 * Fixed component catalog for the Klone admin template builder.
 *
 * This is the single source of truth for the reusable, FIXED component blocks
 * every template ships with (instead of anonymous free-form blocks). Each
 * block describes a design for an HTML tag (h1, h2, p, table, lists, …) or a
 * composite non-tag block (card, dotted list, callout, …) with its HTML + CSS,
 * guidance and tags.
 *
 * The catalog lives in a plain JSON file so a plain Node seed script can also
 * read it to push the same set into every template's blueprint in the DB.
 */
import type { TemplateComponent } from "./template-types";
import catalog from "./template-components.json";

/** All fixed components, in display order (canonical catalog). */
export const CATALOG_COMPONENTS: TemplateComponent[] =
  catalog as TemplateComponent[];

/** Group names in catalog order. */
export const CATALOG_GROUPS: string[] = Array.from(
  new Set(CATALOG_COMPONENTS.map((c) => c.group ?? "Other")),
);

export type CatalogGroup = string;

/** Components belonging to a given group (in catalog order). */
export function catalogByGroup(group: string): TemplateComponent[] {
  return CATALOG_COMPONENTS.filter((c) => (c.group ?? "Other") === group);
}

/**
 * Deep-copied snapshot of the catalog for a fresh template. Each copy gets
 * `required: false` so every template starts with the full set of fixed
 * components, all optional.
 */
export function catalogSnapshot(): TemplateComponent[] {
  return CATALOG_COMPONENTS.map((c) => ({
    ...c,
    tags: [...c.tags],
    required: false,
  }));
}

/** Whether a stored blueprint array is (or contains) the fixed catalog. */
export function hasCatalogComponents(
  components?: TemplateComponent[],
): boolean {
  if (!Array.isArray(components) || components.length === 0) return false;
  // If the first block's key is a known catalog key, treat as catalog-derived.
  return CATALOG_COMPONENTS.some((c) => c.key === components[0].key);
}