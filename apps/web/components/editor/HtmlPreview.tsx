"use client";

import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import { useTheme } from "@/components/ui/theme-provider";
import { getEditorScript } from "./editor-iframe";
import {
  buildHtml,
  dark,
  light,
  normalizeTemplateHtml,
} from "@/lib/data/templates";

/* Colors/dark/light/buildHtml live in lib/data/templates.ts (shared with the
   template library + document creation). */

/** Scrollbars of the preview document are HIDDEN entirely (the content
 *  remains scrollable via wheel/trackpad — only the native bars are gone).
 *  Both scrolling shells are covered: default/blank templates scroll on
 *  `.scroll-wrapper`, user-authored templates scroll on `<html>` (plus a
 *  horizontal bar from the fixed 794px A4 sheet). The injected chrome is
 *  stripped from saved/exported HTML via `[data-editor-reset]`. */
const PREVIEW_SCROLLBAR_STYLE = `<style data-editor-reset>
/* Hide ALL scrollbars in the preview document (scrolling still works). */
html,body,.scroll-wrapper{scrollbar-width:none !important;-ms-overflow-style:none !important;}
html::-webkit-scrollbar,body::-webkit-scrollbar,.scroll-wrapper::-webkit-scrollbar{display:none !important;width:0 !important;height:0 !important;}
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
  /** Stable per-session layer id assigned by the iframe editor
   *  (data-klone-id); missing for legacy selections. */
  id?: string;
  tag: string;
  classes: string;
  styles: Record<string, string>;
}

/** One row of the live document layer tree reported by the iframe editor
 *  (open-pencil/Figma-style). `type: "page"` marks a page frame root. */
export interface LayerNode {
  id: string;
  name: string;
  type:
    | "page"
    | "frame"
    | "rectangle"
    | "text"
    | "group"
    | "image"
    | "other";
  children?: LayerNode[];
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
  /** Delete the page at `pageIndex` (0-based; page 0 is the root, undeletable). */
  deletePage: (pageIndex: number) => void;
  /** Append a template component block at the bottom of the document. */
  addComponent: (key: string, html: string, css?: string) => void;
  /** Copy the current selection (elements/page) to the internal clipboard. */
  copy: () => void;
  /** Paste the clipboard as a NEW element after the selection (or body end). */
  paste: () => void;
  /** Select a layer by its tree id (Layers panel). `additive` toggles it
   *  within the current multi-selection. */
  selectLayer: (id: string, additive?: boolean) => void;
  /** Move a layer to a new position via the Layers panel (undoable).
   *  `position` is relative to the target row; "inner" nests the layer as
   *  the target's last child. */
  reorderLayer: (
    id: string,
    targetId: string,
    position: "before" | "after" | "inner",
  ) => void;
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
  onLayersTree?: (tree: LayerNode[], selectedIds: string[]) => void;
  /** Canvas zoom factor (1 = 100%). Applied as a scale transform around the
   *  preview's horizontal CENTER so the page can never pan sideways. */
  zoom?: number;
  /** Relay for Ctrl/⌘ + wheel (and trackpad pinch) gestures that happen
   *  inside the sandboxed iframe; called with a relative zoom factor the
   *  parent applies to `zoom`. */
  onZoomWheel?: (factor: number) => void;
  /** Relay for PLAIN wheel gestures that happen inside the iframe while the
   *  canvas is zoomed out. Wheel events never cross iframe boundaries, so
   *  the iframe forwards them here and the parent scrolls its own canvas
   *  container (the iframe's internal scroll is locked at zoom < 1).
   *  `deltaMode` follows the WheelEvent spec: 0 = pixels, 1 = lines. */
  onPanWheel?: (deltaX: number, deltaY: number, deltaMode: number) => void;
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
      onLayersTree,
      zoom = 1,
      onZoomWheel,
      onPanWheel,
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

    // ── Zoom-out REVEAL height ──
    // Zooming out must show the WHOLE document (not just one screenful).
    // The reveal works by growing this container's layout height to the
    // iframe document's full CONTENT height (reported by the editor
    // script as an intrinsic measurement, never the html/body
    // scrollHeight), scaling it down around the top center - so the page
    // keeps its fixed width and stays horizontally centered at every
    // zoom. The iframe's own box is locked to this value only while
    // zoom < 1, so the DEFAULT 100% view is never affected. Measuring
    // the content itself (not html/body scrollHeight) is essential:
    // the canvas ties the iframe box to the reveal value while zoom < 1,
    // and the shell CSS chains html/body/wrapper heights to that box,
    // so a scrollHeight read would feed the iframe's own height back
    // into the reveal and grow it forever.
    const [revealHeight, setRevealHeight] = useState<number | null>(null);

    // ── Fixed page WIDTH ──
    // User-authored templates render a FIXED-width A4 sheet
    // (.klone-render-space, width:794px). The iframe's layout box normally
    // equals the canvas width, so whenever the canvas is NARROWER than the
    // page (responsive screen widths, sidebars open in inspect mode) the
    // page overflows the iframe's own <html> (overflow-x:auto) and the
    // preview becomes horizontally scrollable — and zooming out then only
    // scales the visible left part instead of showing the full page.
    // Fix: never let the preview box be narrower than the page sheet. The
    // box gets `min-width: pageWidth` and stays horizontally centered via
    // translateX(-50%) + the existing scale-around-top-center transform, so
    // the iframe document is always as wide as the page (no internal
    // scrollbar) and the whole page fits when zoomed out.
    const [pageWidth, setPageWidth] = useState<number | null>(null);
    const updatePageWidth = useCallback(() => {
      const doc = iframeRef.current?.contentDocument;
      if (!doc) return;
      const wrap = doc.querySelector<HTMLElement>(".scroll-wrapper");
      // Only the fixed A4 sheet needs this; the default shell's width
      // follows the canvas and never overflows.
      if (!wrap || !wrap.classList.contains("klone-render-space")) {
        setPageWidth((prev) => (prev === null ? prev : null));
        return;
      }
      const w = Math.ceil(wrap.getBoundingClientRect().width);
      if (w > 0) setPageWidth((prev) => (prev === w ? prev : w));
    }, []);

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

    // ── Zoom-out REVEAL height tracking ──
    // Zooming out shows the WHOLE document (not just one screenful) by
    // growing the preview's layout height to the iframe document's full
    // scrollHeight and scaling it down around the top center. Three
    // sources keep that height current:
    //   1. `doc-height` posts from the editor script (layout changes),
    //   2. a periodic tick (page-break toggles, undo/redo and other
    //      internal reflows that never post),
    //   3. a ResizeObserver on the iframe (its height changes with the
    //      reveal, so scrollHeight is re-derived each time).
    // The height is only applied while zoom < 1; at 100% the reveal is
    // released (h-full) and the default view is untouched. Declared here
    // (before the message handler) because the handler wires in
    // `doc-height` posts.
    const zoomedOut = zoom < 1;
    const updateRevealHeight = useCallback(() => {
      if (!iframeRef.current) return;
      try {
        const doc = iframeRef.current.contentDocument;
        if (!doc || !doc.body) return;
        // Mirror the iframe's own measurement (editor script
        // `measureDocHeight`): use the CONTENT's intrinsic height, never
        // the html/body scrollHeight. The canvas locks the iframe box to
        // the reveal height while zoom < 1, and the shell CSS chains
        // html/body/wrapper heights back to that box — reading
        // scrollHeight would feed the iframe's own height back into the
        // reveal and grow it forever.
        const wrap = doc.querySelector<HTMLElement>(".scroll-wrapper");
        let h = 0;
        if (wrap) {
          if (wrap.classList.contains("klone-render-space")) {
            // User-authored sheet: overflow:visible, its own box (+ top
            // offset and bottom margin) is the whole document.
            const cs = doc.defaultView
              ? doc.defaultView.getComputedStyle(wrap)
              : null;
            const mb = cs ? parseFloat(cs.marginBottom) || 0 : 0;
            const view = doc.defaultView;
            const top =
              wrap.getBoundingClientRect().top + (view ? view.pageYOffset : 0);
            h = Math.ceil(top + wrap.offsetHeight + mb);
          } else {
            // Default shell: full content height inside the scroller.
            h = wrap.scrollHeight;
          }
        } else {
          h = Math.max(
            doc.documentElement.scrollHeight,
            doc.body ? doc.body.scrollHeight : 0,
          );
        }
        if (h > 0) setRevealHeight((prev) => (prev === h ? prev : h));
      } catch {
        // cross-origin guard (should never happen with srcDoc)
      }
    }, []);
    const reportRevealHeight = useCallback((height: number) => {
      if (height > 0) setRevealHeight((prev) => (prev === height ? prev : height));
    }, []);
    const releaseReveal = useCallback(() => setRevealHeight(null), []);

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
    const serializeCleanHtml = useCallback(
      async (forExport = false): Promise<string | null> => {
        const iframe = iframeRef.current;
        if (!iframe || !iframe.contentWindow) {
          console.error("[serialize] No iframe ref or contentWindow");
          return null;
        }

        // If a text edit is OPEN, the iframe hides the editing element
        // (visibility:hidden) until set-text/cancel-edit arrives - a
        // snapshot taken in that state would export/save the element with
        // its text missing. Commit the in-progress edit first so the file
        // always contains what the user typed.
        commitTextEdit();

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
        // Editor-injected chrome (e.g. the global pointer-events reset)
        // lives in <head> as a <style data-editor-reset> - never persist it.
        clone
          .querySelectorAll("[data-editor-reset]")
          .forEach((el) => el.remove());
        clone.querySelectorAll("script").forEach((el) => el.remove());
        clone
          .querySelectorAll("[data-editor-capture]")
          .forEach((el) => el.remove());

        // Layer-tree session ids are editor chrome (they map Layers-panel
        // rows to live nodes) - never persist them into saved/exported HTML.
        clone
          .querySelectorAll("[data-klone-id]")
          .forEach((el) => el.removeAttribute("data-klone-id"));

        // Strip editor chrome that lives as INLINE styles on content elements:
        // the hover/selection outlines (purple, set by editor-iframe). They are
        // never user-authored (the properties sidebar has no outline control),
        // so removing exactly those values never changes the design - but saves
        // a dashed purple box around the last hovered/selected element.
        clone.querySelectorAll("[style]").forEach((el) => {
          const s = (el as HTMLElement).style;
          const o = s.outline || "";
          if (o.indexOf("8b5cf6") !== -1 || o.indexOf("139, 92, 246") !== -1) {
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

        // For user templates the authored page background lives on the
        // .klone-render-space element (their `body{}` rules were remapped onto
        // that class). Restore it there as well so the exported/saved page
        // keeps its own colour, never the editor canvas colour.
        const renderSpaceEl = clone.querySelector(
          ".klone-render-space",
        ) as HTMLElement | null;

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

        if (renderSpaceEl) {
          // The render space carries the user template's page-level
          // background; restore the authored one if present.
          renderSpaceEl.style.backgroundColor = authoredBodyBg || "";
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
            // Only remove scroll-clipping when the .scroll-wrapper actually
            // carries the OLD editor-generated clipping (height:100% /
            // overflow-y:auto). For USER templates the .scroll-wrapper IS the
            // page box (min-height:1123px; padding:94px; margin:40px auto) —
            // stripping its height/max-height would destroy the A4 page, so we
            // leave those authored values intact and only neutralise an
            // explicit overflow:auto if present.
            const cs = getComputedStyle(scrollEl);
            if (cs.height === "100%" || scrollEl.style.height === "100%") {
              scrollEl.style.height = "auto";
            }
            if (
              cs.overflowY === "auto" ||
              cs.overflowY === "hidden" ||
              scrollEl.style.overflowY === "auto"
            ) {
              scrollEl.style.overflow = "visible";
              scrollEl.style.overflowY = "visible";
            }
            scrollEl.style.maxHeight = "none";
          }

          // --- Page-canvas cleanup ---
          // The document's own <html> rule often carries the app-shell
          // background (#161617 in the default templates). In print,
          // Chromium paints the ROOT element's background across the
          // ENTIRE page canvas — so every area the body box does not
          // cover (sheet margins, page-break gaps) shows that dark shell
          // colour as ugly strips. Making <html> transparent lets the
          // body background propagate to the canvas, so every PDF page
          // is uniformly the document's own colour.
          if (htmlEl) htmlEl.style.background = "transparent";
          // Authored body margins (rare, but templates differ) leak the
          // canvas colour and can spill content onto an extra sheet —
          // for export the page box starts flush at the top.
          if (bodyEl) bodyEl.style.margin = "0";

          // User-template sheets (.klone-render-space) sit on the app
          // canvas with a 40px margin + drop shadow. Both are editor
          // chrome, not content: the margins push content down and can
          // spill an almost-empty second page, and the shadow gets
          // clipped at the page edges. Zero them for export so the PDF
          // page IS the sheet.
          if (scrollEl?.classList.contains("klone-render-space")) {
            scrollEl.style.margin = "0";
            scrollEl.style.boxShadow = "none";
          }

          // --- Chunk optimization ---
          // Keep top-level content blocks intact across page breaks: a
          // long document splits BETWEEN cards/sections, never through
          // one, so each PDF page carries clean chunks that are easy to
          // scroll through in a viewer. Blocks taller than a full page
          // still get split (Chromium ignores break-inside when the
          // block cannot fit on one page), so no content is ever lost.
          const chunkRoot =
            (scrollEl?.querySelector(
              ":scope > .document-container",
            ) as HTMLElement | null) ??
            scrollEl ??
            bodyEl;
          if (chunkRoot) {
            // Top-level blocks of every page region: the page boundaries
            // themselves will become page breaks below, so they must stay
            // breakable inside (their own children get chunked instead).
            const avoidChunk = (el: HTMLElement) => {
              el.style.breakInside = "avoid";
              el.style.pageBreakInside = "avoid";
            };
            Array.from(chunkRoot.children).forEach((child) => {
              const el = child as HTMLElement;
              if (el.hasAttribute("data-editor-ui")) return;
              if (el.hasAttribute("data-klone-page-boundary")) {
                Array.from(el.children).forEach((gc) =>
                  avoidChunk(gc as HTMLElement),
                );
                return;
              }
              avoidChunk(el);
            });
            // Widow/orphan control: never end a page on 1-2 stranded
            // lines of a paragraph (keeps per-page chunks readable).
            chunkRoot.style.orphans = "3";
            chunkRoot.style.widows = "3";
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
      },
      [commitTextEdit],
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
      deletePage: (pageIndex: number) => {
        iframeRef.current?.contentWindow?.postMessage(
          { type: "delete-page", pageIndex },
          "*",
        );
      },
      addComponent: (key: string, html: string, css?: string) => {
        iframeRef.current?.contentWindow?.postMessage(
          { type: "add-component", key, html, css },
          "*",
        );
      },
      copy: () => {
        iframeRef.current?.contentWindow?.postMessage({ type: "copy" }, "*");
      },
      paste: () => {
        iframeRef.current?.contentWindow?.postMessage({ type: "paste" }, "*");
      },
      selectLayer: (id: string, additive?: boolean) => {
        iframeRef.current?.contentWindow?.postMessage(
          { type: "select-layer", id, additive: Boolean(additive) },
          "*",
        );
      },
      reorderLayer: (id, targetId, position) => {
        iframeRef.current?.contentWindow?.postMessage(
          {
            type: "reorder-layer",
            id,
            targetId,
            position: position === "inner" ? "last-child" : position,
          },
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
        if (e.data && e.data.type === "layers-tree") {
          onLayersTree?.(
            Array.isArray(e.data.tree) ? e.data.tree : [],
            Array.isArray(e.data.selectedIds) ? e.data.selectedIds : [],
          );
        }
        if (e.data && e.data.type === "doc-height") {
          reportRevealHeight(Number(e.data.height) || 0);
        }
        if (e.data && e.data.type === "zoom-wheel") {
          // Ctrl/⌘ + wheel (incl. trackpad pinch) can only be observed
          // inside the iframe - it relays the gesture here. The zoom state
          // lives in the parent so the preview (and the text-edit overlay
          // inside this same scaled container) scales as one.
          const dy = Number(e.data.deltaY) || 0;
          if (dy !== 0) onZoomWheel?.(Math.exp(-dy * 0.002));
        }
        if (e.data && e.data.type === "pan-wheel") {
          // Plain wheel over the page while zoomed out (see the wheel
          // listener inside the iframe). The parent owns the vertical pan
          // and scrolls the canvas container itself.
          const dx = Number(e.data.deltaX) || 0;
          const dy = Number(e.data.deltaY) || 0;
          const mode = Number(e.data.deltaMode) || 0;
          if (dx !== 0 || dy !== 0) onPanWheel?.(dx, dy, mode);
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
      onLayersTree,
      onZoomWheel,
      onPanWheel,
      reportRevealHeight,
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

    // WYSIWYG sizing: the edit box starts at the element's exact size
    // (locked width, min-height = element height). As the user types, it
    // grows downward to fit the draft instead of clipping it, matching
    // what the document will show after commit. Re-measure on every draft
    // change so the overlay never renders smaller or wider than the text.
    useLayoutEffect(() => {
      if (!editState) return;
      const ta = textareaRef.current;
      if (!ta) return;
      ta.style.height = "auto";
      const min = editState.rect.height;
      const next = Math.max(min, ta.scrollHeight);
      ta.style.height = `${next}px`;
    }, [draft, editState]);

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

    // Keep the iframe's zoom-out flag in sync: while zoomed out the iframe
    // locks its own scroll and relays plain wheel pans to the parent.
    useEffect(() => {
      iframeRef.current?.contentWindow?.postMessage(
        { type: "set-zoom", zoom },
        "*",
      );
    }, [zoom]);

    // ── Reveal height tracking ──
    // Keep the preview container sized to the document's FULL height while
    // zoomed out. Three sources drive it:
    //   1. `doc-height` posts from the editor script (layout changes),
    //   2. a periodic tick (page-break toggles, undo/redo and other
    //      internal reflows that never post),
    //   3. a ResizeObserver on the iframe (defensive re-read while the
    //      box moves).
    // All reads are intrinsic-content measurements (see
    // `updateRevealHeight`), so the reveal value never depends on the
    // iframe's own height - the tracking loop is a NO-OP once settled
    // instead of a growth loop.
    // Keep the reveal height current while zoomed out (see the tracking
    // block above); release it as soon as the zoom returns to 100%.
    useLayoutEffect(() => {
      if (!zoomedOut) {
        releaseReveal();
        return;
      }
      updateRevealHeight();
      const id = window.setInterval(updateRevealHeight, 300);
      return () => window.clearInterval(id);
    }, [zoomedOut, updateRevealHeight, releaseReveal]);

    useEffect(() => {
      if (!zoomedOut || typeof ResizeObserver === "undefined") return;
      const iframe = iframeRef.current;
      if (!iframe) return;
      const obs = new ResizeObserver(updateRevealHeight);
      obs.observe(iframe);
      return () => obs.disconnect();
    }, [zoomedOut, updateRevealHeight]);

    // ── Page-width tracking (every zoom level) ──
    // The preview box must never be narrower than the fixed A4 sheet,
    // otherwise the iframe document grows its own horizontal scrollbar.
    // Measure once at mount, then keep it current on window resizes and on
    // document switches (the iframe's box tracks the reveal value, so a
    // ResizeObserver also covers the zoomed-out reflow).
    useLayoutEffect(() => {
      updatePageWidth();
      const id = window.setInterval(updatePageWidth, 300);
      window.addEventListener("resize", updatePageWidth);
      return () => {
        window.clearInterval(id);
        window.removeEventListener("resize", updatePageWidth);
      };
    }, [updatePageWidth]);

    const srcDoc = html
      ? injectEditorScript(normalizeTemplateHtml(html))
      : defaultHtml;
    const bg = editState?.styles.backgroundColor ?? "";
    const hasBg = bg && bg !== "transparent" && bg !== "rgba(0, 0, 0, 0)";

    return (
      <div
        // ZOOM-OUT REVEAL (zoom < 1): the whole document becomes visible
        // while the page keeps its fixed width and stays horizontally
        // centered. Geometry:
        //   outer div  → layout height = the SCALED height (h*zoom), so the
        //                canvas scrolls exactly as much as the visual size
        //                requires (overflow:hidden keeps the oversized
        //                child out of the scrollable area),
        //   inner div  → layout height = the document's FULL height h,
        //                scaled down around the top center; the width is
        //                untouched (scale shrinks it visually around the
        //                center line, so the page can never drift sideways).
        // At zoom >= 1 (the DEFAULT view) no style is applied at all — the
        // wrapper renders exactly like the original 100% layout.
        className={
          zoom < 1 && revealHeight ? "relative w-full" : "relative w-full h-full"
        }
        style={
          zoom < 1 && revealHeight
            ? { height: revealHeight * zoom, overflow: "hidden" }
            : undefined
        }
      >
        <div
          className="relative w-full"
          style={(() => {
            const base: React.CSSProperties =
              zoom < 1 && revealHeight
                ? { height: revealHeight }
                : { width: "100%", height: "100%" };
            if (pageWidth) {
              // Never let the preview box be narrower than the FIXED page
              // sheet (see `pageWidth` above), at ANY zoom: the iframe
              // document then always fits the whole page, so the preview is
              // never horizontally scrollable — zooming out reveals the full
              // width, and at 100% on a narrow canvas the page is simply
              // cropped at the canvas edges (overflow-x-hidden container).
              // `left:50%` + `translateX(-50%)` keep the (possibly oversized)
              // box horizontally centered; when the canvas is wider than the
              // page the box equals 100% and the pair is a no-op.
              base.minWidth = pageWidth;
              base.left = "50%";
              base.transform = `translateX(-50%) scale(${zoom})`;
              base.transformOrigin = "top center";
              base.willChange = "transform";
            } else if (zoom < 1) {
              base.transform = `scale(${zoom})`;
              base.transformOrigin = "top center";
              base.willChange = "transform";
            }
            return base;
          })()}
        >
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
              // Re-sync zoom state after any iframe reload (HMR hard
              // refresh, doc switch) so the relay logic stays armed.
              iframeRef.current?.contentWindow?.postMessage(
                { type: "set-zoom", zoom },
                "*",
              );
              // Re-measure the page width on reload (doc switch) so the
              // zoomed-out box matches the new document immediately.
              updatePageWidth();
            }}
          />
          {editState && (
          <div
            className="absolute z-10"
            style={{
              left: editState.rect.left,
              top: editState.rect.top,
              width: editState.rect.width,
              minHeight: editState.rect.height,
            }}
          >
            <textarea
              ref={textareaRef}
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={handleEditKeyDown}
              onBlur={commitTextEdit}
              spellCheck={false}
              className="w-full resize-none outline-none rounded-none border-0 shadow-none"
              style={{
                boxSizing: "border-box",
                display: "block",
                fontFamily: editState.styles.fontFamily,
                fontSize: editState.styles.fontSize,
                fontWeight: editState.styles.fontWeight,
                fontStyle: editState.styles.fontStyle,
                lineHeight: editState.styles.lineHeight,
                letterSpacing: editState.styles.letterSpacing,
                wordSpacing: editState.styles.wordSpacing,
                textTransform: editState.styles
                  .textTransform as React.CSSProperties["textTransform"],
                textIndent: editState.styles.textIndent,
                // Match the element's authored white-space rule so the text
                // wraps EXACTLY like the document (normal collapses source
                // whitespace; pre/pre-wrap keeps line breaks visible).
                whiteSpace: editState.styles.whiteSpace as React.CSSProperties["whiteSpace"],
                color: editState.styles.color,
                textAlign: editState.styles
                  .textAlign as React.CSSProperties["textAlign"],
                paddingTop: editState.styles.paddingTop,
                paddingRight: editState.styles.paddingRight,
                paddingBottom: editState.styles.paddingBottom,
                paddingLeft: editState.styles.paddingLeft,
                borderTopWidth: editState.styles.borderTopWidth,
                borderRightWidth: editState.styles.borderRightWidth,
                borderBottomWidth: editState.styles.borderBottomWidth,
                borderLeftWidth: editState.styles.borderLeftWidth,
                borderTopStyle: editState.styles
                  .borderTopStyle as React.CSSProperties["borderTopStyle"],
                borderRightStyle: editState.styles
                  .borderRightStyle as React.CSSProperties["borderRightStyle"],
                borderBottomStyle: editState.styles
                  .borderBottomStyle as React.CSSProperties["borderBottomStyle"],
                borderLeftStyle: editState.styles
                  .borderLeftStyle as React.CSSProperties["borderLeftStyle"],
                borderTopColor: editState.styles.borderTopColor,
                borderRightColor: editState.styles.borderRightColor,
                borderBottomColor: editState.styles.borderBottomColor,
                borderLeftColor: editState.styles.borderLeftColor,
                backgroundColor: hasBg ? bg : "transparent",
                overflow: "hidden",
              }}
            />
            </div>
          )}
        </div>
      </div>
    );
  },
);
