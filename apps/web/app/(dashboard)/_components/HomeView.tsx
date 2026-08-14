"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { Document } from "@/lib/types";
import type { UserProfile } from "@/lib/data/users";
import type { TemplateRow } from "@/lib/data/template-db-types";
import { deleteDocumentAction } from "@/app/actions/documents";
import { Topbar } from "@/components/dashboard/Topbar";
import { Sidebar } from "@/components/layout/Sidebar";
import { LandingCards } from "@/components/landing/LandingCards";

interface HomeViewProps {
  documents: Document[];
  templates: TemplateRow[];
  profile: UserProfile | null;
}

/**
 * Dashboard home shell — a faithful adaptation of the reference dashboard
 * layout for Klone: a 56px top bar, a 280px sidebar (search, nav, template
 * shortcuts, MCP promo, account → settings) and scrollable content sections
 * listing the user's documents and the starter templates.
 */
export function HomeView({ documents, templates, profile }: HomeViewProps) {
  const [query, setQuery] = useState("");
  const router = useRouter();

  const handleDeleteDocument = async (id: string) => {
    const result = await deleteDocumentAction(id);
    if ("error" in result) {
      console.error("[HomeView] deleteDocument:", result.error);
      return;
    }
    router.refresh();
  };

  return (
    <div className="flex h-full flex-col bg-[#161617] font-sans text-[#e4e4e7] antialiased">
      <Topbar />
      <div className="flex min-h-0 flex-1">
        <Sidebar
          documents={documents}
          templates={templates}
          query={query}
          onQueryChange={setQuery}
          profile={profile}
        />
        <main className="min-h-0 flex-1 overflow-y-auto [scrollbar-color:#3f3f46_#161617] [scrollbar:transparent] [scrollbar-width:thin]">
          <LandingCards
            documents={documents}
            templates={templates}
            query={query}
            onDeleteDocument={handleDeleteDocument}
          />
        </main>
      </div>
    </div>
  );
}
