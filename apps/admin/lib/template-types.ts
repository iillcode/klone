/**
 * Client-safe template types, constants and helpers for the Klone admin app.
 *
 * DO NOT import anything from `@/lib/supabase/*` or `next/headers` in this
 * file — it is imported by client components (TemplateBuilder) and must stay
 * dependency-free so it never pulls server-only modules into the browser
 * bundle.
 */

/** One reusable component block inside a template blueprint. */
export type TemplateComponent = {
  /** Stable key, e.g. "h1" or "card". */
  key: string;
  /** Human-readable block name, e.g. "Heading 1" or "Card". */
  name: string;
  /** What this component is for — lets agents know when to use the block. */
  description: string;
  /** Concrete authoring guidance for the agent. */
  guidance: string;
  /** Whether the agent must include this component in the response. */
  required: boolean;
  /** HTML structure of the block (may use {placeholders}). */
  html: string;
  /** Styles/design for the block (CSS). */
  css: string;
  /** Tags describing the block (e.g. "h1", "list", "card"). */
  tags: string[];
  /** Optional catalog group this block belongs to (Body, Typography, …). */
  group?: string;
};

/** Global page constraints a template applies to the generated document. */
export type TemplatePageSettings = {
  /** Print format, e.g. "A4". */
  format: string;
  /** Editor/PDF content width, e.g. "794px". */
  content_width: string;
  /** Total page width (CSS size), e.g. "210mm". */
  width: string;
  /** Total page height (CSS size), e.g. "297mm". */
  height: string;
  /** Page margin, e.g. "2.5rem". */
  margin: string;
  /** Page padding, e.g. "2.5rem". */
  padding: string;
  /** Document body background, e.g. "#ffffff". */
  body_background: string;
  /** Optional raw page CSS pasted by the author (applied to html/body). */
  css: string;
};

/** The outline blueprint stored on a pdf_template row. */
export type TemplateBlueprint = {
  version: number;
  page: TemplatePageSettings;
  /** Overall HTML structure used to assemble an agent response. Contains a
   *  `<!--content-->` placeholder where the chosen components are injected. */
  structure: string;
  /** The reusable component blocks (each with its HTML + CSS design). */
  components: TemplateComponent[];
  /** Global assembly constraints for the final HTML document. */
  requirements: string[];
};

/** A row from `public.pdf_templates`. */
export type TemplateRow = {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  category: string | null;
  blueprint: TemplateBlueprint;
  /** Self-contained sample HTML built from the template's components. */
  preview_html: string | null;
  tags: string[] | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

/** Allowed categories — must match the DB CHECK constraint on pdf_templates. */
export const TEMPLATE_CATEGORIES = [
  "General",
  "Reports",
  "Business",
  "Technical",
  "Education",
  "Legal",
  "Personal",
] as const;

/** Columns fetched from pdf_templates by the server data layer. */
export const TEMPLATE_FIELDS =
  "id, slug, name, description, category, blueprint, preview_html, tags, is_active, created_at, updated_at";

/** Default response structure used when a template defines none. */
export const DEFAULT_STRUCTURE = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Document</title>
  <style>
    body { font-family: system-ui, -apple-system, sans-serif; line-height: 1.6; }
  </style>
</head>
<body>
<!--content-->
</body>
</html>`;