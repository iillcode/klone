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
  created_at: string;
  updated_at: string;
}
