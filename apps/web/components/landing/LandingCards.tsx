'use client';

import { useLayoutEffect, useMemo, useRef, useState, useTransition } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import type { Document } from '@/lib/types';
import { TEMPLATE_META } from '@/lib/data/template-meta';
import { createDocumentFromTemplate } from '@/app/actions/documents';
import { ChevronRight, FileText, Loader2 } from 'lucide-react';

/** A4 page size used to scale document previews into card thumbnails. */
const PAGE_WIDTH = 794;
const PAGE_HEIGHT = 1123;

/** Branded gradient thumbnails for each starter template. */
const TEMPLATE_GRADIENTS: Record<string, string> = {
  blank: 'linear-gradient(180deg,#2f9e77,#d9f4e6)',
  'api-docs': 'linear-gradient(100deg,#3f68d6,#22d3ee)',
  'landing-page': 'radial-gradient(120% 120% at 20% 20%,#7c3aed 0%,#0ea5e9 45%,#0f172a 100%)',
  email: 'conic-gradient(from 210deg at 60% 40%,#f97316,#db2777,#1e3a8a,#f97316)',
};

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
    <div ref={containerRef} className="relative h-full w-full overflow-hidden bg-white">
      {scale > 0 && (
        <div
          className="absolute left-0 top-0 origin-top-left"
          style={{ width: PAGE_WIDTH, height: PAGE_HEIGHT, transform: `scale(${scale})` }}
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
        {(title.trim()[0] || 'K').toUpperCase()}
      </div>
      <span className="text-[10px] font-semibold uppercase tracking-wider text-white/80">
        PDF Document
      </span>
    </div>
  );
}

/** One document card: live thumbnail + title + PDF badge + date. */
function DocumentCard({ doc }: { doc: Document }) {
  const date = new Date(doc.updated_at).toLocaleDateString();

  return (
    <Link
      href={`/preview/${doc.id}`}
      className="group block overflow-hidden rounded-xl border border-[#2d2d2d] bg-[#1a1a1a] transition-colors hover:border-[#3f3f46]"
    >
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
            <h3 className="truncate text-sm font-medium text-[#e4e4e7]">{doc.title}</h3>
          </div>
          <span className="flex-none text-xs text-[#a1a1aa]">Updated {date}</span>
        </div>
      </div>
    </Link>
  );
}

/** One starter-template card: gradient thumb + name + create action. */
function TemplateCard({
  meta,
  creating,
  onSelect,
}: {
  meta: (typeof TEMPLATE_META)[number];
  creating: boolean;
  onSelect: (id: string) => void;
}) {
  return (
    <button
      onClick={() => onSelect(meta.id)}
      disabled={creating}
      className="group block overflow-hidden rounded-xl border border-[#2d2d2d] bg-[#1a1a1a] text-left transition-colors hover:border-[#3f3f46] disabled:cursor-wait disabled:opacity-70"
    >
      <div
        className="relative aspect-[4/3] overflow-hidden"
        style={{ background: TEMPLATE_GRADIENTS[meta.id] ?? 'linear-gradient(160deg,#161616,#2b2b2b)' }}
      >
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-1 px-3 text-center">
          <span className="text-sm font-extrabold text-white/95 drop-shadow">{meta.name}</span>
          <span className="text-[10px] font-semibold uppercase tracking-wider text-white/70">
            Template
          </span>
        </div>
        {creating && (
          <div className="absolute inset-0 grid place-items-center bg-black/40">
            <Loader2 className="h-6 w-6 animate-spin text-white" />
          </div>
        )}
      </div>
      <div className="flex items-center justify-between gap-2 p-3">
        <span className="truncate text-sm font-medium text-[#e4e4e7]">{meta.name}</span>
        <span className="inline-flex flex-none items-center gap-1 text-xs text-[#a1a1aa] transition-colors group-hover:text-[#e4e4e7]">
          Use
          <ChevronRight className="h-3.5 w-3.5" />
        </span>
      </div>
    </button>
  );
}

function SectionHead({ title, count }: { title: string; count: number }) {
  return (
    <div className="mb-4 flex items-center justify-between">
      <h2 className="text-[15px] font-bold tracking-[-0.01em] text-[#e4e4e7]">{title}</h2>
      <span className="text-xs font-medium text-[#a1a1aa]">{count}</span>
    </div>
  );
}

function EmptyDocuments({ query }: { query: string }) {
  return (
    <div className="rounded-xl border border-dashed border-[#3f3f46] bg-[#1a1a1a] px-6 py-14 text-center">
      <div className="mx-auto grid h-12 w-12 place-items-center rounded-xl bg-[#1e1e1e]">
        <FileText className="h-6 w-6 text-[#a1a1aa]" />
      </div>
      <p className="mt-3 text-sm font-medium text-[#e4e4e7]">
        {query ? `No documents match “${query}”` : 'No documents yet'}
      </p>
      <p className="mx-auto mt-1 max-w-sm text-xs leading-5 text-[#a1a1aa]">
        {query
          ? 'Try a different search.'
          : 'Ask the AI to generate a PDF — or start from a template below and make it your own.'}
      </p>
    </div>
  );
}

interface LandingCardsProps {
  documents: Document[];
  query: string;
}

export function LandingCards({ documents, query }: LandingCardsProps) {
  const router = useRouter();
  const [creating, setCreating] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  const q = query.trim().toLowerCase();
  const filteredDocs = q
    ? documents.filter((d) => d.title.toLowerCase().includes(q))
    : documents;
  const filteredTemplates = q
    ? TEMPLATE_META.filter((t) => t.name.toLowerCase().includes(q))
    : TEMPLATE_META;

  const handleCreate = (slug: string) => {
    setCreating(slug);
    startTransition(async () => {
      const result = await createDocumentFromTemplate(slug);
      setCreating(null);
      if ('id' in result) {
        router.push(`/preview/${result.id}`);
      }
    });
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
              <DocumentCard key={doc.id} doc={doc} />
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
            {filteredTemplates.map((meta) => (
              <TemplateCard
                key={meta.id}
                meta={meta}
                creating={creating === meta.id}
                onSelect={handleCreate}
              />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
