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
import { buildHtml, dark, light } from "@/lib/data/templates";

/* Colors/dark/light/buildHtml live in lib/data/templates.ts (shared with the
   template library + document creation). */

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
  getFullHtml: () => Promise<string | null>;
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

    // Serialize the current iframe document into clean, PDF-ready HTML by
    // cloning the live DOM (inline styles preserved) and stripping editor
    // overlays/scripts/clipping. Shared by exportPdf and getFullHtml.
    const serializeCleanHtml = useCallback(async (): Promise<string | null> => {
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
          const fullHtml = await serializeCleanHtml();
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
