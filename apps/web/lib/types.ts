/**
 * A persisted user document (HTML) stored in `visual_implementations`.
 * This is the source for the PDF converter editor — users can have many
 * of these, each editable in the preview editor and exportable to PDF.
 */
export interface Document {
  id: string;
  title: string;
  description: string | null;
  html_code: string;
  /** Linked source template (pdf_templates.id), if this doc was created from one. */
  template_id: string | null;
  created_at: string;
  updated_at: string;
}
