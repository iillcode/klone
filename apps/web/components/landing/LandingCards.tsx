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
  Loader2,
  MoreVertical,
  Trash2,
} from "lucide-react";
import { DropdownMenu, DropdownMenuItem } from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { pressClasses } from "@/components/ui/Button";
import {
  DottedPath,
  Person,
  StepBadge,
} from "@/components/marketing/landing/primitives";

/** A4 page size used to scale document/template previews into card thumbnails. */
const PAGE_WIDTH = 794;
const PAGE_HEIGHT = 1123;

/**
 * Shared scaled A4 preview used by both document and template cards.
 * The page is rendered as a floating sheet centered on a dark matte so the
 * white paper reads as a document against the dark dashboard theme.
 */
function PagePreview({ html, title }: { html: string | null; title: string }) {
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

  if (!html) {
    return <ThumbPlaceholder title={title} />;
  }

  // Fit the sheet to ~84% of the mat height (16/10 area) so it floats with
  // visible dark margins.
  const areaHeight = (width * 10) / 16; // thumbnail area is aspect-[16/10]
  const scale = width > 0 ? (areaHeight * 0.84) / PAGE_HEIGHT : 0;

  return (
    <div
      ref={containerRef}
      className="relative h-full w-full overflow-hidden bg-[#121213]"
    >
      {scale > 0 && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div
            className="origin-center"
            style={{
              width: PAGE_WIDTH,
              height: PAGE_HEIGHT,
              transform: `scale(${scale})`,
            }}
          >
            <iframe
              title={`Preview of ${title}`}
              srcDoc={html}
              sandbox="allow-scripts"
              loading="lazy"
              className="h-[1123px] w-[794px] border-0 bg-white"
              onLoad={() => setLoaded(true)}
            />
          </div>
        </div>
      )}
      {!loaded && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-[#3f3f46] border-t-[#aef637]" />
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

/** One document card: floating A4 thumbnail + title + meta row + actions. */
function DocumentCard({
  doc,
  onDelete,
  selected,
  onToggleSelect,
  onOpen,
}: {
  doc: Document;
  onDelete: (id: string) => void;
  selected: boolean;
  onToggleSelect: (id: string) => void;
  onOpen: (id: string) => void;
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
    <div
      className="group relative overflow-hidden rounded-xl border border-[#262626] bg-[#1a1a1a] hover:border-[#3d3d3d]"
    >
      <div className="relative aspect-[16/10] overflow-hidden">
        <PagePreview html={doc.html_code} title={doc.title} />
      </div>
      {/* Compact single-row footer: badge + title + date + menu */}
      <div className="flex items-center gap-2 px-3 py-2.5">
        <span className="inline-flex flex-none items-center rounded bg-[#16245a] px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-[#8fb3ff]">
          PDF
        </span>
        <h3 className="min-w-0 flex-1 truncate text-[13px] font-semibold text-[#e4e4e7]">
          {doc.title}
        </h3>
        <span className="flex-none text-[11px] tabular-nums text-[#71717a]">
          {date}
        </span>
        <span className="relative z-10 flex-none">
          <DropdownMenu
            trigger={
              <span
                className="grid h-6 w-6 place-items-center rounded text-[#a1a1aa] transition-colors hover:bg-[#2d2d2d] hover:text-[#e4e4e7]"
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
                    className={cn(pressClasses("danger", "xs"), "flex-1")}
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
                    className={cn(pressClasses("dark", "xs"), "flex-1")}
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
        </span>
      </div>
      {/* Click selects the card (green border); double-click opens it */}
      <Link
        href={`/preview/${doc.id}`}
        className="absolute inset-0"
        aria-label={`Open ${doc.title}`}
        onClick={(e) => {
          // Keyboard activation (detail === 0) opens directly; a mouse
          // single-click selects the card instead of navigating.
          if (e.detail === 0) return;
          e.preventDefault();
          onToggleSelect(doc.id);
        }}
        onDoubleClick={() => onOpen(doc.id)}
      />
    </div>
  );
}

/** One starter-template card: floating A4 preview + name + create action. */
function TemplateCard({
  template,
  creating,
  selected,
  onSelect,
  onToggleSelect,
}: {
  template: TemplateRow;
  creating: boolean;
  selected: boolean;
  onSelect: (slug: string) => void;
  onToggleSelect: (id: string) => void;
}) {
  return (
    <button
      onClick={(e) => {
        // Keyboard activation (detail === 0) creates directly; a mouse
        // single-click selects the card instead.
        if (e.detail === 0) {
          onSelect(template.slug);
          return;
        }
        onToggleSelect(template.id);
      }}
      onDoubleClick={() => onSelect(template.slug)}
      disabled={creating}
      className="group relative block overflow-hidden rounded-xl border border-[#262626] bg-[#1a1a1a] text-left hover:border-[#3d3d3d] disabled:cursor-wait disabled:opacity-70"
    >
      <div className="relative aspect-[16/10] overflow-hidden">
        <PagePreview html={template.preview_html} title={template.name} />
        {creating && (
          <div className="absolute inset-0 grid place-items-center bg-black/50">
            <Loader2 className="h-6 w-6 animate-spin text-[#aef637]" />
          </div>
        )}
      </div>
      {/* Compact single-row footer: category badge + name + chevron */}
      <div className="flex items-center gap-2 px-3 py-2.5">
        {template.category && (
          <span className="inline-flex flex-none items-center rounded bg-[#16245a] px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-[#8fb3ff]">
            {template.category}
          </span>
        )}
        <span className="min-w-0 flex-1 truncate text-[13px] font-semibold text-[#e4e4e7]">
          {template.name}
        </span>
        <ChevronRight className="h-4 w-4 flex-none text-[#71717a] transition-colors group-hover:text-[#aef637]" />
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

function EmptySearch({ query }: { query: string }) {
  return (
    <div className="py-12 text-center">
      <p className="text-sm font-medium text-[#a1a1aa]">
        {query ? `No matches for “${query}”` : "Nothing here yet"}
      </p>
      <p className="mx-auto mt-1 max-w-sm text-xs leading-5 text-[#71717a]">
        Try a different search.
      </p>
    </div>
  );
}

const SANS = "var(--font-geist-sans), sans-serif";

/** Captions under the onboarding diagram; each title links somewhere useful. */
const GUIDE_CAPTIONS = [
  {
    title: "Choose a template",
    href: "#templates-section",
    body: "Pick a layout that fits, then make it yours.",
  },
  {
    title: "Connect your AI assistant",
    href: "/docs#setup",
    body: "Link Klone to your AI so it can write documents for you.",
  },
  {
    title: "Edit in the template editor",
    href: "/docs#tools",
    body: "Polish every detail, then download it as a PDF.",
  },
] as const;

/** Static pipeline diagram in the landing-page visual language: three numbered
 *  nodes connected by dotted paths. The viewBox width (640) matches the caption
 *  grid below, so nodes sit directly above their column centers. */
function GuideDiagram() {
  return (
    <svg
      viewBox="0 0 640 175"
      role="img"
      aria-label="Template, AI assistant and editor working together"
      className="mx-auto w-full max-w-[640px]"
    >
      {/* Connectors */}
      <DottedPath d="M 164 91 H 262" />
      <DottedPath d="M 378 91 H 476" />

      {/* ── Step 1 · Template card ── */}
      <g>
        <rect x={48} y={48} width={116} height={86} fill="#1c1c1d" stroke="#3f3f42" strokeWidth="1" />
        <rect x={60} y={62} width={92} height={58} fill="#232324" stroke="#3f3f42" strokeWidth="1" strokeDasharray="3 3" />
        <rect x={68} y={70} width={34} height={5} fill="#aef637" />
        <rect x={68} y={81} width={64} height={9} fill="none" stroke="#3f3f42" strokeWidth="1" strokeDasharray="2 2" />
        <rect x={68} y={96} width={52} height={9} fill="none" stroke="#3f3f42" strokeWidth="1" strokeDasharray="2 2" />
        <text x={106} y={155} textAnchor="middle" fontSize="11" fontWeight="600" fontFamily={SANS} fill="#a1a1a6">
          Templates
        </text>
      </g>
      <StepBadge cx={48} cy={48} n={1} tone="accent" />

      {/* ── Step 2 · AI assistant ── */}
      <g>
        <rect x={262} y={48} width={116} height={86} fill="#1c1c1d" stroke="#3f3f42" strokeWidth="1" />
        <Person x={320} y={96} />
        {/* static typing-dots row (no SMIL animation) */}
        <circle cx={311} cy={118} r={2.6} fill="#aef637" />
        <circle cx={320} cy={118} r={2.6} fill="#aef637" />
        <circle cx={329} cy={118} r={2.6} fill="#aef637" />
        <text x={320} y={155} textAnchor="middle" fontSize="11" fontWeight="600" fontFamily={SANS} fill="#a1a1a6">
          Your AI
        </text>
      </g>
      <StepBadge cx={262} cy={48} n={2} />

      {/* ── Step 3 · Editor ── */}
      <g>
        <rect x={476} y={48} width={116} height={86} fill="#1c1c1d" stroke="#3f3f42" strokeWidth="1" />
        <rect x={486} y={60} width={96} height={62} fill="#232324" stroke="#333336" strokeWidth="1" />
        <rect x={494} y={68} width={44} height={6} fill="#aef637" />
        <rect x={494} y={80} width={56} height={3} fill="#3d3d40" />
        <rect x={494} y={88} width={46} height={3} fill="#3d3d40" />
        <rect x={494} y={96} width={52} height={3} fill="#3d3d40" />
        <rect x={494} y={105} width={32} height={9} fill="none" stroke="#aef637" strokeWidth="1.2" />
        <circle cx={568} cy={72} r={3} fill="#aef637" />
        <circle cx={576} cy={72} r={3} fill="#c7bff4" />
        <text x={534} y={155} textAnchor="middle" fontSize="11" fontWeight="600" fontFamily={SANS} fill="#a1a1a6">
          Editor
        </text>
      </g>
      <StepBadge cx={476} cy={48} n={3} />
    </svg>
  );
}

/** Landing-style onboarding guide shown when there are no projects yet. */
function OnboardingGuide() {
  return (
    <div
      className="mx-auto max-w-3xl py-4"
      aria-label="How to create your first project"
    >
      <p className="animate-onboarding-fade-up text-center font-mono text-[11px] tracking-[0.14em] text-[#737373]">
        GET STARTED · 3 STEPS
      </p>
      <div className="animate-onboarding-fade-up mt-7" style={{ animationDelay: "120ms" }}>
        <GuideDiagram />
      </div>
      <ol
        className="animate-onboarding-fade-up mx-auto mt-5 grid max-w-[640px] grid-cols-1 gap-y-6 sm:grid-cols-3"
        style={{ animationDelay: "240ms" }}
      >
        {GUIDE_CAPTIONS.map((step, i) => (
          <li key={step.title} className="text-left sm:text-center">
            <p className="font-mono text-[11px] tracking-wide text-[#737373]">
              0{i + 1}
            </p>
            <h3 className="mt-1.5 text-[15px] font-bold tracking-tight text-[#ededed]">
              <Link
                href={step.href}
                onClick={
                  step.href.startsWith("#")
                    ? (e) => {
                        e.preventDefault();
                        document
                          .getElementById(step.href.slice(1))
                          ?.scrollIntoView({ behavior: "smooth" });
                      }
                    : undefined
                }
                className="underline decoration-[#3f3f42] underline-offset-4 transition-colors duration-150 hover:text-[#aef637] hover:decoration-[#aef637] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#aef637]"
              >
                {step.title}
              </Link>
            </h3>
            <p className="mt-1.5 text-xs leading-5 text-[#71717a]">{step.body}</p>
          </li>
        ))}
      </ol>
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
  // The currently selected card — a single click toggles selection, which
  // highlights the card with the brand-green border.
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const toggleSelect = (id: string) =>
    setSelectedId((prev) => (prev === id ? null : id));
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
    <div className="px-8 pb-16 pt-6">
      {/* ── Projects ── */}
      <section id="documents-section" className="mb-12 scroll-mt-4">
        <SectionHead title="Projects" count={filteredDocs.length} />
        {filteredDocs.length === 0 ? (
          documents.length === 0 ? (
            <OnboardingGuide />
          ) : (
            <EmptySearch query={q} />
          )
        ) : (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {filteredDocs.map((doc) => (
              <DocumentCard
                key={doc.id}
                doc={doc}
                onDelete={handleDelete}
                selected={selectedId === doc.id}
                onToggleSelect={toggleSelect}
                onOpen={(id) => router.push(`/preview/${id}`)}
              />
            ))}
          </div>
        )}
      </section>

      {/* ── Templates ── */}
      <section id="templates-section" className="scroll-mt-4">
        <SectionHead title="Templates" count={filteredTemplates.length} />
        {filteredTemplates.length === 0 ? (
          <EmptySearch query={q} />
        ) : (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {filteredTemplates.map((template) => (
              <TemplateCard
                key={template.id}
                template={template}
                creating={creating === template.slug}
                selected={selectedId === template.id}
                onSelect={handleCreate}
                onToggleSelect={toggleSelect}
              />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
