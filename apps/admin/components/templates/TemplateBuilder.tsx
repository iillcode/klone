"use client";

import { useActionState, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  createTemplate,
  updateTemplate,
  type TemplateState,
} from "@/app/actions/templates";
import {
  DEFAULT_STRUCTURE,
  TEMPLATE_CATEGORIES,
  type TemplateBlueprint,
  type TemplateComponent,
  type TemplatePageSettings,
  type TemplateRow,
} from "@/lib/template-types";
import {
  CATALOG_COMPONENTS,
  CATALOG_GROUPS,
  catalogSnapshot,
} from "@/lib/template-components";
import { cn } from "@/lib/utils";
import { Button } from "@repo/ui/button";
import { Input } from "@repo/ui/input";
import { Textarea } from "@repo/ui/textarea";
import { Label } from "@repo/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@repo/ui/select";
import {
  ArrowLeft,
  Blocks,
  Braces,
  Check,
  ChevronDown,
  ChevronRight,
  CircleCheck,
  Copy,
  ExternalLink,
  Eye,
  FileText,
  Info,
  LayoutTemplate,
  ListChecks,
  LoaderCircle,
  Plus,
  RotateCw,
  Save,
  Search,
  Sparkles,
  TriangleAlert,
  X,
} from "lucide-react";

type Props = {
  template?: TemplateRow | null;
};

type View = "details" | "page" | "components" | "structure" | "requirements";

const VIEWS: { id: View; label: string; icon: typeof FileText }[] = [
  { id: "details", label: "Details", icon: FileText },
  { id: "page", label: "Page design", icon: LayoutTemplate },
  { id: "components", label: "Components", icon: Blocks },
  { id: "structure", label: "Structure", icon: Braces },
  { id: "requirements", label: "Requirements", icon: ListChecks },
];

const GROUP_COLORS: Record<string, string> = {
  Body: "#6366f1",
  Typography: "#22d3ee",
  Lists: "#a78bfa",
  Tables: "#34d399",
  Media: "#f472b6",
  Composite: "#fbbf24",
  Other: "#a1a1aa",
};

const PAGE_FORMATS = ["A4", "Letter", "Legal", "A5"];

const DEFAULT_PAGE: TemplatePageSettings = {
  format: "A4",
  content_width: "794px",
  margin: "2.5rem",
  body_background: "#ffffff",
};

function slugify(value: string): string {
  return (
    value
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "") || "section"
  );
}

/**
 * Normalize a stored component list to the fixed catalog: every catalog block
 * is present (falling back to its catalog defaults), in catalog order, with
 * any unknown/leftover blocks appended at the end. Indices line up with the
 * displayed (grouped) list so patches by index are safe.
 */
function normalizeComponents(list: TemplateComponent[]): TemplateComponent[] {
  const byKey = new Map<string, TemplateComponent>();
  for (const c of list) byKey.set(c.key, c);

  const merged = new Map<string, TemplateComponent>();
  for (const cat of CATALOG_COMPONENTS) {
    const stored = byKey.get(cat.key);
    merged.set(
      cat.key,
      stored
        ? { ...stored, tags: [...(stored.tags ?? [])] }
        : { ...cat, tags: [...cat.tags], required: false },
    );
  }
  for (const c of list) {
    if (!merged.has(c.key)) merged.set(c.key, { ...c, tags: [...(c.tags ?? [])] });
  }

  const known = CATALOG_COMPONENTS.map((cat) => merged.get(cat.key)!).filter(
    Boolean,
  );
  const leftovers = Array.from(merged.values()).filter(
    (c) => !CATALOG_COMPONENTS.some((cat) => cat.key === c.key),
  );
  return [...known, ...leftovers];
}

/** Build the initial blueprint — new templates ship the full fixed catalog. */
function initialBlueprint(template?: TemplateRow | null): TemplateBlueprint {
  const bp = template?.blueprint;
  const page = bp?.page ?? DEFAULT_PAGE;
  const components =
    Array.isArray(bp?.components) && bp.components.length
      ? normalizeComponents(bp.components)
      : catalogSnapshot();

  return {
    version: 2,
    page,
    structure: bp?.structure || DEFAULT_STRUCTURE,
    components,
    requirements: Array.isArray(bp?.requirements) ? bp.requirements : [],
  };
}

/** Assemble a preview document from the blueprint + component blocks. */
function buildPreviewHtml(bp: TemplateBlueprint): string {
  const page = bp.page;
  const css = bp.components.map((c) => c.css).filter(Boolean).join("\n\n");
  const html = bp.components.map((c) => c.html).filter(Boolean).join("\n");
  let doc = bp.structure.trim() || DEFAULT_STRUCTURE;

  const ambient = `body { background: ${page.body_background}; }`;

  if (/<style[\s>]/i.test(doc)) {
    doc = doc.replace(/(<style[^>]*>)/i, `$1\n${ambient}\n${css}`);
  } else {
    doc = doc.replace(
      /<\/head>/i,
      `<style>\n${ambient}\n${css}\n</style>\n</head>`,
    );
  }

  if (doc.includes("<!--content-->")) {
    doc = doc.replace("<!--content-->", html);
  } else {
    doc = doc.replace(/<\/body>/i, `${html}\n</body>`);
  }

  return doc;
}

/** A single block rendered on its own for a quick per-component preview. */
function buildBlockPreview(c: TemplateComponent): string {
  const css = c.css || "";
  const html = c.html || "";
  return `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8" />
<style>
${css}
body { margin: 24px; background: #ffffff; }
</style>
</head>
<body>
${html}
</body>
</html>`;
}

/* ─────────────────────────── small UI atoms ─────────────────────────── */

function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs font-medium text-muted-foreground">{label}</Label>
      {children}
      {hint && <p className="text-xs text-muted-foreground/60">{hint}</p>}
    </div>
  );
}

function Panel({
  title,
  hint,
  children,
  className,
}: {
  title?: string;
  hint?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section
      className={cn(
        "space-y-4 rounded-2xl border border-border bg-card p-5",
        className,
      )}
    >
      {(title || hint) && (
        <header>
          {title && (
            <h2 className="text-sm font-semibold text-foreground">{title}</h2>
          )}
          {hint && (
            <p className="mt-1 text-xs leading-relaxed text-muted-foreground/70">
              {hint}
            </p>
          )}
        </header>
      )}
      {children}
    </section>
  );
}

function Segmented<T extends string>({
  value,
  onChange,
  options,
}: {
  value: T;
  onChange: (value: T) => void;
  options: { value: T; label: string }[];
}) {
  return (
    <div className="flex items-center gap-0.5 rounded-lg bg-muted p-0.5">
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          onClick={() => onChange(o.value)}
          className={cn(
            "rounded-md px-2.5 py-1 text-xs font-medium transition-colors",
            value === o.value
              ? "bg-background text-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground",
          )}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

function Switch({
  checked,
  onCheckedChange,
  label,
}: {
  checked: boolean;
  onCheckedChange: (value: boolean) => void;
  label: string;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      title={label}
      onClick={() => onCheckedChange(!checked)}
      className={cn(
        "relative inline-flex h-5 w-9 shrink-0 items-center rounded-full border transition-colors focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50",
        checked ? "border-transparent bg-primary" : "border-border bg-muted",
      )}
    >
      <span
        className={cn(
          "inline-block size-3.5 transform rounded-full bg-white shadow-sm transition-transform",
          checked ? "translate-x-[18px]" : "translate-x-[3px]",
        )}
      />
    </button>
  );
}

/** Code input with tab-key support, line numbers and a language chip. */
function CodeEditor({
  value,
  onChange,
  language,
  viewportClass = "h-44",
  placeholder,
}: {
  value: string;
  onChange: (value: string) => void;
  language?: string;
  viewportClass?: string;
  placeholder?: string;
}) {
  const taRef = useRef<HTMLTextAreaElement>(null);
  const gutterRef = useRef<HTMLDivElement>(null);
  const lineCount = value.split("\n").length;

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Tab") {
      e.preventDefault();
      const el = e.currentTarget;
      const { selectionStart, selectionEnd } = el;
      const next =
        value.slice(0, selectionStart) + "  " + value.slice(selectionEnd);
      onChange(next);
      requestAnimationFrame(() => {
        el.selectionStart = el.selectionEnd = selectionStart + 2;
      });
    }
  };

  return (
    <div className="overflow-hidden rounded-lg border border-border bg-[#0c0c0e]">
      <div className="flex items-center justify-between border-b border-border/60 bg-background/50 px-3 py-1.5">
        {language ? (
          <span className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
            {language}
          </span>
        ) : (
          <span />
        )}
        <span className="font-mono text-[10px] text-muted-foreground/50">
          {lineCount} lines
        </span>
      </div>
      <div className={cn("relative", viewportClass)}>
        <div
          ref={gutterRef}
          aria-hidden
          className="pointer-events-none absolute inset-y-0 left-0 w-10 overflow-hidden border-r border-border/60 bg-[#0d0d0f] py-2 pr-1.5 text-right font-mono text-[11px] leading-[1.5] text-muted-foreground/40 select-none"
        >
          <pre className="font-mono text-[11px] leading-[1.5]">
            {Array.from({ length: lineCount }, (_, i) => i + 1).join("\n")}
          </pre>
        </div>
        <textarea
          ref={taRef}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onScroll={() => {
            const ta = taRef.current;
            const gutter = gutterRef.current;
            if (ta && gutter) gutter.scrollTop = ta.scrollTop;
          }}
          onKeyDown={handleKeyDown}
          spellCheck={false}
          wrap="off"
          placeholder={placeholder}
          className="h-full w-full resize-none overflow-auto bg-transparent py-2 pl-11 pr-3 font-mono text-[11px] leading-[1.5] text-zinc-200 caret-[#6366f1] outline-none placeholder:text-zinc-600"
        />
      </div>
    </div>
  );
}

/** Renders a single block (html+css) in an isolated iframe so you can see the design. */
function BlockPreview({ c }: { c: TemplateComponent }) {
  const [key, setKey] = useState(0);
  return (
    <div className="overflow-hidden rounded-xl border border-border bg-card">
      <div className="flex items-center justify-between border-b border-border/70 px-3 py-1.5">
        <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
          Block preview
        </span>
        <button
          type="button"
          onClick={() => setKey((k) => k + 1)}
          className="inline-flex items-center gap-1 text-[11px] text-muted-foreground transition-colors hover:text-foreground"
        >
          <RotateCw className="size-3" /> Refresh
        </button>
      </div>
      <iframe
        key={key}
        title={`${c.key} block preview`}
        srcDoc={buildBlockPreview(c)}
        className="h-44 w-full bg-white"
        sandbox=""
      />
    </div>
  );
}

function ComponentCard({
  c,
  index,
  onPatch,
  color,
  defaultOpen,
}: {
  c: TemplateComponent;
  index: number;
  onPatch: (index: number, patch: Partial<TemplateComponent>) => void;
  color: string;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(Boolean(defaultOpen));
  const [pane, setPane] = useState<"guidance" | "markup">("guidance");
  const [preview, setPreview] = useState(false);

  return (
    <div className="overflow-hidden rounded-xl border border-border bg-background/40 transition-colors focus-within:border-border">
      <div className="flex items-center gap-2 p-2.5">
        <button
          type="button"
          aria-label={open ? "Collapse block" : "Expand block"}
          onClick={() => setOpen((o) => !o)}
          className="grid size-6 shrink-0 place-items-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        >
          <ChevronRight
            className={cn("size-4 transition-transform", open && "rotate-90")}
          />
        </button>
        <span
          className="size-2 shrink-0 rounded-full"
          style={{ background: color }}
        />
        <span className="shrink-0 rounded border border-border bg-muted px-1.5 py-px font-mono text-[11px] leading-4 text-muted-foreground">
          {c.key}
        </span>
        <Input
          value={c.name}
          onChange={(e) => onPatch(index, { name: e.target.value })}
          placeholder="Block name"
          className="h-8 min-w-0 flex-1 text-sm"
        />
        <Switch
          checked={c.required}
          onCheckedChange={(v) => onPatch(index, { required: v })}
          label="Required for agents"
        />
      </div>

      {!open && (
        <p className="line-clamp-1 px-11 pb-2.5 pr-3 text-xs text-muted-foreground/60">
          {c.description || "No description yet."}
        </p>
      )}

      {open && (
        <>
          <div className="flex items-center justify-between gap-2 border-t border-border/70 px-2.5 py-2">
            <Segmented
              value={pane}
              onChange={setPane}
              options={[
                { value: "guidance", label: "Guidance" },
                { value: "markup", label: "HTML / CSS" },
              ]}
            />
            <span className="hidden text-[11px] text-muted-foreground/60 sm:inline">
              {c.tags.length} tags
            </span>
          </div>
          <div className="space-y-3 border-t border-border/70 p-3 pt-3">
            {pane === "guidance" ? (
              <>
                <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                  <Field label="Tags">
                    <Input
                      value={c.tags.join(", ")}
                      onChange={(e) =>
                        onPatch(index, {
                          tags: e.target.value
                            .split(",")
                            .map((t) => t.trim())
                            .filter(Boolean),
                        })
                      }
                      className="h-7 text-xs"
                      placeholder="h1, heading, title"
                    />
                  </Field>
                  <Field label="Description (for agents)">
                    <Textarea
                      value={c.description}
                      onChange={(e) =>
                        onPatch(index, { description: e.target.value })
                      }
                      rows={2}
                      className="text-xs"
                      placeholder="What this component is for…"
                    />
                  </Field>
                </div>
                <Field label="Guidance (for agents)">
                  <Textarea
                    value={c.guidance}
                    onChange={(e) =>
                      onPatch(index, { guidance: e.target.value })
                    }
                    rows={3}
                    className="text-xs"
                    placeholder="How to author this block…"
                  />
                </Field>
              </>
            ) : (
              <>
                <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                  <Field label="HTML structure">
                    <CodeEditor
                      language="html"
                      value={c.html}
                      onChange={(v) => onPatch(index, { html: v })}
                      placeholder="<h1>Document title</h1>"
                    />
                  </Field>
                  <Field label="CSS design">
                    <CodeEditor
                      language="css"
                      value={c.css}
                      onChange={(v) => onPatch(index, { css: v })}
                      placeholder="h1 { font-size: 2rem; }"
                    />
                  </Field>
                </div>
                <div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setPreview((p) => !p)}
                  >
                    <Eye className="size-3.5" />
                    {preview ? "Hide preview" : "Preview this block"}
                  </Button>
                  {preview && <div className="mt-3">
                    <BlockPreview c={c} />
                  </div>}
                </div>
              </>
            )}
          </div>
        </>
      )}
    </div>
  );
}

/* ─────────────────────────── main component ─────────────────────────── */

export default function TemplateBuilder({ template }: Props) {
  const router = useRouter();
  const editing = Boolean(template?.id);

  const action = editing ? updateTemplate : createTemplate;
  const [state, formAction, pending] = useActionState<TemplateState, FormData>(
    action,
    {},
  );
  const lastStateRef = useRef(state);

  const [name, setName] = useState(template?.name ?? "");
  const [slug, setSlug] = useState(template?.slug ?? "");
  const [description, setDescription] = useState(template?.description ?? "");
  const [category, setCategory] = useState(template?.category ?? "");
  const [tagsText, setTagsText] = useState(template?.tags?.join(", ") ?? "");
  const [isActive, setIsActive] = useState(template?.is_active ?? true);
  const [blueprint, setBlueprint] = useState<TemplateBlueprint>(() =>
    initialBlueprint(template),
  );

  const [view, setView] = useState<View>("details");
  const [query, setQuery] = useState("");
  const [openGroups, setOpenGroups] = useState<Set<string>>(
    () => new Set(CATALOG_GROUPS.length ? [CATALOG_GROUPS[0]] : []),
  );
  const [showJson, setShowJson] = useState(false);
  const [copied, setCopied] = useState(false);
  const [zoom, setZoom] = useState(100);
  const [pvKey, setPvKey] = useState(0);
  const [toast, setToast] = useState<{
    tone: "success" | "error";
    text: string;
  } | null>(null);

  const components = useMemo(
    () => normalizeComponents(blueprint.components),
    [blueprint.components],
  );

  const previewHtml = useMemo(() => buildPreviewHtml(blueprint), [blueprint]);
  const blueprintJson = useMemo(
    () => JSON.stringify(blueprint, null, 2),
    [blueprint],
  );

  const snapshot = useMemo(
    () =>
      JSON.stringify({
        name,
        slug,
        description,
        category,
        tagsText,
        isActive,
        blueprint,
      }),
    [name, slug, description, category, tagsText, isActive, blueprint],
  );
  const baselineRef = useRef(snapshot);
  const dirty = snapshot !== baselineRef.current;

  // Warn before leaving with unsaved changes.
  useEffect(() => {
    if (!dirty) return;
    const handler = (e: BeforeUnloadEvent) => e.preventDefault();
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [dirty]);

  // Handle the server action result (guard against repeat handling).
  useEffect(() => {
    if (state === lastStateRef.current) return;
    lastStateRef.current = state;
    if (state.ok) {
      setToast({
        tone: "success",
        text: editing ? "Template saved" : "Template created",
      });
      if (editing) {
        baselineRef.current = snapshot;
        router.refresh();
      } else {
        router.refresh();
        router.push("/dashboard/templates");
      }
    } else if (state.error) {
      setToast({ tone: "error", text: state.error });
    }
  }, [state, editing, snapshot, router]);

  // Auto-dismiss toast.
  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 2600);
    return () => clearTimeout(t);
  }, [toast]);

  const handleName = (value: string) => {
    setName(value);
    if (!slug) setSlug(slugify(value));
  };

  const patchPage = (patch: Partial<TemplatePageSettings>) =>
    setBlueprint((b) => ({ ...b, page: { ...b.page, ...patch } }));

  const patchComponent = (index: number, patch: Partial<TemplateComponent>) =>
    setBlueprint((b) => ({
      ...b,
      components: b.components.map((c, i) =>
        i === index ? { ...c, ...patch } : c,
      ),
    }));

  const patchRequirement = (index: number, value: string) =>
    setBlueprint((b) => ({
      ...b,
      requirements: b.requirements.map((r, i) => (i === index ? value : r)),
    }));

  const addRequirement = () =>
    setBlueprint((b) => ({ ...b, requirements: [...b.requirements, ""] }));

  const removeRequirement = (index: number) =>
    setBlueprint((b) => ({
      ...b,
      requirements: b.requirements.filter((_, i) => i !== index),
    }));

  const copyJson = async () => {
    try {
      await navigator.clipboard.writeText(blueprintJson);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // Clipboard unavailable — ignore.
    }
  };

  const back = () => router.push("/dashboard/templates");

  const openPreviewTab = async () => {
    try {
      const blob = new Blob([previewHtml], { type: "text/html" });
      const url = URL.createObjectURL(blob);
      window.open(url, "_blank", "noopener");
    } catch {
      // Ignore popup blockers.
    }
  };

  /** Group the normalized fixed components by catalog group. */
  const groups = useMemo(() => {
    const list: { group: string; items: TemplateComponent[] }[] = [];
    for (const group of CATALOG_GROUPS) {
      const keys = CATALOG_COMPONENTS.filter((c) => c.group === group).map(
        (c) => c.key,
      );
      const items = keys
        .map((key) => components.find((c) => c.key === key))
        .filter((c): c is TemplateComponent => Boolean(c));
      if (items.length) list.push({ group, items });
    }
    const known = new Set(CATALOG_COMPONENTS.map((c) => c.key));
    const others = components.filter((c) => !known.has(c.key));
    if (others.length) list.push({ group: "Other", items: others });
    return list;
  }, [components]);

  const searching = query.trim().length > 0;
  const matchesComponent = (c: TemplateComponent, q: string) =>
    [c.name, c.key, c.group ?? "", c.description, c.guidance, ...(c.tags ?? [])]
      .join(" ")
      .toLowerCase()
      .includes(q);

  const filteredGroups = useMemo(() => {
    if (!searching) return groups;
    const q = query.trim().toLowerCase();
    return groups
      .map((g) => ({ ...g, items: g.items.filter((c) => matchesComponent(c, q)) }))
      .filter((g) => g.items.length);
  }, [groups, query, searching]);

  const toggleGroup = (group: string) =>
    setOpenGroups((prev) => {
      const next = new Set(prev);
      if (next.has(group)) next.delete(group);
      else next.add(group);
      return next;
    });

  const allOpen = groups.length > 0 && groups.every((g) => openGroups.has(g.group));
  const toggleAllGroups = () =>
    setOpenGroups(allOpen ? new Set() : new Set(groups.map((g) => g.group)));

  const requiredCount = components.filter((c) => c.required).length;
  const onFormKeyDown = (e: React.KeyboardEvent<HTMLFormElement>) => {
    if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "s") {
      e.preventDefault();
      if (!pending) e.currentTarget.requestSubmit();
    }
  };

  return (
    <form
      action={formAction}
      onKeyDown={onFormKeyDown}
      className="w-full"
    >
      <input type="hidden" name="id" value={template?.id ?? ""} />
      <input type="hidden" name="category" value={category} />
      <input type="hidden" name="is_active" value={isActive ? "true" : "false"} />
      <input type="hidden" name="blueprint" value={JSON.stringify(blueprint)} />

      {/* Sticky action bar */}
      <div className="sticky top-0 z-20 -mx-6 mb-6 border-b border-border/60 bg-background/85 px-6 py-3 backdrop-blur-sm">
        <div className="flex items-center justify-between gap-3">
          <div className="flex min-w-0 items-center gap-3">
            <button
              type="button"
              onClick={back}
              aria-label="Back to templates"
              className="grid size-8 shrink-0 place-items-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            >
              <ArrowLeft className="size-4" />
            </button>
            <div className="min-w-0">
              <p className="text-[11px] leading-4 text-muted-foreground">
                {editing ? "Editing template" : "New template"}
              </p>
              <h1 className="truncate text-sm font-semibold text-foreground">
                {name || "Untitled template"}
              </h1>
            </div>
            {editing ? (
              dirty ? (
                <span className="hidden items-center gap-1.5 rounded-full border border-amber-400/30 bg-amber-400/10 px-2.5 py-1 text-[11px] font-medium text-amber-400 sm:inline-flex">
                  <TriangleAlert className="size-3" /> Unsaved changes
                </span>
              ) : (
                <span className="hidden items-center gap-1.5 rounded-full border border-emerald-400/30 bg-emerald-400/10 px-2.5 py-1 text-[11px] font-medium text-emerald-400 sm:inline-flex">
                  <Check className="size-3" /> All changes saved
                </span>
              )
            ) : (
              <span className="hidden items-center gap-1.5 rounded-full border border-primary/30 bg-primary/10 px-2.5 py-1 text-[11px] font-medium text-primary sm:inline-flex">
                <Sparkles className="size-3" /> New template
              </span>
            )}
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={back}
              className="text-muted-foreground"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              size="sm"
              disabled={pending || (editing && !dirty)}
            >
              {pending ? (
                <>
                  <LoaderCircle className="size-3.5 animate-spin" /> Saving…
                </>
              ) : (
                <>
                  <Save className="size-3.5" />
                  {editing ? "Save changes" : "Create template"}
                </>
              )}
            </Button>
          </div>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[190px_minmax(0,1fr)_340px]">
        {/* Section navigation rail */}
        <aside className="hidden xl:block">
          <nav className="sticky top-16 space-y-1">
            {VIEWS.map((v) => {
              const Icon = v.icon;
              const active = view === v.id;
              const badge =
                v.id === "components"
                  ? components.length
                  : v.id === "requirements"
                    ? blueprint.requirements.length
                    : undefined;
              return (
                <button
                  key={v.id}
                  type="button"
                  onClick={() => setView(v.id)}
                  className={cn(
                    "flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm transition-colors",
                    active
                      ? "bg-primary/10 font-medium text-foreground"
                      : "text-muted-foreground hover:bg-muted/60 hover:text-foreground",
                  )}
                >
                  <Icon
                    className={cn(
                      "size-4",
                      active ? "text-primary" : "text-muted-foreground",
                    )}
                  />
                  <span className="flex-1 text-left">{v.label}</span>
                  {badge !== undefined && (
                    <span
                      className={cn(
                        "rounded-full px-1.5 py-px text-[10px] font-medium",
                        active
                          ? "bg-primary/15 text-primary"
                          : "bg-muted text-muted-foreground",
                      )}
                    >
                      {badge}
                    </span>
                  )}
                </button>
              );
            })}

            <div className="rounded-xl border border-border bg-card p-3 pt-3">
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">Blocks</span>
                <span className="font-semibold">{components.length}</span>
              </div>
              <div className="mt-1.5 flex items-center justify-between text-xs">
                <span className="text-muted-foreground">Required</span>
                <span className="font-semibold text-primary">{requiredCount}</span>
              </div>
              <div className="mt-1.5 flex items-center justify-between text-xs">
                <span className="text-muted-foreground">Groups</span>
                <span>{groups.length}</span>
              </div>
              <div className="mt-1.5 flex items-center justify-between text-xs">
                <span className="text-muted-foreground">Status</span>
                <span
                  className={
                    isActive ? "font-medium text-emerald-400" : "text-muted-foreground"
                  }
                >
                  {isActive ? "Active" : "Inactive"}
                </span>
              </div>
            </div>
          </nav>
        </aside>

        {/* Main editor content */}
        <div className="min-w-0 space-y-5">
          {/* Mobile tab strip */}
          <div className="mb-1 flex items-center gap-1 overflow-x-auto pb-1 xl:hidden">
            {VIEWS.map((v) => {
              const Icon = v.icon;
              const active = view === v.id;
              return (
                <button
                  key={v.id}
                  type="button"
                  onClick={() => setView(v.id)}
                  className={cn(
                    "inline-flex shrink-0 items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium transition-colors",
                    active
                      ? "bg-primary/10 text-foreground"
                      : "text-muted-foreground hover:bg-muted/60",
                  )}
                >
                  <Icon className="size-3.5" />
                  {v.label}
                </button>
              );
            })}
          </div>

          {view === "details" && (
            <Panel
              title="Template details"
              hint="Metadata, classification and publish state. The name and slug identify the template; tags help agents search for it."
            >
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Field label="Name">
                  <Input
                    name="name"
                    value={name}
                    onChange={(e) => handleName(e.target.value)}
                    placeholder="Business report"
                  />
                </Field>
                <Field label="Slug">
                  <Input
                    name="slug"
                    value={slug}
                    onChange={(e) => setSlug(slugify(e.target.value))}
                    placeholder="business-report"
                  />
                </Field>
              </div>
              <Field label="Description">
                <Textarea
                  name="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={3}
                  placeholder="What is this template for?"
                />
              </Field>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Field label="Category">
                  <Select
                    value={category}
                    onValueChange={(v) => setCategory(v ?? "")}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue>
                        {(value) =>
                          value ? String(value) : "Select a category…"
                        }
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      {TEMPLATE_CATEGORIES.map((c) => (
                        <SelectItem key={c} value={c} label={c}>
                          {c}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </Field>
                <Field label="Tags">
                  <Input
                    name="tags"
                    value={tagsText}
                    onChange={(e) => setTagsText(e.target.value)}
                    placeholder="report, business, analytics"
                  />
                </Field>
              </div>
              <div className="flex items-center justify-between gap-4 rounded-xl border border-border bg-background/40 p-4">
                <div>
                  <p className="text-sm font-medium text-foreground">
                    Active template
                  </p>
                  <p className="mt-0.5 text-xs text-muted-foreground/70">
                    Visible and selectable by agents when generating documents.
                  </p>
                </div>
                <Switch
                  checked={isActive}
                  onCheckedChange={setIsActive}
                  label="Active template"
                />
              </div>
            </Panel>
          )}

          {view === "page" && (
            <Panel
              title="Page design"
              hint="Global page constraints applied to the generated document — format, available width, margins and the document background."
            >
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Field label="Format">
                  <Select
                    value={blueprint.page.format}
                    onValueChange={(v) => patchPage({ format: v ?? "A4" })}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue>
                        {(value) => (value ? String(value) : "A4")}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      {PAGE_FORMATS.map((f) => (
                        <SelectItem key={f} value={f} label={f}>
                          {f}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </Field>
                <Field label="Content width">
                  <Input
                    value={blueprint.page.content_width}
                    onChange={(e) =>
                      patchPage({ content_width: e.target.value })
                    }
                    placeholder="794px"
                  />
                </Field>
                <Field label="Margin">
                  <Input
                    value={blueprint.page.margin}
                    onChange={(e) => patchPage({ margin: e.target.value })}
                    placeholder="2.5rem"
                  />
                </Field>
                <Field label="Body background">
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={blueprint.page.body_background}
                      onChange={(e) =>
                        patchPage({ body_background: e.target.value })
                      }
                      className="h-9 w-12 cursor-pointer rounded-md border border-input bg-transparent p-1"
                    />
                    <Input
                      value={blueprint.page.body_background}
                      onChange={(e) =>
                        patchPage({ body_background: e.target.value })
                      }
                      placeholder="#ffffff"
                    />
                  </div>
                </Field>
              </div>
            </Panel>
          )}

          {view === "components" && (
            <Panel
              title="Component blocks"
              hint="Fixed reusable blocks every template ships with. Each block carries an HTML structure, CSS design and guidance so agents know when — and how — to use it."
            >
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                <div className="relative flex-1">
                  <Search className="absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Search blocks by name, tag or key…"
                    className="pl-8"
                  />
                  {query && (
                    <button
                      type="button"
                      aria-label="Clear search"
                      onClick={() => setQuery("")}
                      className="absolute right-2 top-1/2 grid size-5 -translate-y-1/2 place-items-center rounded text-muted-foreground hover:bg-muted hover:text-foreground"
                    >
                      <X className="size-3.5" />
                    </button>
                  )}
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={toggleAllGroups}
                  disabled={searching}
                >
                  {allOpen && !searching ? "Collapse all" : "Expand all"}
                </Button>
              </div>

              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
                <span>{components.length} blocks</span>
                <span className="text-border">•</span>
                <span>{requiredCount} required</span>
                <span className="text-border">•</span>
                <span>{groups.length} groups</span>
              </div>

              <div className="space-y-3 pt-1">
                {filteredGroups.map(({ group, items }) => (
                  <div
                    key={group}
                    className={cn(
                      "overflow-hidden rounded-2xl border border-border bg-card",
                    )}
                  >
                    <button
                      type="button"
                      onClick={() => toggleGroup(group)}
                      className="flex w-full items-center gap-2.5 px-4 py-3 text-left transition-colors hover:bg-accent/40"
                    >
                      <span
                        className="size-2 shrink-0 rounded-full"
                        style={{
                          background:
                            GROUP_COLORS[group] ?? GROUP_COLORS.Other,
                        }}
                      />
                      <span className="text-sm font-semibold">{group}</span>
                      <span className="text-xs text-muted-foreground">
                        {items.length} blocks
                        {items.some((c) => c.required) &&
                          ` · ${items.filter((c) => c.required).length} required`}
                      </span>
                      <ChevronDown
                        className={cn(
                          "ml-auto size-4 text-muted-foreground transition-transform",
                          (searching || openGroups.has(group)) && "rotate-180",
                        )}
                      />
                    </button>
                    {(searching || openGroups.has(group)) && (
                      <div className="space-y-2.5 border-t border-border/70 p-2.5">
                        {items.map((c) => {
                          const index = components.indexOf(c);
                          return (
                            <ComponentCard
                              key={c.key}
                              c={c}
                              index={index}
                              onPatch={patchComponent}
                              color={
                                GROUP_COLORS[group] ?? GROUP_COLORS.Other
                              }
                              defaultOpen={group === CATALOG_GROUPS[0]}
                            />
                          );
                        })}
                      </div>
                    )}
                  </div>
                ))}

                {searching && filteredGroups.length === 0 && (
                  <div className="rounded-xl border border-dashed border-border p-6 text-center">
                    <Search className="mx-auto size-5 text-muted-foreground/50" />
                    <p className="mt-2 text-sm font-medium text-foreground">
                      No blocks match “{query}”
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground/70">
                      Try a tag, name or key like “card” or “h1”.
                    </p>
                  </div>
                )}
              </div>

              <p className="flex items-start gap-1.5 pt-1 text-xs text-muted-foreground/70">
                <Info className="mt-0.5 size-3.5 shrink-0" />
                This is the fixed component set — all {components.length} blocks
                are included in every template. Keys stay stable so saved
                documents keep working; edit designs per template.
              </p>
            </Panel>
          )}

          {view === "structure" && (
            <Panel
              title="Response structure"
              hint="The overall HTML document agents use to assemble their response. Put a <!--content--> placeholder where the component blocks get injected."
            >
              <CodeEditor
                language="html"
                viewportClass="h-72"
                value={blueprint.structure}
                onChange={(v) =>
                  setBlueprint({ ...blueprint, structure: v })
                }
                placeholder="<!DOCTYPE html>…"
              />
            </Panel>
          )}

          {view === "requirements" && (
            <Panel
              title="Requirements"
              hint="Global constraints the agent must follow when assembling the document — fonts, dependencies, tone, structure rules."
            >
              {blueprint.requirements.length === 0 ? (
                <div className="rounded-xl border border-dashed border-border p-6 text-center">
                  <ListChecks className="mx-auto size-5 text-muted-foreground/50" />
                  <p className="mt-2 text-sm font-medium text-foreground">
                    No requirements yet
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground/70">
                    Add rules the agent must always follow, e.g. no external
                    fonts or network dependencies.
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  {blueprint.requirements.map((r, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <Input
                        value={r}
                        onChange={(e) => patchRequirement(i, e.target.value)}
                        className="flex-1"
                        placeholder="e.g. No external fonts or network dependencies"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon-sm"
                        onClick={() => removeRequirement(i)}
                        aria-label="Remove requirement"
                        className="shrink-0 text-destructive"
                      >
                        <X className="size-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
              <Button type="button" variant="outline" onClick={addRequirement}>
                <Plus className="size-3.5" /> Add requirement
              </Button>
            </Panel>
          )}
        </div>

        {/* Live preview rail */}
        <aside className="space-y-4 xl:sticky xl:top-16 xl:self-start">
          <div className="overflow-hidden rounded-2xl border border-border bg-card">
            <div className="flex items-center justify-between gap-2 border-b border-border px-3 py-2">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                Live preview
              </span>
              <div className="flex items-center gap-1">
                <select
                  value={zoom}
                  onChange={(e) => setZoom(Number(e.target.value))}
                  aria-label="Preview zoom"
                  className="h-7 rounded-md border border-input bg-transparent px-1.5 text-xs text-muted-foreground outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
                >
                  {[50, 75, 100, 125, 150].map((z) => (
                    <option key={z} value={z}>
                      {z}%
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  onClick={() => setPvKey((k) => k + 1)}
                  aria-label="Refresh preview"
                  className="grid size-7 place-items-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                >
                  <RotateCw className="size-3.5" />
                </button>
                <button
                  type="button"
                  onClick={openPreviewTab}
                  aria-label="Open preview in new tab"
                  className="grid size-7 place-items-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                >
                  <ExternalLink className="size-3.5" />
                </button>
              </div>
            </div>
            <div
              className="overflow-auto bg-[radial-gradient(circle_at_1px_1px,rgba(255,255,255,0.05)_1px,transparent_0)] bg-[size:16px_16px]"
              style={{ height: Math.round((540 * zoom) / 100) }}
            >
              <div
                style={{
                  width: `${10000 / zoom}%`,
                  transform: `scale(${zoom / 100})`,
                  transformOrigin: "top left",
                }}
              >
                <iframe
                  key={pvKey}
                  title="Template preview"
                  srcDoc={previewHtml}
                  className="h-[540px] w-full bg-card"
                  sandbox=""
                />
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-1.5 border-t border-border px-3 py-2">
              {[
                blueprint.page.format,
                blueprint.page.content_width,
                blueprint.page.margin,
                `${components.length} blocks`,
              ].map((chip, i) => (
                <span
                  key={i}
                  className="rounded-md bg-muted px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground"
                >
                  {chip}
                </span>
              ))}
            </div>
          </div>

          <div className="rounded-2xl border border-border bg-card">
            <div className="flex items-center justify-between border-b border-border px-3 py-2">
              <button
                type="button"
                onClick={() => setShowJson((s) => !s)}
                className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground transition-colors hover:text-foreground"
              >
                <Braces className="size-3.5" />
                Blueprint JSON
                <ChevronDown
                  className={cn(
                    "size-3.5 transition-transform",
                    showJson && "rotate-180",
                  )}
                />
              </button>
              {showJson && (
                <span className="flex items-center gap-2">
                  {copied && (
                    <span className="text-[11px] font-medium text-emerald-400">
                      Copied!
                    </span>
                  )}
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    onClick={copyJson}
                    aria-label="Copy blueprint JSON"
                  >
                    <Copy className="size-3.5" />
                  </Button>
                </span>
              )}
            </div>
            {showJson && (
              <pre className="max-h-72 overflow-auto bg-background/60 p-3 font-mono text-[11px] leading-relaxed text-muted-foreground">
                {blueprintJson}
              </pre>
            )}
          </div>
        </aside>
      </div>

      {/* Toast */}
      {toast && (
        <div
          className={cn(
            "fixed bottom-5 right-5 z-50 flex max-w-sm items-start gap-2.5 rounded-xl border px-4 py-3 text-sm shadow-lg",
            toast.tone === "success"
              ? "border-emerald-400/30 bg-[#06231a] text-emerald-300"
              : "border-red-400/30 bg-[#2a0a0a] text-red-300",
          )}
        >
          {toast.tone === "success" ? (
            <CircleCheck className="mt-0.5 size-4 shrink-0" />
          ) : (
            <TriangleAlert className="mt-0.5 size-4 shrink-0" />
          )}
          <span className="min-w-0 flex-1">{toast.text}</span>
          <button
            type="button"
            onClick={() => setToast(null)}
            aria-label="Dismiss notification"
            className="grid size-5 shrink-0 place-items-center rounded text-current/60 hover:text-current"
          >
            <X className="size-3.5" />
          </button>
        </div>
      )}
    </form>
  );
}