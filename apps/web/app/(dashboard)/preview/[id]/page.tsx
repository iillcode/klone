import { notFound } from "next/navigation";
import { getDocument } from "@/lib/data/documents";
import { isTemplateSlug } from "@/lib/data/templates";
import { PreviewEditor } from "@/components/editor/PreviewEditor";

interface PreviewPageProps {
  params: Promise<{ id: string }>;
}

export default async function PreviewPage({ params }: PreviewPageProps) {
  const { id } = await params;

  // Template slugs (backward-compat direct visits like /preview/blank)
  // render as an unsaved draft that the user can Save as a new document.
  if (isTemplateSlug(id)) {
    return <PreviewEditor initialTemplateSlug={id} />;
  }

  const doc = await getDocument(id);
  if (!doc) {
    notFound();
  }

  return <PreviewEditor initialDocument={doc} />;
}

