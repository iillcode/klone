/**
 * Client-safe types for template components loaded from the database.
 *
 * These describe the reusable component blocks stored inside each
 * `pdf_templates.blueprint.components` row. They intentionally have NO
 * server-only imports so both server data layers and client components can
 * use them safely.
 */

/** One reusable component block from a template blueprint. */
export type TemplateComponent = {
  /** Stable key, e.g. "h1" or "card". */
  key: string;
  /** Human-readable block name, e.g. "Heading 1" or "Card". */
  name: string;
  /** What this component is for. */
  description: string;
  /** HTML structure of the block. */
  html: string;
  /** Styles/design for the block (CSS). */
  css: string;
  /** Tags describing the block (e.g. "h1", "list", "card"). */
  tags: string[];
  /** Catalog group this block belongs to (Body, Typography, …). */
  group?: string;
};

/** A template's flattened component list, grouped for display. */
export type ComponentGroup = {
  name: string;
  components: TemplateComponent[];
};
