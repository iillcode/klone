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
}

/** One section of a legacy v1 template outline (guidance-only). */
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

/**
 * One reusable component block of a v2 template. Each component carries its
 * own HTML structure and CSS design, plus agent-facing description/guidance so
 * the agent knows when to use the block and how to author it into a response.
 */
export interface PdfComponent {
  /** Stable key, e.g. "cover". */
  key: string;
  /** Human-readable name, e.g. "Cover page". */
  name: string;
  /** What this component is for — when the agent should use this block. */
  description: string;
  /** Concrete authoring guidance for the agent. */
  guidance: string;
  /** Whether the agent must include this component in the response. */
  required?: boolean;
  /** HTML structure of the block (may use {placeholders}). */
  html: string;
  /** CSS design (styles) for the block. */
  css: string;
}

/** The outline blueprint stored on a pdf_template row. */
export interface PdfTemplateBlueprint {
  version: number;
  page: PdfTemplatePage;
  /** v1 (legacy): guidance-only sections. */
  sections?: PdfSection[];
  /** v2: reusable component blocks carried by each template. */
  components?: PdfComponent[];
  /**
   * v2: overall HTML structure agents use to assemble their response. It
   * contains a `<!--content-->` marker where the chosen components' HTML is
   * injected, and component CSS is merged into the document's <style>.
   */
  structure?: string;
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
  /** Self-contained sample HTML built from the template's components. */
  preview_html: string | null;
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
