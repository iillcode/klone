import {
  FileText,
  Library,
  List,
  Pencil,
  Save,
  Search,
  Trash2,
} from "lucide-react";
import { Eyebrow, GridLines, LandingContainer } from "../landing/Section";

interface ToolSpec {
  name: string;
  kind: "Template" | "Document";
  icon: typeof FileText;
  summary: string;
  params: { name: string; detail: string }[];
}

/** The exact tool surface registered by apps/mcp — keep in sync. */
const TOOLS: ToolSpec[] = [
  {
    name: "list_pdf_templates",
    kind: "Template",
    icon: List,
    summary:
      "Browse the PDF templates you can build from. Returns metadata only (id, slug, name, category, tags) — the usual first step for any new document.",
    params: [
      { name: "category?", detail: "Filter, e.g. Reports, Business" },
      { name: "query?", detail: "Search names, descriptions, tags" },
      { name: "limit?", detail: "Max results (default 50)" },
    ],
  },
  {
    name: "get_pdf_template",
    kind: "Template",
    icon: Search,
    summary:
      "Fetch one template's full blueprint: page constraints, the HTML skeleton with a content injection point, the component blocks with their HTML/CSS designs, and global authoring requirements.",
    params: [
      { name: "slug?", detail: "e.g. 'business-report' or 'invoice'" },
      { name: "template_id?", detail: "UUID alternative to slug" },
    ],
  },
  {
    name: "create_document",
    kind: "Document",
    icon: Save,
    summary:
      "Save a composed, self-contained HTML document under your account. It appears instantly in the web editor, ready to refine and export as PDF.",
    params: [
      { name: "title", detail: "Short descriptive title" },
      { name: "html_code", detail: "Full HTML document (embed <style>)" },
      { name: "template_slug?", detail: "Which template built this" },
      { name: "description / prompt_used?", detail: "Optional context" },
      { name: "metadata?", detail: "Free key-value pairs" },
    ],
  },
  {
    name: "list_documents",
    kind: "Document",
    icon: Library,
    summary:
      "List your saved documents, most recently updated first. Handy for agents that need to find or continue work on an existing document.",
    params: [
      { name: "limit?", detail: "Max results (default 50)" },
      { name: "offset?", detail: "Pagination offset" },
    ],
  },
  {
    name: "get_document",
    kind: "Document",
    icon: FileText,
    summary:
      "Fetch one document by id — including its HTML — owned by your account.",
    params: [{ name: "id", detail: "The document's UUID" }],
  },
  {
    name: "update_document",
    kind: "Document",
    icon: Pencil,
    summary:
      "Change fields of an existing document. Only the fields you pass are modified — titles, description, HTML, CSS, template link, prompt, or metadata.",
    params: [
      { name: "id", detail: "The document's UUID" },
      { name: "title / html_code / …", detail: "Any subset of fields" },
    ],
  },
  {
    name: "delete_document",
    kind: "Document",
    icon: Trash2,
    summary:
      "Permanently remove a document from your library. Agents should ask you first — this cannot be undone.",
    params: [{ name: "id", detail: "The document's UUID" }],
  },
];

function kindTone(kind: ToolSpec["kind"]) {
  return kind === "Template"
    ? "bg-[#2c2842] text-[#c7bff4]"
    : "bg-[#aef637] text-[#0a0a0a]";
}

/** Full reference for the 7 MCP tools, grouped by domain. */
export function DocsToolsSection() {
  return (
    <section id="tools" aria-labelledby="tools-heading" className="relative bg-[#161617] scroll-mt-16">
      <GridLines />
      <LandingContainer className="relative py-[64px] md:py-[88px]">
        <div className="mb-14 flex flex-col gap-6 md:gap-8">
          <div className="max-w-[640px]">
            <Eyebrow className="mb-5">Tool reference</Eyebrow>
            <h2
              id="tools-heading"
              className="text-[34px] font-bold leading-[1.05] tracking-tight text-[#ededed] md:text-[44px]"
            >
              7 tools your
              <br />
              assistant gets
            </h2>
            <p className="mt-5 text-[16px] leading-[1.65] text-[#a1a1a6]">
              Two template tools for discovering designs, five document tools
              for creating and managing the result. Every call returns the
              same structured JSON envelope so results are easy to consume.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-4">
            <span className="flex items-center gap-2 border border-[#3f3f42] bg-[#1c1c1d] px-3 py-1.5 text-[12px] font-medium text-[#d4d4d4]">
              <span className={kindTone("Template") + " h-2.5 w-2.5"} />
              2 template tools — read-only
            </span>
            <span className="flex items-center gap-2 border border-[#3f3f42] bg-[#1c1c1d] px-3 py-1.5 text-[12px] font-medium text-[#d4d4d4]">
              <span className={kindTone("Document") + " h-2.5 w-2.5"} />
              5 document tools — create & edit
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-px overflow-hidden border border-[#2a2a2c] bg-[#2a2a2c] md:grid-cols-2">
          {TOOLS.map((tool) => (
            <article key={tool.name} className="bg-[#1c1c1d] p-6">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center border border-[#3f3f42] bg-[#262628]">
                    <tool.icon size={15} className="text-[#ededed]" />
                  </span>
                  <h3 className="font-mono text-[13px] font-semibold tracking-tight text-[#ededed]">
                    {tool.name}
                  </h3>
                </div>
                <span
                  className={`shrink-0 px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] ${kindTone(tool.kind)}`}
                >
                  {tool.kind}
                </span>
              </div>
              <p className="mt-3 text-[13.5px] leading-[1.65] text-[#a1a1a6]">
                {tool.summary}
              </p>
              <dl className="mt-4 space-y-1.5 border-t border-[#2a2a2c] pt-4">
                {tool.params.map((param) => (
                  <div key={param.name} className="flex flex-wrap items-baseline gap-x-3">
                    <dt className="font-mono text-[11.5px] text-[#ededed]">
                      {param.name}
                    </dt>
                    <dd className="text-[12px] text-[#8a8a8a]">{param.detail}</dd>
                  </div>
                ))}
              </dl>
            </article>
          ))}

          {/* filler tile: response envelope, keeps the 2-col grid even */}
          <article className="flex flex-col justify-between bg-[#1a1a1b] p-6">
            <div>
              <span className="px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] bg-[#aef637] text-[#0a0a0a]">
                Response
              </span>
              <h3 className="mt-3 font-mono text-[13px] font-semibold tracking-tight text-[#ededed]">
                One JSON envelope
              </h3>
              <p className="mt-3 text-[13.5px] leading-[1.65] text-[#a1a1a6]">
                Success is <code className="font-mono text-[12px]">{'{ "ok": true, "data": … }'}</code>;
                failures are <code className="font-mono text-[12px]">{'{ "ok": false, "error": … }'}</code> with a
                human-readable message your assistant can relay back to you.
              </p>
            </div>
            <p className="mt-4 border-t border-[#2a2a2c] pt-4 text-[12px] text-[#8a8a8a]">
              The server answers plain JSON — no SSE stream — which keeps
              simple clients working.
            </p>
          </article>
        </div>
      </LandingContainer>
    </section>
  );
}
