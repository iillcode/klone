"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { Document } from "@/lib/types";
import type { UserProfile } from "@/lib/data/users";
import type { TemplateRow } from "@/lib/data/template-db-types";
import { createDocumentFromTemplate } from "@/app/actions/documents";
import { SettingsModal } from "@/components/settings/SettingsModal";
import {
  ChevronRight,
  FileText,
  Folder,
  Loader2,
  Search,
  Settings,
  Zap,
} from "lucide-react";
import { pressClasses } from "@/components/ui/Button";

const itemClass =
  "flex w-full items-center gap-2.5 rounded-lg px-2.5 py-[7px] text-left text-[13.5px] font-medium text-[#a1a1aa] transition-colors hover:bg-[#1c1c1c] hover:text-[#e4e4e7] disabled:cursor-wait disabled:opacity-60";

interface SidebarProps {
  documents: Document[];
  templates: TemplateRow[];
  query: string;
  onQueryChange: (q: string) => void;
  profile: UserProfile | null;
}

/**
 * Left sidebar (280px) matching the reference dashboard shell: header with
 * back + title, a search box, primary nav, "start from a template" shortcuts,
 * a Klone MCP promo card, and an account button that opens the settings modal.
 */
export function Sidebar({
  documents,
  templates,
  query,
  onQueryChange,
  profile,
}: SidebarProps) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [, startTransition] = useTransition();
  const [creating, setCreating] = useState<string | null>(null);
  const [settingsOpen, setSettingsOpen] = useState(false);

  const scrollTo = (id: string) => {
    onQueryChange("");
    requestAnimationFrame(() => {
      document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
    });
  };

  const handleCreate = (slug: string) => {
    setCreating(slug);
    startTransition(async () => {
      const result = await createDocumentFromTemplate(slug);
      setCreating(null);
      if ("id" in result) {
        router.push(`/preview/${result.id}`);
      }
    });
  };

  // Press "/" anywhere to focus the document search — unless the user has
  // turned off "Show keyboard hints" in Settings (persisted in localStorage).
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (
        e.key === "/" &&
        !(e.target instanceof HTMLInputElement) &&
        !(e.target instanceof HTMLTextAreaElement)
      ) {
        e.preventDefault();
        inputRef.current?.focus();
      }
    };
    let hints = true;
    try {
      hints =
        JSON.parse(
          localStorage.getItem("klone:setting:keyboard-hints") ?? "true",
        ) !== false;
    } catch {
      // default to on
    }
    if (!hints) return;
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const displayName =
    profile?.full_name || profile?.email?.split("@")[0] || "Account";
  const initials = displayName
    .split(/\s+/)
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <aside className="flex h-full w-60 flex-none flex-col border-r border-[#2d2d2d] bg-[#161617]">
      {/* Search */}
      <label className="mx-3 mt-3 mb-2.5 flex h-9 flex-none cursor-text items-center gap-2 rounded-lg border border-[#262626] bg-[#1e1e1e] px-3 text-[#a1a1aa]">
        <Search className="h-[15px] w-[15px]" />
        <input
          ref={inputRef}
          value={query}
          onChange={(e) => onQueryChange(e.target.value)}
          placeholder="Search documents"
          className="min-w-0 flex-1 bg-transparent text-[13px] text-[#e4e4e7] outline-none placeholder:text-[#a1a1aa]"
        />
        <kbd className="font-sans text-xs text-[#a1a1aa]">/</kbd>
      </label>

      {/* Nav */}
      <nav className="flex-1 min-h-0 overflow-y-auto px-2 pb-2.5 [scrollbar-color:#3f3f46_#161617] [scrollbar-width:thin]">
        <button
          className={itemClass}
          onClick={() => scrollTo("documents-section")}
        >
          <Folder className="h-4 w-4 text-[#a1a1aa]" />
          Projects
          <span className="ml-auto text-xs text-[#a1a1aa]">
            {documents.length}
          </span>
        </button>

        {templates.map((t) => (
          <button
            key={t.id}
            className={itemClass}
            onClick={() => handleCreate(t.slug)}
            disabled={creating !== null}
          >
            <FileText className="h-4 w-4 text-[#a1a1aa]" />
            {t.name}
            <span className="ml-auto flex-none">
              {creating === t.slug ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin text-[#a1a1aa]" />
              ) : (
                <ChevronRight className="h-3.5 w-3.5 text-[#a1a1aa]" />
              )}
            </span>
          </button>
        ))}
      </nav>

      {/* Klone MCP promo */}
      <div className="mx-3 mb-3 flex-none rounded-xl border border-[#262626] bg-[#1a1a1a] p-3.5">
        <div className="flex items-center justify-between text-[13px] font-bold text-[#e4e4e7]">
          Klone MCP
          <Zap className="h-4 w-4 text-[#aef637]" />
        </div>
        <p className="mt-1.5 text-xs leading-5 text-[#a1a1aa]">
          Connect any coding agent — Claude, Cursor — to author polished PDFs
          for you.
        </p>
        <button
          onClick={() => handleCreate("blank")}
          disabled={creating !== null}
          className={`${pressClasses("primary", "sm")} mt-3 w-full`}
        >
          Get started
          <ChevronRight className="h-3.5 w-3.5" />
        </button>
      </div>

      {/* Account — flat profile row pinned to the bottom */}
      <div className="flex-none border-t border-[#2d2d2d]/60 p-2">
        <button
          onClick={() => setSettingsOpen(true)}
          className="group flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left transition-colors"
        >
          <span className="relative grid h-8 w-8 flex-none place-items-center rounded-full bg-[#16245a] text-[11px] font-bold text-[#8fb3ff] ring-1 ring-[#2d2d2d]">
            {initials}
            <span
              className="absolute -right-0.5 -bottom-0.5 h-2.5 w-2.5 rounded-full border-2 border-[#161617] bg-[#aef637]"
              aria-hidden="true"
            />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block truncate text-[13px] font-semibold text-[#e4e4e7]">
              {displayName}
            </span>
            <span className="block truncate text-[11.5px] text-[#71717a]">
              {profile?.plan === "pro" ? "Pro plan" : "Hobby plan"}
            </span>
          </span>
          <Settings className="h-4 w-4 flex-none text-[#71717a] transition-colors group-hover:text-[#a1a1aa]" />
        </button>
      </div>

      <SettingsModal
        open={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        profile={profile}
      />
    </aside>
  );
}
