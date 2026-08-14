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

type View =
  | "details"
  | "page"
  | "components"
  | "structure"
  | "requirements"
  | "preview";

const VIEWS: { id: View; label: string; icon: typeof FileText }[] = [
  { id: "details", label: "Details", icon: FileText },
  { id: "page", label: "Page design", icon: LayoutTemplate },
  { id: "components", label: "Components", icon: Blocks },
  { id: "structure", label: "Structure", icon: Braces },
  { id: "requirements", label: "Requirements", icon: ListChecks },
  { id: "preview", label: "Preview sample", icon: Eye },
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
  width: "210mm",
  height: "297mm",
  margin: "2.5rem",
  padding: "2.5rem",
  body_background: "#ffffff",
  css: "",
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
 * Normalize a stored component list so each entry has a stable `key` and a
 * `tags` array. This is a pure pass-through (no fixed catalog) — users supply
 * their own components and order.
 */
function normalizeComponents(list: TemplateComponent[]): TemplateComponent[] {
  return list.map((c) => ({
    ...c,
    key: c.key || slugify(c.name || `block-${list.indexOf(c) + 1}`),
    tags: Array.isArray(c.tags) ? [...c.tags] : [],
  }));
}

/** Build the initial blueprint — new templates start with NO components. */
function initialBlueprint(template?: TemplateRow | null): TemplateBlueprint {
  const bp = template?.blueprint;
  const page = { ...DEFAULT_PAGE, ...(bp?.page ?? {}) };
  const components = Array.isArray(bp?.components)
    ? normalizeComponents(bp.components)
    : [];

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
  const css = bp.components
    .map((c) => c.css)
    .filter(Boolean)
    .join("\n\n");
  const html = bp.components
    .map((c) => c.html)
    .filter(Boolean)
    .join("\n");
  let doc = bp.structure.trim() || DEFAULT_STRUCTURE;

  const pageCss = page.css?.trim() || "";

  const ambient = [
    `html { width: ${page.width || "auto"}; height: ${page.height || "auto"}; }`,
    `body { background: ${page.body_background}; margin: ${page.margin}; padding: ${page.padding}; }`,
    pageCss,
  ]
    .filter(Boolean)
    .join("\n");

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
      <Label className="text-xs font-medium text-muted-foreground">
        {label}
      </Label>
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

/** Full editor for a single component (detail pane). */
function ComponentEditor({
  c,
  index,
  onPatch,
}: {
  c: TemplateComponent;
  index: number;
  onPatch: (index: number, patch: Partial<TemplateComponent>) => void;
}) {
  const [preview, setPreview] = useState(false);

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-2.5">
          <span className="size-2.5 shrink-0 rounded-full bg-primary" />
          <Input
            value={c.name}
            onChange={(e) => onPatch(index, { name: e.target.value })}
            placeholder="Block name"
            className="h-9 w-48 text-sm font-medium"
          />
          <span className="hidden shrink-0 rounded border border-border bg-muted px-2 py-1 font-mono text-[11px] text-muted-foreground sm:inline">
            {c.key || "no key"}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <Switch
            checked={c.required}
            onCheckedChange={(v) => onPatch(index, { required: v })}
            label="Required for agents"
          />
          <span className="text-xs text-muted-foreground">Required</span>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Field label="Tags" hint="Comma-separated keywords agents search by.">
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
            className="text-sm"
            placeholder="h1, heading, title"
          />
        </Field>
        <Field label="Group" hint="Visual grouping in the list.">
          <Input
            value={c.group ?? ""}
            onChange={(e) => onPatch(index, { group: e.target.value })}
            className="text-sm"
            placeholder="Typography"
          />
        </Field>
      </div>

      <Field label="Description" hint="What this component is for.">
        <Textarea
          value={c.description}
          onChange={(e) => onPatch(index, { description: e.target.value })}
          rows={2}
          className="text-sm"
          placeholder="What this component is for…"
        />
      </Field>

      <Field label="Guidance" hint="Concrete authoring guidance for the agent.">
        <Textarea
          value={c.guidance}
          onChange={(e) => onPatch(index, { guidance: e.target.value })}
          rows={3}
          className="text-sm"
          placeholder="How to author this block…"
        />
      </Field>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
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

      <div className="flex flex-wrap items-center gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => setPreview((p) => !p)}
        >
          <Eye className="size-3.5" />
          {preview ? "Hide block preview" : "Preview block"}
        </Button>
        {preview && <BlockPreview c={c} />}
      </div>
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
  const [previewSampleHtml, setPreviewSampleHtml] = useState(
    template?.preview_html ?? "",
  );
  const [blueprint, setBlueprint] = useState<TemplateBlueprint>(() =>
    initialBlueprint(template),
  );

  const [view, setView] = useState<View>("details");
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<number | null>(null);
  const [toast, setToast] = useState<{
    tone: "success" | "error";
    text: string;
  } | null>(null);

  const components = useMemo(
    () => normalizeComponents(blueprint.components),
    [blueprint.components],
  );

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
        previewSampleHtml,
        blueprint,
      }),
    [
      name,
      slug,
      description,
      category,
      tagsText,
      isActive,
      previewSampleHtml,
      blueprint,
    ],
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

  const patchComponent = (index: number, patch: Partial<TemplateComponent>) =>
    setBlueprint((b) => ({
      ...b,
      components: b.components.map((c, i) =>
        i === index ? { ...c, ...patch } : c,
      ),
    }));

  const patchPage = (patch: Partial<TemplatePageSettings>) =>
    setBlueprint((b) => ({ ...b, page: { ...b.page, ...patch } }));

  const addComponent = () => {
    setBlueprint((b) => ({
      ...b,
      components: [
        ...b.components,
        {
          key: "",
          name: "",
          description: "",
          guidance: "",
          required: false,
          html: "",
          css: "",
          tags: [],
          group: "Custom",
        },
      ],
    }));
    setSelected(components.length);
  };

  const removeComponent = (index: number) => {
    setBlueprint((b) => ({
      ...b,
      components: b.components.filter((_, i) => i !== index),
    }));
    setSelected((cur) =>
      cur === index ? null : cur === null ? null : cur > index ? cur - 1 : cur,
    );
  };

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

  const back = () => router.push("/dashboard/templates");

  /** Group the user-supplied components by their own `group` (default "Custom"). */
  const groups = useMemo(() => {
    const order: string[] = [];
    const byGroup = new Map<string, TemplateComponent[]>();
    for (const c of components) {
      const group = c.group || "Custom";
      if (!byGroup.has(group)) {
        byGroup.set(group, []);
        order.push(group);
      }
      byGroup.get(group)!.push(c);
    }
    return order.map((group) => ({ group, items: byGroup.get(group)! }));
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
      .map((g) => ({
        ...g,
        items: g.items.filter((c) => matchesComponent(c, q)),
      }))
      .filter((g) => g.items.length);
  }, [groups, query, searching]);

  const requiredCount = components.filter((c) => c.required).length;
  const onFormKeyDown = (e: React.KeyboardEvent<HTMLFormElement>) => {
    if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "s") {
      e.preventDefault();
      if (!pending) e.currentTarget.requestSubmit();
    }
  };

  return (
    <form action={formAction} onKeyDown={onFormKeyDown} className="w-full">
      <input type="hidden" name="id" value={template?.id ?? ""} />
      <input type="hidden" name="category" value={category} />
      <input
        type="hidden"
        name="is_active"
        value={isActive ? "true" : "false"}
      />
      <input type="hidden" name="blueprint" value={JSON.stringify(blueprint)} />
      <input type="hidden" name="preview_html" value={previewSampleHtml} />
      {/* Always-present so saves work from any tab (panels unmount per view). */}
      <input type="hidden" name="name" value={name} />
      <input type="hidden" name="slug" value={slug} />
      <input type="hidden" name="description" value={description} />
      <input type="hidden" name="tags" value={tagsText} />

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

      <div className="space-y-5">
        {/* Section tab strip */}
        <div className="flex items-center gap-1 overflow-x-auto pb-1">
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
                  "inline-flex shrink-0 items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors",
                  active
                    ? "bg-primary/10 text-foreground"
                    : "text-muted-foreground hover:bg-muted/60",
                )}
              >
                <Icon className="size-4" />
                {v.label}
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
        </div>

        {/* Main editor content */}
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
            hint="Global page constraints applied to the generated document. Set the format and content width above, then paste any custom page CSS (width, height, margin, padding, background) into the box below — it is saved to the template and applied to the generated document."
          >
            <div className="space-y-6">
              <section className="space-y-4">
                <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Page metrics
                </h3>
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
                </div>
              </section>

              <section className="space-y-4 border-t border-border pt-6">
                <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Page CSS
                </h3>
                <Field
                  label="Page styles"
                  hint="Paste raw CSS applied to the page (html/body) — width, height, margin, padding, background, etc. Saved to the template and applied to the generated document."
                >
                  <Textarea
                    value={blueprint.page.css}
                    onChange={(e) => patchPage({ css: e.target.value })}
                    placeholder={"html {\n  width: 210mm;\n  height: 297mm;\n}\nbody {\n  margin: 0;\n  padding: 2.5rem;\n  background: #ffffff;\n  color: #1f2937;\n}"}
                    className="min-h-40 font-mono text-xs"
                    spellCheck={false}
                  />
                </Field>
              </section>
            </div>
          </Panel>
        )}

        {view === "components" && (
          <Panel
            title="Component blocks"
            hint="Reusable building blocks the template ships with. Select a block below to edit it — each carries an HTML structure, CSS design and guidance so agents know when and how to use it."
          >
            <div className="flex flex-wrap items-center gap-2">
              <div className="relative min-w-0 flex-1">
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
              <Button type="button" size="sm" onClick={addComponent}>
                <Plus className="size-3.5" /> Add block
              </Button>
            </div>

            {filteredGroups.length === 0 ? (
              <div className="rounded-xl border border-dashed border-border p-10 text-center">
                <Blocks className="mx-auto size-7 text-muted-foreground/50" />
                <p className="mt-3 text-sm font-medium text-foreground">
                  {searching ? "No blocks match" : "No blocks yet"}
                </p>
                <p className="mt-1 text-xs text-muted-foreground/70">
                  {searching
                    ? `Try a tag, name or key like “card”.`
                    : "Add your first block to get started."}
                </p>
                {!searching && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="mt-4"
                    onClick={addComponent}
                  >
                    <Plus className="size-3.5" /> Add block
                  </Button>
                )}
              </div>
            ) : (
              <div className="flex flex-col gap-5">
                {/* Block grid */}
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {filteredGroups.flatMap(({ group, items }) =>
                    items.map((c) => {
                      const index = components.indexOf(c);
                      const color = GROUP_COLORS[group] ?? GROUP_COLORS.Other;
                      return (
                        <div
                          key={`${group}-${index}`}
                          role="button"
                          tabIndex={0}
                          onClick={() => setSelected(index)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter" || e.key === " ") {
                              e.preventDefault();
                              setSelected(index);
                            }
                          }}
                          className={cn(
                            "group flex cursor-pointer flex-col gap-2 rounded-xl border p-3.5 transition-colors",
                            selected === index
                              ? "border-primary/50 bg-primary/10"
                              : "border-border bg-background/40 hover:border-border hover:bg-muted/40",
                          )}
                        >
                          <div className="flex items-center gap-2">
                            <span
                              className="size-2 shrink-0 rounded-full"
                              style={{ background: color }}
                            />
                            <p className="min-w-0 flex-1 truncate text-sm font-medium text-foreground">
                              {c.name || "Untitled block"}
                            </p>
                            <button
                              type="button"
                              aria-label="Remove block"
                              onClick={(e) => {
                                e.stopPropagation();
                                removeComponent(index);
                              }}
                              className="grid size-6 shrink-0 place-items-center rounded-md text-muted-foreground opacity-0 transition-opacity hover:bg-destructive/10 hover:text-destructive group-hover:opacity-100"
                            >
                              <X className="size-3.5" />
                            </button>
                          </div>
                          <p className="truncate font-mono text-[11px] text-muted-foreground">
                            {c.key || "—"}
                          </p>
                          <div className="flex flex-wrap items-center gap-1.5">
                            {c.required && (
                              <span className="rounded-full bg-emerald-400/10 px-1.5 py-px text-[10px] font-medium text-emerald-400">
                                Required
                              </span>
                            )}
                            {c.tags.slice(0, 3).map((t) => (
                              <span
                                key={t}
                                className="rounded-full bg-muted px-1.5 py-px text-[10px] text-muted-foreground"
                              >
                                {t}
                              </span>
                            ))}
                          </div>
                        </div>
                      );
                    }),
                  )}
                </div>

                {/* Selected block editor (full width) */}
                <div className="rounded-xl border border-border bg-card p-4 sm:p-5">
                  <div className="mb-4 flex items-center gap-2 border-b border-border pb-3">
                    <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                      Editing block
                    </span>
                    {selected !== null && components[selected] && (
                      <span className="truncate text-sm font-medium text-foreground">
                        {components[selected].name || "Untitled block"}
                      </span>
                    )}
                  </div>
                  {selected !== null && components[selected] ? (
                    <ComponentEditor
                      c={components[selected]}
                      index={selected}
                      onPatch={patchComponent}
                    />
                  ) : (
                    <div className="flex min-h-[200px] flex-col items-center justify-center text-center">
                      <LayoutTemplate className="size-7 text-muted-foreground/40" />
                      <p className="mt-3 text-sm font-medium text-foreground">
                        Select a block
                      </p>
                      <p className="mt-1 max-w-xs text-xs text-muted-foreground/70">
                        Choose a block above to edit its content, design and
                        agent guidance.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}
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
              onChange={(v) => setBlueprint({ ...blueprint, structure: v })}
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
                  Add rules the agent must always follow, e.g. no external fonts
                  or network dependencies.
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

        {view === "preview" && (
          <Panel
            title="Preview sample"
            hint="A self-contained sample HTML document assembled from this template's components. Shown in the admin library and exposed to the MCP server so users can preview the template before generating a document."
          >
            <Field
              label="Sample HTML"
              hint="Full HTML document (with embedded <style>). If left blank, the live blueprint preview on the right is used as the template's sample."
            >
              <Textarea
                name="preview_html"
                value={previewSampleHtml}
                onChange={(e) => setPreviewSampleHtml(e.target.value)}
                rows={10}
                className="font-mono text-xs"
                placeholder={"<!DOCTYPE html>\n<html>…</html>"}
              />
            </Field>
            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() =>
                  setPreviewSampleHtml(buildPreviewHtml(blueprint))
                }
              >
                <Sparkles className="size-3.5" /> Generate from blueprint
              </Button>
              {previewSampleHtml && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setPreviewSampleHtml("")}
                >
                  <X className="size-3.5" /> Clear
                </Button>
              )}
            </div>
            {previewSampleHtml && (
              <div className="mt-1 overflow-hidden rounded-xl border border-border">
                <iframe
                  title="Sample preview"
                  srcDoc={previewSampleHtml}
                  className="h-[420px] w-full bg-white"
                  sandbox=""
                />
              </div>
            )}
          </Panel>
        )}
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
