import { listDocuments } from "@/lib/data/documents";
import { getProfile } from "@/lib/data/users";
import type { Document } from "@/lib/types";
import { HomeView } from "@/components/dashboard/HomeView";

export default async function Home() {
  let documents: Document[] = [];
  try {
    documents = await listDocuments();
  } catch (error) {
    console.error("[dashboard] Could not load documents:", error);
  }

  const profile = await getProfile();

  // Documents are listed most recently updated first.
  const sorted = [...documents].sort(
    (a, b) =>
      new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime(),
  );

  return <HomeView documents={sorted} profile={profile} />;
}
