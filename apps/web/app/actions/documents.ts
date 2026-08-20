"use server";

import {
  createDocument,
  deleteDocument,
  updateDocumentContent,
} from "@/lib/data/documents";
import { getTemplateBySlug } from "@/lib/data/templates-db";
import { requireProPlan } from "@/lib/auth";

export type CreateDocumentResult = { id: string } | { error: string };
export type SaveDocumentResult = { ok: true } | { error: string };
export type DeleteDocumentResult = { ok: true } | { error: string };

/**
 * Create a new persisted document seeded with a starter template's HTML.
 * Used by the dashboard's "New document" button and the template cards.
 * `templateId` is the template slug (used by the landing page / sidebar).
 */
export async function createDocumentFromTemplate(
  templateId: string,
): Promise<CreateDocumentResult> {
  // Pro-only feature. requireProPlan redirects free/unauthenticated users.
  await requireProPlan();

  const template = await getTemplateBySlug(templateId);
  if (!template) {
    return { error: `Unknown template '${templateId}'.` };
  }

  const doc = await createDocument({
    title: template.name,
    html_code: template.preview_html ?? "",
    template_slug: template.slug,
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
  await requireProPlan();

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
 * Delete a document the current user owns. Returns success or an error.
 */
export async function deleteDocumentAction(
  docId: string,
): Promise<DeleteDocumentResult> {
  await requireProPlan();

  if (!docId) {
    return { error: "Missing document id." };
  }

  const ok = await deleteDocument(docId);
  if (!ok) {
    return { error: "Could not delete document." };
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
  await requireProPlan();

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
