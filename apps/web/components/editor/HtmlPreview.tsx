"use client";

import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from "react";
import { useTheme } from "@/components/ui/theme-provider";
import { getEditorScript } from "./editor-iframe";
import { buildHtml, dark, light } from "@/lib/data/templates";

/* Colors/dark/light/buildHtml live in lib/data/templates.ts (shared with the
   template library + document creation). */

/** Thin, arrow-less scrollbar injected into the preview document so the
 *  content scroller (.scroll-wrapper) stays very narrow and the up/down
 *  scroll buttons never appear — regardless of a template's own scrollbar
 *  CSS. Templates set the STANDARD scrollbar-width/scrollbar-color, which in
 *  Chromium DISABLES the WebKit pseudo-elements, so those are forced back to
 *  `auto` and the scrollbar is styled exclusively via `::-webkit-scrollbar`
 *  for full control of the width and to hide the buttons. */
const PREVIEW_SCROLLBAR_STYLE = `<style>
.scroll-wrapper{scrollbar-width:auto !important;scrollbar-color:auto !important;}
.scroll-wrapper::-webkit-scrollbar{width:1px !important;height:4px !important;}
.scroll-wrapper::-webkit-scrollbar-track{background:transparent !important;}
.scroll-wrapper::-webkit-scrollbar-button{display:none !important;width:0 !important;height:0 !important;}
.scroll-wrapper::-webkit-scrollbar-corner{background:transparent !important;}
.scroll-wrapper::-webkit-scrollbar-thumb{background-color:rgba(47, 47, 50, 0.6) !important;border-radius:99px !important;}
.scroll-wrapper::-webkit-scrollbar-thumb:hover{background-color:rgba(113,113,122,0.85) !important;}
</style>`;

function injectEditorScript(html: string): string {
  return html.replace(
    "</body>",
    PREVIEW_SCROLLBAR_STYLE + getEditorScript() + "</body>",
  );
}

/** True when `el` is the very first content element of the document (no
 *  visible content above it). A page break there would only produce a blank
 *  first page, so it is skipped during PDF export. */
function isFirstElementInBody(el: Element): boolean {
  let node: Element | null = el;
  while (node) {
    const parent: HTMLElement | null = node.parentElement;
    if (!parent) return false;
    const isFirstChild = parent.children[0] === node;
    const tag = parent.tagName.toLowerCase();
    if (tag === "html" || tag === "body") return isFirstChild;
    if (!isFirstChild) return false;
    node = parent;
  }
  return false;
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
  /** Align the current selection within its page container. */
  alignElements: (align: AlignMode) => void;
  cancelTextEdit: () => void;
  getFullHtml: () => Promise<string | null>;
  exportPdf: () => Promise<void>;
  /** Remove every marked page-break element. */
  clearPageBreak: () => void;
  /** Append an empty page (boundary) at the end of the document. */
  addPage: () => void;
  /** Move the current selection to page `pageIndex` (0-based; -1 = new page). */
  moveToPage: (pageIndex: number) => void;
}

export type AlignMode =
  | "left"
  | "center-x"
  | "right"
  | "top"
  | "center-y"
  | "bottom";

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
  splitMode?: boolean;
  onElementSelect?: (elements: ElementInfo[] | null) => void;
  onStyleUpdated?: (property: string, value: string) => void;
  onEditModeChange?: (editing: boolean) => void;
  onPageBreakChange?: (
    hasPageBreak: boolean,
    changed: boolean,
    count?: number,
  ) => void;
  onSplitModeChange?: (enabled: boolean) => void;
  onPageInfo?: (info: { page: number; pageCount: number }) => void;
  onPagesChange?: (count: number, changed: boolean) => void;
}

export const HtmlPreview = forwardRef<HtmlPreviewHandle, HtmlPreviewProps>(
  function HtmlPreview(
    {
      html,
      inspectMode = false,
      splitMode = false,
      onElementSelect,
      onStyleUpdated,
      onEditModeChange,
      onPageBreakChange,
      onSplitModeChange,
      onPageInfo,
      onPagesChange,
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

    // Serialize the current iframe document into clean, PDF-ready HTML by
    // cloning the live DOM (inline styles preserved) and stripping editor
    // overlays/scripts/clipping. Shared by exportPdf and getFullHtml.
    const serializeCleanHtml = useCallback(async (
      forExport = false,
    ): Promise<string | null> => {
      const iframe = iframeRef.current;
      if (!iframe || !iframe.contentWindow) {
        console.error("[serialize] No iframe ref or contentWindow");
        return null;
      }

      // Let any pending editor messages (e.g. set-text restoring element
      // visibility) flush to the iframe before snapshotting the DOM.
      await new Promise((r) => setTimeout(r, 50));
      const doc = iframe.contentDocument;
      if (!doc) {
        console.error("[serialize] No contentDocument — check sandbox");
        return null;
      }

      const clone = doc.documentElement.cloneNode(true) as HTMLElement;

      // Remove editor overlays from the clone
      clone
        .querySelectorAll("#el-overlay, #hover-overlay, [data-editor-ui]")
        .forEach((el) => el.remove());
      clone.querySelectorAll("script").forEach((el) => el.remove());
      clone
        .querySelectorAll("[data-editor-capture]")
        .forEach((el) => el.remove());

      // Strip editor chrome that lives as INLINE styles on content elements:
      // the hover/selection outlines (purple, set by editor-iframe). They are
      // never user-authored (the properties sidebar has no outline control),
      // so removing exactly those values never changes the design - but saves
      // a dashed purple box around the last hovered/selected element.
      clone
        .querySelectorAll("[style]")
        .forEach((el) => {
          const s = (el as HTMLElement).style;
          const o = s.outline || "";
          if (
            o.indexOf("8b5cf6") !== -1 ||
            o.indexOf("139, 92, 246") !== -1
          ) {
            s.outline = "";
            s.outlineOffset = "";
          }
        });

      // The editor wraps template documents in a system frame (.klone-frame,
      // created by editor-iframe) so the page frame is sticky. That frame is
      // editor-only chrome - unwrap it here so saved/exported HTML keeps the
      // authored body > .scroll-wrapper structure.
      clone
        .querySelectorAll(".klone-frame[data-klone-system-frame]")
        .forEach((frame) => {
          const inner = frame.firstElementChild;
          if (inner && inner.classList.contains("scroll-wrapper")) {
            frame.replaceWith(inner);
          } else {
            frame.remove();
          }
        });

      // Keep the document's own CSS intact. The editor writes its changes as
      // inline styles, which cloneNode preserves. Serializing computed styles
      // here would freeze a partial, iframe-sized layout and can override CSS
      // features that were never included in the export property list.

      // In the preview the body's background is ALWAYS forced to Klone's
      // canvas colour (see editor-iframe). Restore the document's OWN
      // background - captured by the editor script when the preview loaded
      // - and fall back to Klone's canvas colour only when the authored
      // body had no background at all. This runs for BOTH save and export:
      // a saved document keeps its authored body colour, never the editor's
      // canvas colour.
      const bodyEl = clone.querySelector("body") as HTMLElement | null;
      const authoredBodyBg = (
        doc.body as HTMLElement & { __kloneAuthoredBg?: string }
      ).__kloneAuthoredBg;

      if (bodyEl) {
        // Strip the forced preview canvas background so the document's own
        // body colour is used (PDF) / preserved (save).
        const bodyStyle = bodyEl.getAttribute("style") || "";
        const strippedStyle = bodyStyle
          .split(";")
          .map((s) => s.trim())
          .filter((s) => s && !/^background(?:-color)?\s*:/.test(s))
          .join("; ");
        if (strippedStyle) bodyEl.setAttribute("style", strippedStyle);
        else bodyEl.removeAttribute("style");
        // Ensure body fills the full page width and centers the
        // scroll-wrapper (which uses margin:0 auto) - without this
        // syncComputedStyles may bake in the iframe's pixel width
        // (e.g. 1198px) which breaks centering in the PDF viewport.
        bodyEl.style.backgroundColor = authoredBodyBg || "rgb(30, 30, 30)";
      }

      // Keep the markers when saving so the user can reopen and move them.
      // Only the export clone turns each into a print-only CSS page break.
      if (forExport) {
        // --- Strip clipping styles so Puppeteer renders the full document ---
        // The default HTML has overflow:hidden + height:100% on html/body and
        // height:100%; overflow-y:auto on .scroll-wrapper - these clip content
        // when Puppeteer renders the page. Remove them for PDF output ONLY:
        // baking them into saved HTML would override the template's scroll
        // layout and make a reopened document unscrollable.
        const htmlEl = clone.querySelector("html") as HTMLElement | null;
        const scrollEl = clone.querySelector(
          ".scroll-wrapper",
        ) as HTMLElement | null;
        if (htmlEl) {
          htmlEl.style.overflow = "visible";
          htmlEl.style.height = "auto";
        }
        if (bodyEl) {
          bodyEl.style.overflow = "visible";
          bodyEl.style.height = "auto";
        }
        if (scrollEl) {
          // Only remove scroll-clipping - keep ALL original styles
          // (padding, max-width, margin:auto) so the PDF looks identical
          scrollEl.style.overflow = "visible";
          scrollEl.style.height = "auto";
          scrollEl.style.maxHeight = "none";
        }
        // querySelectorAll keeps document order, and the clone preserves it,
        // so clone[i] corresponds to live[i] for computed-style lookups.
        const liveSplitEls = Array.from(
          doc.querySelectorAll("[data-klone-page-break]"),
        );
        const cloneSplitEls = Array.from(
          clone.querySelectorAll("[data-klone-page-break]"),
        );
        cloneSplitEls.forEach((el, i) => {
          el.removeAttribute("data-klone-page-break");
          const live = liveSplitEls[i];
          if (!live) return;
          // Never break the template structure: the split is applied as a
          // print CSS property ON the marked element itself - no element is
          // inserted, so nesting inside ul/table/p/etc. stays valid.
          if (isFirstElementInBody(live)) return; // would only blank page 1
          const style = el as HTMLElement;
          style.style.breakBefore = "page";
          style.style.pageBreakBefore = "always";
          // Inline elements ignore break-before in Chromium; forcing a block
          // box (export clone only) makes the split actually happen while the
          // authored HTML stays untouched.
          const display = getComputedStyle(live).display;
          if (display === "inline" || display === "inline-block") {
            style.style.display = "block";
          }
        });

        // Editor pages: every data-klone-page-boundary is a page-sized
        // CONTAINER holding that page's content, so each one starts a new
        // PDF page. The on-screen page height is editor chrome (it makes an
        // empty page visible) — in the PDF the printed page provides the
        // height, so min-height is dropped to avoid pushing content onto an
        // extra sheet. Containers stay in saved HTML (reopenable) and are
        // converted only in the export clone.
        const liveBoundaryEls = Array.from(
          doc.querySelectorAll("[data-klone-page-boundary]"),
        );
        const cloneBoundaryEls = Array.from(
          clone.querySelectorAll("[data-klone-page-boundary]"),
        );
        cloneBoundaryEls.forEach((el, i) => {
          el.removeAttribute("data-klone-page-boundary");
          const live = liveBoundaryEls[i];
          if (!live) return;
          const style = el as HTMLElement;
          style.style.minHeight = "0";
          style.style.height = "auto";
          // A page container as the very first content element means page 1
          // has no content — a break there would only blank the first page.
          if (isFirstElementInBody(live)) return;
          style.style.breakBefore = "page";
          style.style.pageBreakBefore = "always";
        });
      }

      // Serialize the full HTML document
      return "<!DOCTYPE html>\n" + clone.outerHTML;
    }, []);

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
      alignElements: (align) => {
        iframeRef.current?.contentWindow?.postMessage(
          { type: "align-elements", align },
          "*",
        );
      },
      cancelTextEdit: () => {
        cancelTextEdit();
      },
      getFullHtml: async () => {
        try {
          return await serializeCleanHtml();
        } catch (err) {
          console.error("[getFullHtml] failed:", err);
          return null;
        }
      },
      exportPdf: async () => {
        try {
          const fullHtml = await serializeCleanHtml(true);
          if (!fullHtml) return;

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
      clearPageBreak: () => {
        iframeRef.current?.contentWindow?.postMessage(
          { type: "clear-split" },
          "*",
        );
      },
      addPage: () => {
        iframeRef.current?.contentWindow?.postMessage(
          { type: "add-page" },
          "*",
        );
      },
      moveToPage: (pageIndex: number) => {
        iframeRef.current?.contentWindow?.postMessage(
          { type: "move-to-page", pageIndex },
          "*",
        );
      },
    }));

    useEffect(() => {
      const handler = (e: MessageEvent) => {
        if (e.data && e.data.type === "element-selected") {
          onElementSelect?.(e.data.elements);
          if (typeof e.data.page === "number") {
            onPageInfo?.({
              page: e.data.page,
              pageCount: e.data.pageCount ?? 1,
            });
          }
        }
        if (e.data && e.data.type === "pages-changed") {
          onPagesChange?.(Number(e.data.count) || 1, Boolean(e.data.changed));
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
        if (e.data && e.data.type === "page-break-updated") {
          onPageBreakChange?.(
            Boolean(e.data.hasPageBreak),
            Boolean(e.data.changed),
            typeof e.data.count === "number" ? e.data.count : undefined,
          );
        }
        if (e.data && e.data.type === "split-mode-changed") {
          onSplitModeChange?.(Boolean(e.data.enabled));
        }
      };
      window.addEventListener("message", handler);
      return () => window.removeEventListener("message", handler);
    }, [
      onElementSelect,
      onStyleUpdated,
      onEditModeChange,
      onPageBreakChange,
      onSplitModeChange,
      onPageInfo,
      onPagesChange,
    ]);

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

    useEffect(() => {
      iframeRef.current?.contentWindow?.postMessage(
        { type: "set-split-mode", enabled: splitMode },
        "*",
      );
    }, [splitMode]);

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
          onLoad={() => {
            iframeRef.current?.contentWindow?.postMessage(
              { type: "inspect-mode", enabled: inspectMode },
              "*",
            );
            iframeRef.current?.contentWindow?.postMessage(
              { type: "set-split-mode", enabled: splitMode },
              "*",
            );
          }}
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
