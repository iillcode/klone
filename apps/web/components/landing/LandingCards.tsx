"use client";

import {
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  useTransition,
} from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { Document } from "@/lib/types";
import type { TemplateRow } from "@/lib/data/template-db-types";
import {
  createDocumentFromTemplate,
  deleteDocumentAction,
} from "@/app/actions/documents";
import {
  ChevronRight,
  FileText,
  Loader2,
  MoreVertical,
  Trash2,
} from "lucide-react";
import { DropdownMenu, DropdownMenuItem } from "@/components/ui/dropdown-menu";

/** A4 page size used to scale document/template previews into card thumbnails. */
const PAGE_WIDTH = 794;
const PAGE_HEIGHT = 1123;

/** Scaled live preview of a document's HTML inside a card thumbnail. */
function DocumentThumb({ doc }: { doc: Document }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(0);
  const [loaded, setLoaded] = useState(false);

  useLayoutEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const measure = () => setWidth(el.clientWidth);
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const scale = width > 0 ? width / PAGE_WIDTH : 0;

  if (!doc.html_code) {
    return <ThumbPlaceholder title={doc.title} />;
  }

  return (
    <div
      ref={containerRef}
      className="relative h-full w-full overflow-hidden bg-white"
    >
      {scale > 0 && (
        <div
          className="absolute left-0 top-0 origin-top-left"
          style={{
            width: PAGE_WIDTH,
            height: PAGE_HEIGHT,
            transform: `scale(${scale})`,
          }}
        >
          <iframe
            title={`Preview of ${doc.title}`}
            srcDoc={doc.html_code}
            sandbox="allow-scripts"
            loading="lazy"
            className="h-[1123px] w-[794px] border-0"
            onLoad={() => setLoaded(true)}
          />
        </div>
      )}
      {!loaded && (
        <div className="absolute inset-0 flex items-center justify-center bg-[#1a1a1a]">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-[#3f3f46] border-t-[#2563eb]" />
        </div>
      )}
    </div>
  );
}

/** Themed fallback thumbnail when a document has no stored HTML to render. */
function ThumbPlaceholder({ title }: { title: string }) {
  const hue = useMemo(() => {
    let h = 0;
    for (let i = 0; i < title.length; i++) {
      h = (h * 31 + title.charCodeAt(i)) % 360;
    }
    return h;
  }, [title]);

  return (
    <div
      className="flex h-full w-full flex-col items-center justify-center gap-2.5"
      style={{
        background: `linear-gradient(135deg, hsl(${hue} 42% 42%), hsl(${(hue + 45) % 360} 48% 28%))`,
      }}
    >
      <div className="flex h-11 w-11 items-center justify-center rounded-lg border border-white/25 bg-white/15 text-lg font-bold text-white">
        {(title.trim()[0] || "K").toUpperCase()}
      </div>
      <span className="text-[10px] font-semibold uppercase tracking-wider text-white/80">
        PDF Document
      </span>
    </div>
  );
}

/** One document card: live thumbnail + title + PDF badge + date + actions. */
function DocumentCard({
  doc,
  onDelete,
}: {
  doc: Document;
  onDelete: (id: string) => void;
}) {
  const date = new Date(doc.updated_at).toLocaleDateString();
  const [confirming, setConfirming] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const handleDelete = async () => {
    setDeleting(true);
    await onDelete(doc.id);
    setDeleting(false);
    setConfirming(false);
  };

  return (
    <div className="group relative block overflow-hidden rounded-xl border border-[#2d2d2d] bg-[#1a1a1a] transition-colors hover:border-[#3f3f46]">
      <Link href={`/preview/${doc.id}`} className="block">
        <div className="relative aspect-[4/3] overflow-hidden bg-white">
          <DocumentThumb doc={doc} />
          <div className="absolute inset-x-0 top-0 bottom-1.5 flex items-end justify-end bg-black/0 p-3 opacity-0 transition-all duration-200 group-hover:bg-black/35 group-hover:opacity-100">
            <span className="inline-flex items-center gap-1.5 rounded-lg bg-white px-3 py-1.5 text-xs font-semibold text-gray-900 shadow-lg">
              Open
              <ChevronRight className="h-3.5 w-3.5" />
            </span>
          </div>
        </div>
        <div className="p-3">
          <div className="flex items-center justify-between gap-2">
            <div className="flex min-w-0 items-center gap-2">
              <span className="inline-flex flex-none items-center rounded bg-[#16245a] px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-[#8fb3ff]">
                PDF
              </span>
              <h3 className="truncate text-sm font-medium text-[#e4e4e7]">
                {doc.title}
              </h3>
            </div>
            <div className="flex flex-none items-center gap-2">
              <span className="text-xs text-[#a1a1aa]">Updated {date}</span>
              <DropdownMenu
                trigger={
                  <span
                    className="grid h-5 w-5 place-items-center rounded text-[#a1a1aa] transition-colors hover:bg-[#2d2d2d] hover:text-[#e4e4e7]"
                    aria-hidden="true"
                  >
                    <MoreVertical className="h-3.5 w-3.5" />
                  </span>
                }
              >
                {confirming ? (
                  <div className="px-3 py-2">
                    <p className="mb-2 text-xs text-[#a1a1aa]">
                      Delete “{doc.title}”?
                    </p>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          handleDelete();
                        }}
                        disabled={deleting}
                        className="flex-1 rounded-md bg-[#b91c1c] px-2 py-1 text-xs font-semibold text-white hover:bg-[#dc2626] disabled:opacity-60"
                      >
                        {deleting ? "Deleting…" : "Delete"}
                      </button>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          setConfirming(false);
                        }}
                        disabled={deleting}
                        className="flex-1 rounded-md bg-[#2d2d2d] px-2 py-1 text-xs font-semibold text-[#e4e4e7] hover:bg-[#3f3f46]"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <DropdownMenuItem
                    destructive
                    onSelect={() => setConfirming(true)}
                  >
                    <Trash2 className="h-4 w-4" />
                    Delete
                  </DropdownMenuItem>
                )}
              </DropdownMenu>
            </div>
          </div>
        </div>
      </Link>
    </div>
  );
}

/** Scaled live preview of a template's `preview_html` inside a card thumbnail. */
function TemplateThumb({ html }: { html: string | null }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(0);
  const [loaded, setLoaded] = useState(false);

  useLayoutEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const measure = () => setWidth(el.clientWidth);
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const scale = width > 0 ? width / PAGE_WIDTH : 0;

  if (!html) {
    return (
      <div className="flex h-full w-full items-center justify-center bg-[#1a1a1a] text-[10px] font-semibold uppercase tracking-wider text-[#a1a1aa]">
        No preview
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className="relative h-full w-full overflow-hidden bg-white"
    >
      {scale > 0 && (
        <div
          className="absolute left-0 top-0 origin-top-left"
          style={{
            width: PAGE_WIDTH,
            height: PAGE_HEIGHT,
            transform: `scale(${scale})`,
          }}
        >
          <iframe
            title="Template preview"
            srcDoc={html}
            sandbox="allow-scripts"
            loading="lazy"
            className="h-[1123px] w-[794px] border-0"
            onLoad={() => setLoaded(true)}
          />
        </div>
      )}
      {!loaded && (
        <div className="absolute inset-0 flex items-center justify-center bg-[#1a1a1a]">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-[#3f3f46] border-t-[#2563eb]" />
        </div>
      )}
    </div>
  );
}

/** One starter-template card: live preview_html thumbnail + name + create action. */
function TemplateCard({
  template,
  creating,
  onSelect,
}: {
  template: TemplateRow;
  creating: boolean;
  onSelect: (slug: string) => void;
}) {
  return (
    <button
      onClick={() => onSelect(template.slug)}
      disabled={creating}
      className="group block overflow-hidden rounded-xl border border-[#2d2d2d] bg-[#1a1a1a] text-left transition-colors hover:border-[#3f3f46] disabled:cursor-wait disabled:opacity-70"
    >
      <div className="relative aspect-[4/3] overflow-hidden bg-white">
        <TemplateThumb html={template.preview_html} />
        <div className="absolute inset-x-0 top-0 bottom-1.5 flex items-end justify-end bg-black/0 p-3 opacity-0 transition-all duration-200 group-hover:bg-black/35 group-hover:opacity-100">
          <span className="inline-flex items-center gap-1.5 rounded-lg bg-white px-3 py-1.5 text-xs font-semibold text-gray-900 shadow-lg">
            Use
            <ChevronRight className="h-3.5 w-3.5" />
          </span>
        </div>
        {creating && (
          <div className="absolute inset-0 grid place-items-center bg-black/40">
            <Loader2 className="h-6 w-6 animate-spin text-white" />
          </div>
        )}
      </div>
      <div className="flex items-center justify-between gap-2 p-3">
        <div className="flex min-w-0 items-center gap-2">
          {template.category && (
            <span className="inline-flex flex-none items-center rounded bg-[#16245a] px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-[#8fb3ff]">
              {template.category}
            </span>
          )}
          <span className="truncate text-sm font-medium text-[#e4e4e7]">
            {template.name}
          </span>
        </div>
        <span className="inline-flex flex-none items-center gap-1 text-xs text-[#a1a1aa] transition-colors group-hover:text-[#e4e4e7]">
          Open
          <ChevronRight className="h-3.5 w-3.5" />
        </span>
      </div>
    </button>
  );
}

function SectionHead({ title, count }: { title: string; count: number }) {
  return (
    <div className="mb-4 flex items-center justify-between">
      <h2 className="text-[15px] font-bold tracking-[-0.01em] text-[#e4e4e7]">
        {title}
      </h2>
      <span className="text-xs font-medium text-[#a1a1aa]">{count}</span>
    </div>
  );
}

function EmptyDocuments({ query }: { query: string }) {
  return (
    <div className="py-12 text-center">
      <FileText className="mx-auto h-7 w-7 text-[#52525b]" />
      <p className="mt-3 text-sm font-medium text-[#a1a1aa]">
        {query ? `No documents match “${query}”` : "No documents yet"}
      </p>
      <p className="mx-auto mt-1 max-w-sm text-xs leading-5 text-[#71717a]">
        {query
          ? "Try a different search."
          : "Ask the AI to generate a PDF — or start from a template below and make it your own."}
      </p>
    </div>
  );
}

interface LandingCardsProps {
  documents: Document[];
  templates: TemplateRow[];
  query: string;
  onDeleteDocument: (id: string) => Promise<void>;
}

export function LandingCards({
  documents,
  templates,
  query,
  onDeleteDocument,
}: LandingCardsProps) {
  const router = useRouter();
  const [creating, setCreating] = useState<string | null>(null);
  // Ids removed optimistically so the card disappears from the UI instantly,
  // before the server round-trip confirms the DB deletion.
  const [removedIds, setRemovedIds] = useState<string[]>([]);
  const [, startTransition] = useTransition();

  const q = query.trim().toLowerCase();
  const filteredDocs = (
    q ? documents.filter((d) => d.title.toLowerCase().includes(q)) : documents
  ).filter((d) => !removedIds.includes(d.id));
  const filteredTemplates = q
    ? templates.filter(
        (t) =>
          t.name.toLowerCase().includes(q) ||
          (t.description ?? "").toLowerCase().includes(q),
      )
    : templates;

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

  const handleDelete = async (id: string) => {
    // Trim from the frontend immediately, then persist the deletion.
    setRemovedIds((prev) => [...prev, id]);
    await onDeleteDocument(id);
  };

  return (
    <div className="px-8 pb-16 pt-3">
      {/* ── All documents ── */}
      <section id="documents-section" className="mb-12 scroll-mt-4">
        <SectionHead title="All documents" count={filteredDocs.length} />
        {filteredDocs.length === 0 ? (
          <EmptyDocuments query={q} />
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {filteredDocs.map((doc) => (
              <DocumentCard key={doc.id} doc={doc} onDelete={handleDelete} />
            ))}
          </div>
        )}
      </section>

      {/* ── Templates ── */}
      <section id="templates-section" className="scroll-mt-4">
        <SectionHead title="Templates" count={filteredTemplates.length} />
        {filteredTemplates.length === 0 ? (
          <EmptyDocuments query={q} />
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {filteredTemplates.map((template) => (
              <TemplateCard
                key={template.id}
                template={template}
                creating={creating === template.slug}
                onSelect={handleCreate}
              />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
