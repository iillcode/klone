import { listDocuments } from "@/lib/data/documents";
import { getProfile } from "@/lib/data/users";
import { listTemplates } from "@/lib/data/templates-db";
import type { Document } from "@/lib/types";
import type { TemplateRow } from "@/lib/data/template-db-types";
import { HomeView } from "../_components/HomeView";

export default async function Home() {
  let documents: Document[] = [];
  try {
    documents = await listDocuments();
  } catch (error) {
    console.error("[dashboard] Could not load documents:", error);
  }

  let templates: TemplateRow[] = [];
  try {
    templates = await listTemplates();
  } catch (error) {
    console.error("[dashboard] Could not load templates:", error);
  }

  const profile = await getProfile();

  // Documents are listed most recently updated first.
  const sorted = [...documents].sort(
    (a, b) =>
      new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime(),
  );

  return (
    <HomeView documents={sorted} templates={templates} profile={profile} />
  );
}
