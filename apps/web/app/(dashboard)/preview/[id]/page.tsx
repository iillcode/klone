import { notFound } from "next/navigation";
import { getDocument, listDocuments } from "@/lib/data/documents";
import { getProfile } from "@/lib/data/users";
import {
  isTemplateSlug,
  getTemplateBySlug,
  listTemplates,
} from "@/lib/data/templates-db";
import type { TemplateRow } from "@/lib/data/template-db-types";
import {
  getTemplateComponentsByTemplateId,
  getTemplateComponentsBySlug,
} from "@/lib/data/template-components";
import { PreviewEditor } from "@/components/editor/PreviewEditor";

interface PreviewPageProps {
  params: Promise<{ id: string }>;
}

export default async function PreviewPage({ params }: PreviewPageProps) {
  const { id } = await params;

  // The dashboard-style sidebar (search, nav, templates, account) is reused
  // inside the preview editor, so load the same data the home page uses.
  const [documents, profile, templates] = await Promise.all([
    listDocuments(),
    getProfile(),
    listTemplates(),
  ]);

  // Template slugs (backward-compat direct visits like /preview/blank)
  // render as an unsaved draft that the user can Save as a new document.
  // Components come from the matching template (by slug).
  if (await isTemplateSlug(id)) {
    const [componentGroups, tpl] = await Promise.all([
      getTemplateComponentsBySlug(id),
      getTemplateBySlug(id),
    ]);
    return (
      <PreviewEditor
        initialTemplateSlug={id}
        initialHtml={tpl?.preview_html ?? null}
        documents={documents}
        templates={templates}
        profile={profile}
        componentGroups={componentGroups}
      />
    );
  }

  const doc = await getDocument(id);
  if (!doc) {
    notFound();
  }

  // Components come from the document's OWN template (via template_id), so
  // the dock only offers blocks that belong to this document's template.
  const componentGroups = await getTemplateComponentsByTemplateId(
    doc.template_id ?? "",
  );

  return (
    <PreviewEditor
      initialDocument={doc}
      documents={documents}
      templates={templates}
      profile={profile}
      componentGroups={componentGroups}
    />
  );
}
