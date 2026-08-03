"use client";

import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from "react";
import { useTheme } from "./theme-provider";
import { getEditorScript } from "./editor-iframe";

interface Colors {
  body: string;
  h1: string;
  h2: string;
  h3: string;
  muted: string;
  subtle: string;
  border: string;
  tableTh: string;
  tableTd: string;
  tdCode: string;
  tagBg: string;
  tagFg: string;
  codeBg: string;
  codeBorder: string;
  codeFg: string;
  comment: string;
  key: string;
  str: string;
  num: string;
  bool: string;
  methodHl: string;
  footer: string;
  statusBorder: string;
  method: {
    get: { bg: string; fg: string };
    post: { bg: string; fg: string };
    put: { bg: string; fg: string };
    del: { bg: string; fg: string };
  };
  path: string;
  desc: string;
  scrollThumb: string;
  scrollThumbHover: string;
}

const dark: Colors = {
  body: "#e4e4e7",
  h1: "#f4f4f5",
  h2: "#f4f4f5",
  h3: "#d4d4d8",
  muted: "#a1a1aa",
  subtle: "#71717a",
  border: "#27272a",
  tableTh: "#a1a1aa",
  tableTd: "#d4d4d8",
  tdCode: "#c084fc",
  tagBg: "#1e1e21",
  tagFg: "#a1a1aa",
  codeBg: "#0a0a0b",
  codeBorder: "#27272a",
  codeFg: "#d4d4d8",
  comment: "#71717a",
  key: "#c084fc",
  str: "#4ade80",
  num: "#facc15",
  bool: "#60a5fa",
  methodHl: "#f87171",
  footer: "#52525b",
  statusBorder: "#27272a",
  path: "#e4e4e7",
  desc: "#a1a1aa",
  scrollThumb: "#3f3f46",
  scrollThumbHover: "#52525b",
  method: {
    get: { bg: "#1a3a2a", fg: "#4ade80" },
    post: { bg: "#1e2a4a", fg: "#60a5fa" },
    put: { bg: "#2a2a1a", fg: "#facc15" },
    del: { bg: "#3a1a1a", fg: "#f87171" },
  },
};

const light: Colors = {
  body: "#18181b",
  h1: "#111111",
  h2: "#111111",
  h3: "#27272a",
  muted: "#52525b",
  subtle: "#71717a",
  border: "#e4e4e7",
  tableTh: "#52525b",
  tableTd: "#27272a",
  tdCode: "#7c3aed",
  tagBg: "#f4f4f5",
  tagFg: "#52525b",
  codeBg: "#fafafa",
  codeBorder: "#e4e4e7",
  codeFg: "#18181b",
  comment: "#9ca3af",
  key: "#7c3aed",
  str: "#16a34a",
  num: "#ca8a04",
  bool: "#2563eb",
  methodHl: "#dc2626",
  footer: "#a1a1aa",
  statusBorder: "#e4e4e7",
  path: "#18181b",
  desc: "#52525b",
  scrollThumb: "#d4d4d8",
  scrollThumbHover: "#a1a1aa",
  method: {
    get: { bg: "#dcfce7", fg: "#166534" },
    post: { bg: "#dbeafe", fg: "#1e40af" },
    put: { bg: "#fef9c3", fg: "#854d0e" },
    del: { bg: "#fee2e2", fg: "#991b1b" },
  },
};

function buildHtml(c: Colors): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>PDF Generator API - Documentation</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    html, body { overflow: hidden; height: 100%; }
    body { font-family: system-ui, -apple-system, sans-serif; background: transparent; color: ${c.body}; line-height: 1.5; }
    .scroll-wrapper { height: 100%; overflow-y: auto; padding: 2.5rem; max-width: 794px; margin: 0 auto; scrollbar-width: thin; scrollbar-color: ${c.scrollThumb} transparent; }
    .scroll-wrapper::-webkit-scrollbar { width: 10px; }
    .scroll-wrapper::-webkit-scrollbar-track { background: transparent; }
    .scroll-wrapper::-webkit-scrollbar-thumb { background-color: ${c.scrollThumb}; border-radius: 9999px; border: 3px solid transparent; background-clip: content-box; }
    .scroll-wrapper::-webkit-scrollbar-thumb:hover { background-color: ${c.scrollThumbHover}; background-clip: content-box; }
    .header { margin-bottom: 2rem; border-bottom: 1px solid ${c.border}; padding-bottom: 1.5rem; }
    .header h1 { font-size: 1.75rem; font-weight: 700; color: ${c.h1}; letter-spacing: -0.02em; }
    .header .subtitle { color: ${c.muted}; margin-top: 0.25rem; font-size: 0.875rem; }
    .header .meta { display: flex; gap: 1.5rem; margin-top: 0.75rem; font-size: 0.8rem; color: ${c.subtle}; }
    .section { margin-bottom: 2rem; }
    .section h2 { font-size: 1.1rem; font-weight: 600; color: ${c.h2}; margin-bottom: 0.75rem; letter-spacing: -0.01em; }
    .section h3 { font-size: 0.95rem; font-weight: 600; color: ${c.h3}; margin-bottom: 0.5rem; margin-top: 1rem; }
    .section p { color: ${c.muted}; font-size: 0.85rem; line-height: 1.6; margin-bottom: 1rem; }
    .endpoint { display: flex; align-items: center; gap: 0.75rem; margin-bottom: 1rem; }
    .method { display: inline-block; font-size: 0.75rem; font-weight: 700; padding: 0.2rem 0.55rem; border-radius: 4px; text-transform: uppercase; letter-spacing: 0.04em; }
    .method.get { background: ${c.method.get.bg}; color: ${c.method.get.fg}; }
    .method.post { background: ${c.method.post.bg}; color: ${c.method.post.fg}; }
    .method.put { background: ${c.method.put.bg}; color: ${c.method.put.fg}; }
    .method.delete { background: ${c.method.del.bg}; color: ${c.method.del.fg}; }
    .path { font-family: 'SF Mono', 'Fira Code', monospace; font-size: 0.85rem; color: ${c.path}; }
    .desc { color: ${c.desc}; font-size: 0.85rem; }
    table { width: 100%; border-collapse: collapse; margin: 0.75rem 0 1.25rem; font-size: 0.8rem; }
    th { text-align: left; padding: 0.5rem 0.75rem; color: ${c.tableTh}; font-weight: 600; border-bottom: 1px solid ${c.border}; text-transform: uppercase; font-size: 0.7rem; letter-spacing: 0.05em; }
    td { padding: 0.5rem 0.75rem; border-bottom: 1px solid #1a1a1d; color: ${c.tableTd}; }
    td:first-child { font-family: 'SF Mono', 'Fira Code', monospace; color: ${c.tdCode}; }
    td .tag { display: inline-block; font-size: 0.65rem; padding: 0.15rem 0.4rem; border-radius: 3px; background: ${c.tagBg}; color: ${c.tagFg}; font-family: system-ui; }
    .code-block { background: ${c.codeBg}; border: 1px solid ${c.codeBorder}; border-radius: 6px; padding: 1rem; margin-bottom: 1rem; overflow-x: auto; }
    .code-block pre { font-family: 'SF Mono', 'Fira Code', monospace; font-size: 0.8rem; color: ${c.codeFg}; line-height: 1.6; white-space: pre; }
    .code-block .comment { color: ${c.comment}; }
    .code-block .key { color: ${c.key}; }
    .code-block .string { color: ${c.str}; }
    .code-block .number { color: ${c.num}; }
    .code-block .bool { color: ${c.bool}; }
    .code-block .method-hl { color: ${c.methodHl}; }
    .status-bar { display: flex; justify-content: space-between; align-items: center; padding: 0.6rem 0; margin-bottom: 0.5rem; border-bottom: 1px solid ${c.statusBorder}; }
    .status-bar .label { color: ${c.subtle}; font-size: 0.75rem; text-transform: uppercase; letter-spacing: 0.05em; }
    .footer { margin-top: 2rem; padding-top: 1rem; border-top: 1px solid ${c.border}; display: flex; justify-content: space-between; font-size: 0.75rem; color: ${c.footer}; }
  </style>
</head>
<body>
  <div class="scroll-wrapper">
    <div class="header">
      <h1>PDF Generator API</h1>
    <div class="subtitle">RESTful API for programmatic PDF document generation — v2.1.0</div>
    <div class="meta">
      <span>Base URL: https://api.pdfgen.dev/v2</span>
      <span>Auth: Bearer Token</span>
      <span>Format: JSON</span>
    </div>
  </div>

  <div class="section">
    <h2>Generate PDF</h2>
    <p>Creates a PDF document from HTML content or a template ID. Returns a presigned download URL.</p>

    <div class="endpoint">
      <span class="method post">POST</span>
      <span class="path">/documents</span>
    </div>

    <h3>Request Body</h3>
    <table>
      <thead>
        <tr>
          <th>Parameter</th>
          <th>Type</th>
          <th>Required</th>
          <th>Description</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td>template_id</td>
          <td>string <span class="tag">uuid</span></td>
          <td>conditional*</td>
          <td>ID of a pre-registered template</td>
        </tr>
        <tr>
          <td>html</td>
          <td>string</td>
          <td>conditional*</td>
          <td>Raw HTML content to render</td>
        </tr>
        <tr>
          <td>options.page_size</td>
          <td>string</td>
          <td>optional</td>
          <td>A4, Letter, or custom (default: A4)</td>
        </tr>
        <tr>
          <td>options.margin</td>
          <td>number</td>
          <td>optional</td>
          <td>Margin in mm (default: 20)</td>
        </tr>
        <tr>
          <td>options.orientation</td>
          <td>string</td>
          <td>optional</td>
          <td>portrait or landscape</td>
        </tr>
      </tbody>
    </table>

    <p style="font-size:0.8rem;color:${c.subtle};">* Either template_id or html is required.</p>

    <h3>Example Request</h3>
    <div class="code-block">
      <pre><span class="method-hl">POST</span> https://api.pdfgen.dev/v2/documents
<span class="key">Authorization</span>: Bearer sk_live_abc123def456

{<span class="comment">
  "Use a pre-registered template":</span>
  <span class="key">"template_id"</span>: <span class="string">"tmpl_9a8b7c6d"</span>,<span class="comment">
  "Or inline HTML":</span>
  <span class="key">"html"</span>: <span class="string">"<h1>Hello</h1><p>World</p>"</span>,
  <span class="key">"options"</span>: {
    <span class="key">"page_size"</span>: <span class="string">"A4"</span>,
    <span class="key">"margin"</span>: <span class="number">20</span>,
    <span class="key">"orientation"</span>: <span class="string">"portrait"</span>
  },
  <span class="key">"metadata"</span>: {
    <span class="key">"title"</span>: <span class="string">"Invoice #1024"</span>,
    <span class="key">"tags"</span>: [<span class="string">"invoice"</span>, <span class="string">"production"</span>]
  }
}</pre>
    </div>

    <h3>Example Response</h3>
    <div class="code-block">
      <pre>{
  <span class="key">"id"</span>: <span class="string">"doc_e3f2a1b0"</span>,
  <span class="key">"status"</span>: <span class="string">"completed"</span>,
  <span class="key">"download_url"</span>: <span class="string">"https://storage.pdfgen.dev/d/e3f2a1b0.pdf?X-Amz-Signature=..."</span>,
  <span class="key">"expires_in"</span>: <span class="number">3600</span>,
  <span class="key">"pages"</span>: <span class="number">4</span>,
  <span class="key">"size_bytes"</span>: <span class="number">128_420</span>,
  <span class="key">"created_at"</span>: <span class="string">"2026-03-15T10:30:00Z"</span>
}</pre>
    </div>
  </div>

  <div class="section">
    <h2>Manage Templates</h2>

    <div class="endpoint">
      <span class="method get">GET</span>
      <span class="path">/templates</span>
      <span class="desc">List all templates with pagination</span>
    </div>

    <table>
      <thead>
        <tr><th>Query Param</th><th>Type</th><th>Default</th><th>Description</th></tr>
      </thead>
      <tbody>
        <tr><td>page</td><td>integer</td><td>1</td><td>Page number</td></tr>
        <tr><td>per_page</td><td>integer</td><td>20</td><td>Items per page (max 100)</td></tr>
        <tr><td>search</td><td>string</td><td>—</td><td>Filter by name</td></tr>
      </tbody>
    </table>

    <div class="endpoint">
      <span class="method put">PUT</span>
      <span class="path">/templates/:id</span>
      <span class="desc">Update a template's HTML or options</span>
    </div>

    <div class="endpoint">
      <span class="method delete">DELETE</span>
      <span class="path">/templates/:id</span>
      <span class="desc">Remove a template permanently</span>
    </div>
  </div>

  <div class="status-bar">
    <span class="label">Status</span>
    <span style="color:#4ade80;font-size:0.85rem;">● All systems operational</span>
  </div>

  <div class="footer">
    <span>PDF Generator API — v2.1.0</span>
    <span>Generated 2026-07-29</span>
  </div>
  </div>
${getEditorScript()}
</body>
</html>`;
}

function injectEditorScript(html: string): string {
  return html.replace("</body>", getEditorScript() + "</body>");
}

export interface ElementInfo {
  tag: string;
  classes: string;
  styles: Record<string, string>;
}

export interface HtmlPreviewHandle {
  applyStyleMulti: (property: string, value: string) => void;
  undo: () => void;
  redo: () => void;
  deleteMulti: () => void;
  deselect: () => void;
  moveBy: (dx: number, dy: number) => void;
  cancelTextEdit: () => void;
  exportPdf: () => Promise<void>;
}

interface TextEditState {
  reqId: number;
  text: string;
  tag: string;
  rect: { left: number; top: number; width: number; height: number };
  styles: Record<string, string>;
}

interface HtmlPreviewProps {
  html?: string;
  inspectMode?: boolean;
  onElementSelect?: (elements: ElementInfo[] | null) => void;
  onStyleUpdated?: (property: string, value: string) => void;
  onEditModeChange?: (editing: boolean) => void;
}

export const HtmlPreview = forwardRef<HtmlPreviewHandle, HtmlPreviewProps>(
  function HtmlPreview(
    {
      html,
      inspectMode = false,
      onElementSelect,
      onStyleUpdated,
      onEditModeChange,
    },
    ref,
  ) {
    const { theme } = useTheme();
    const isDark = theme === "dark";
    const defaultHtml = buildHtml(isDark ? dark : light);
    const iframeRef = useRef<HTMLIFrameElement>(null);
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const [editState, setEditState] = useState<TextEditState | null>(null);
    const [draft, setDraft] = useState("");

    // ── Text edit overlay: the editor lives HERE (parent document), so
    // focus is stable and the sandboxed iframe never fights for it. The
    // iframe only reports the element rect + computed styles and applies
    // the result via set-text / cancel-edit messages. ──
    const draftRef = useRef("");

    const commitTextEdit = useCallback(() => {
      setEditState((prev) => {
        if (prev) {
          iframeRef.current?.contentWindow?.postMessage(
            { type: "set-text", reqId: prev.reqId, text: draftRef.current },
            "*",
          );
        }
        return null;
      });
      onEditModeChange?.(false);
    }, [onEditModeChange]);

    const cancelTextEdit = useCallback(() => {
      setEditState((prev) => {
        if (prev) {
          iframeRef.current?.contentWindow?.postMessage(
            { type: "cancel-edit", reqId: prev.reqId },
            "*",
          );
        }
        return null;
      });
      onEditModeChange?.(false);
    }, [onEditModeChange]);

    const handleEditKeyDown = useCallback(
      (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === "Escape") {
          e.preventDefault();
          cancelTextEdit();
        } else if (
          e.key === "Enter" &&
          !e.shiftKey &&
          editState?.tag !== "pre" &&
          editState?.tag !== "code"
        ) {
          // Enter saves except in code blocks (multi-line content).
          e.preventDefault();
          commitTextEdit();
        } else if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
          e.preventDefault();
          commitTextEdit();
        }
      },
      [editState?.tag, commitTextEdit, cancelTextEdit],
    );

    useImperativeHandle(ref, () => ({
      applyStyleMulti: (property: string, value: string) => {
        iframeRef.current?.contentWindow?.postMessage(
          { type: "apply-style", property, value },
          "*",
        );
      },
      undo: () => {
        iframeRef.current?.contentWindow?.postMessage({ type: "undo" }, "*");
      },
      redo: () => {
        iframeRef.current?.contentWindow?.postMessage({ type: "redo" }, "*");
      },
      deleteMulti: () => {
        iframeRef.current?.contentWindow?.postMessage(
          { type: "delete-element" },
          "*",
        );
      },
      deselect: () => {
        iframeRef.current?.contentWindow?.postMessage(
          { type: "deselect" },
          "*",
        );
      },
      moveBy: (dx: number, dy: number) => {
        iframeRef.current?.contentWindow?.postMessage(
          { type: "move-by", dx, dy },
          "*",
        );
      },
      cancelTextEdit: () => {
        cancelTextEdit();
      },
      exportPdf: async () => {
        const iframe = iframeRef.current;
        if (!iframe || !iframe.contentWindow) {
          console.error("[exportPdf] No iframe ref or contentWindow");
          return;
        }

        try {
          // Let any pending editor messages (e.g. set-text restoring element
          // visibility) flush to the iframe before snapshotting the DOM.
          await new Promise((r) => setTimeout(r, 50));
          const doc = iframe.contentDocument;
          if (!doc) {
            console.error("[exportPdf] No contentDocument — check sandbox");
            return;
          }

          const contentWindow = iframe.contentWindow;

          // Clone the full document to preserve ALL inline styles from editor
          const clone = doc.documentElement.cloneNode(true) as HTMLElement;

          // Remove editor overlays from the clone
          clone
            .querySelectorAll("#el-overlay, #hover-overlay, [data-editor-ui]")
            .forEach((el) => el.remove());
          clone.querySelectorAll("script").forEach((el) => el.remove());
          clone
            .querySelectorAll("[data-editor-capture]")
            .forEach((el) => el.remove());

          // Keep the document's own CSS intact. The editor writes its changes as
          // inline styles, which cloneNode preserves. Serializing computed styles
          // here would freeze a partial, iframe-sized layout and can override CSS
          // features that were never included in the export property list.

          // --- Strip clipping styles so Puppeteer renders the full document ---
          // The default HTML has overflow:hidden + height:100% on html/body and
          // height:100%; overflow-y:auto on .scroll-wrapper — these clip content
          // when Puppeteer renders the page. Remove them for PDF output.
          const htmlEl = clone.querySelector("html") as HTMLElement | null;
          const bodyEl = clone.querySelector("body") as HTMLElement | null;
          const scrollEl = clone.querySelector(
            ".scroll-wrapper",
          ) as HTMLElement | null;

          // A transparent body would otherwise be rendered on the PDF viewer's
          // default page colour. Use Klone's canvas colour only when the authored
          // body has no computed background colour.
          const bodyBackground = contentWindow.getComputedStyle(
            doc.body,
          ).backgroundColor;
          const hasBodyBackground =
            bodyBackground !== "transparent" &&
            bodyBackground !== "rgba(0, 0, 0, 0)";

          if (htmlEl) {
            htmlEl.style.overflow = "visible";
            htmlEl.style.height = "auto";
          }
          if (bodyEl) {
            bodyEl.style.overflow = "visible";
            bodyEl.style.height = "auto";
            // Ensure body fills the full page width and centers the
            // scroll-wrapper (which uses margin:0 auto) — without this
            // syncComputedStyles may bake in the iframe's pixel width
            // (e.g. 1198px) which breaks centering in the PDF viewport.
            if (!hasBodyBackground) {
              bodyEl.style.backgroundColor = "rgb(30, 30, 30)";
            }
          }
          if (scrollEl) {
            // Only remove scroll-clipping — keep ALL original styles
            // (padding, max-width, margin:auto) so the PDF looks identical
            scrollEl.style.overflow = "visible";
            scrollEl.style.height = "auto";
            scrollEl.style.maxHeight = "none";
          }

          // Serialize the full HTML document
          const fullHtml = "<!DOCTYPE html>\n" + clone.outerHTML;

          // Call the Puppeteer PDF API
          const response = await fetch("/api/pdf", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              html: fullHtml,
              options: {
                format: "a4",
                landscape: false,
                printBackground: true,
                scale: 1,
              },
            }),
          });

          if (!response.ok) {
            throw new Error(`PDF API error: ${response.status}`);
          }

          // Download the PDF blob directly — no new tab
          const arrayBuffer = await response.arrayBuffer();
          const blob = new Blob([arrayBuffer], { type: "application/pdf" });
          const blobUrl = URL.createObjectURL(blob);

          const a = document.createElement("a");
          a.href = blobUrl;
          a.download = "document.pdf";
          a.style.display = "none";
          document.body.appendChild(a);
          a.click();

          // Cleanup after download starts
          setTimeout(() => {
            a.remove();
            URL.revokeObjectURL(blobUrl);
          }, 200);
        } catch (err) {
          console.error("[exportPdf] PDF generation failed:", err);
        }
      },
    }));

    useEffect(() => {
      const handler = (e: MessageEvent) => {
        if (e.data && e.data.type === "element-selected") {
          onElementSelect?.(e.data.elements);
        }
        if (e.data && e.data.type === "style-updated") {
          onStyleUpdated?.(e.data.property, e.data.value);
        }
        if (e.data && e.data.type === "selection-cleared") {
          onElementSelect?.(null);
        }
        if (e.data && e.data.type === "edit-text-request") {
          setDraft(e.data.text ?? "");
          setEditState({
            reqId: e.data.reqId,
            text: e.data.text ?? "",
            tag: e.data.tag,
            rect: e.data.rect,
            styles: e.data.styles,
          });
          onEditModeChange?.(true);
        }
      };
      window.addEventListener("message", handler);
      return () => window.removeEventListener("message", handler);
    }, [onElementSelect, onStyleUpdated, onEditModeChange]);

    // Keep draftRef in sync so commitTextEdit (stale-closure safe) reads
    // the latest typed value.
    useEffect(() => {
      draftRef.current = draft;
    }, [draft]);

    // Auto-focus + select all when the overlay opens
    useEffect(() => {
      if (editState) {
        textareaRef.current?.focus();
        textareaRef.current?.select();
      }
    }, [editState]);

    // Forward inspect mode to the iframe so it can gate hover/selection behavior
    useEffect(() => {
      iframeRef.current?.contentWindow?.postMessage(
        { type: "inspect-mode", enabled: inspectMode },
        "*",
      );
      // When inspect mode turns off, clear any active selection in the iframe
      // and close the text edit overlay.
      if (!inspectMode) {
        iframeRef.current?.contentWindow?.postMessage(
          { type: "deselect" },
          "*",
        );
        if (editState) {
          setEditState(null);
          onEditModeChange?.(false);
        }
      }
    }, [inspectMode]); // eslint-disable-line react-hooks/exhaustive-deps

    const srcDoc = html ? injectEditorScript(html) : defaultHtml;
    const bg = editState?.styles.backgroundColor ?? "";
    const hasBg = bg && bg !== "transparent" && bg !== "rgba(0, 0, 0, 0)";

    return (
      <div className="relative w-full h-full">
        <iframe
          ref={iframeRef}
          srcDoc={srcDoc}
          className="w-full h-full border-0 bg-transparent"
          title="Preview"
          sandbox="allow-scripts allow-same-origin"
        />
        {editState && (
          <div
            className="absolute z-10"
            style={{
              left: editState.rect.left,
              top: editState.rect.top,
              width: editState.rect.width,
              height: editState.rect.height,
            }}
          >
            <textarea
              ref={textareaRef}
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={handleEditKeyDown}
              onBlur={commitTextEdit}
              spellCheck={false}
              className="w-full h-full resize-none outline-none rounded-none border-0 shadow-none"
              style={{
                boxSizing: "border-box",
                fontFamily: editState.styles.fontFamily,
                fontSize: editState.styles.fontSize,
                fontWeight: editState.styles.fontWeight,
                lineHeight: editState.styles.lineHeight,
                color: editState.styles.color,
                textAlign: editState.styles
                  .textAlign as React.CSSProperties["textAlign"],
                paddingTop: editState.styles.paddingTop,
                paddingRight: editState.styles.paddingRight,
                paddingBottom: editState.styles.paddingBottom,
                paddingLeft: editState.styles.paddingLeft,
                backgroundColor: hasBg ? bg : "transparent",
                overflow: "hidden",
                whiteSpace: "pre-wrap",
              }}
            />
          </div>
        )}
      </div>
    );
  },
);
