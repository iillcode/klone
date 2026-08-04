import { listDocuments } from "@/lib/data/documents";
import { Sidebar } from "@/components/layout/Sidebar";
import { LandingCards } from "@/components/LandingCards";

export default async function Home() {
  const documents = await listDocuments();

  return (
    <div className="flex w-full h-full">
      <Sidebar documents={documents} />
      <LandingCards />
    </div>
  );
}
