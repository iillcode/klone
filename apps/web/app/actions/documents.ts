"use server";

import { createDocument, updateDocumentContent } from "@/lib/data/documents";
import { getTemplate } from "@/lib/data/templates";

export type CreateDocumentResult = { id: string } | { error: string };
export type SaveDocumentResult = { ok: true } | { error: string };

/**
 * Create a new persisted document seeded with a starter template's HTML.
 * Used by the dashboard's "New document" button and the template cards.
 */
export async function createDocumentFromTemplate(
  templateId: string,
): Promise<CreateDocumentResult> {
  const template = getTemplate(templateId);
  if (!template) {
    return { error: `Unknown template '${templateId}'.` };
  }

  const doc = await createDocument({
    title: template.name,
    html_code: template.html,
  });

  if (!doc) {
    return { error: "Could not create document." };
  }

  return { id: doc.id };
}

/**
 * Persist the current canvas HTML for an existing document.
 */
export async function saveDocumentContent(
  docId: string,
  html: string,
): Promise<SaveDocumentResult> {
  if (!html || html.length === 0) {
    return { error: "Nothing to save." };
  }

  const updated = await updateDocumentContent(docId, html);
  if (!updated) {
    return { error: "Could not save document." };
  }

  return { ok: true };
}

/**
 * Persist an unsaved draft (e.g. a direct /preview/{slug} visit) as a brand
 * new document. Returns the new document's id.
 */
export async function createDocumentFromHtml(
  title: string,
  html: string,
  templateSlug?: string | null,
): Promise<CreateDocumentResult> {
  if (!html || html.length === 0) {
    return { error: "Nothing to save." };
  }

  const doc = await createDocument({
    title: title.trim() || "Untitled",
    html_code: html,
    template_slug: templateSlug ?? null,
  });

  if (!doc) {
    return { error: "Could not create document." };
  }

  return { id: doc.id };
}
