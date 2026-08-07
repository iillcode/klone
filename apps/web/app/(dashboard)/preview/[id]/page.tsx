import { notFound } from "next/navigation";
import { getDocument, listDocuments } from "@/lib/data/documents";
import { getProfile } from "@/lib/data/users";
import { isTemplateSlug } from "@/lib/data/templates";
import { PreviewEditor } from "@/components/editor/PreviewEditor";

interface PreviewPageProps {
  params: Promise<{ id: string }>;
}

export default async function PreviewPage({ params }: PreviewPageProps) {
  const { id } = await params;

  // The dashboard-style sidebar (search, nav, templates, account) is reused
  // inside the preview editor, so load the same data the home page uses.
  const [documents, profile] = await Promise.all([
    listDocuments(),
    getProfile(),
  ]);

  // Template slugs (backward-compat direct visits like /preview/blank)
  // render as an unsaved draft that the user can Save as a new document.
  if (isTemplateSlug(id)) {
    return (
      <PreviewEditor
        initialTemplateSlug={id}
        documents={documents}
        profile={profile}
      />
    );
  }

  const doc = await getDocument(id);
  if (!doc) {
    notFound();
  }

  return (
    <PreviewEditor initialDocument={doc} documents={documents} profile={profile} />
  );
}

