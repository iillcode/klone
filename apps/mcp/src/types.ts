/**
 * Shared types for the PDF-document MCP server.
 *
 * The server has two concepts:
 * - PDF templates: blueprint "outlines" (page constraints + sections + guidance)
 *   stored in `public.pdf_templates`, served to AI agents so they can author a
 *   full HTML document.
 * - Documents: the HTML documents agents compose and save for a user. They are
 *   stored in `public.visual_implementations` (the same table the web app's
 *   editor reads/writes).
 */

/** Global page constraints a template applies to the generated document. */
export interface PdfTemplatePage {
  /** Print format, e.g. "A4". */
  format: string;
  /** Editor/PDF content width, e.g. "794px". */
  content_width: string;
  /** Page margin, e.g. "2.5rem". */
  margin: string;
  /** Document body background, e.g. "#ffffff". */
  body_background: string;
}

/** One section of a template outline. */
export interface PdfSection {
  /** Stable key, e.g. "executive-summary". */
  key: string;
  /** Human-readable section name. */
  name: string;
  /** What this section should contain. */
  description: string;
  /** Concrete authoring guidance for the agent. */
  guidance: string;
  /** Whether the agent must include this section. */
  required?: boolean;
}

/** The outline blueprint stored on a pdf_template row. */
export interface PdfTemplateBlueprint {
  version: number;
  page: PdfTemplatePage;
  sections: PdfSection[];
  /** Global assembly constraints for the final HTML document. */
  requirements: string[];
}

/** A row from `public.pdf_templates`. */
export interface PdfTemplate {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  category: string | null;
  blueprint: PdfTemplateBlueprint | Record<string, unknown>;
  tags: string[] | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

/** A row from `public.visual_implementations` (a user's document). */
export interface Document {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  html_code: string;
  css_code: string | null;
  template_id: string | null;
  template_slug: string | null;
  prompt_used: string | null;
  metadata: Record<string, unknown> | null;
  created_at: string;
  updated_at: string;
}
