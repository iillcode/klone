"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  HtmlPreview,
  type HtmlPreviewHandle,
  type ElementInfo,
  type LayerNode,
} from "./HtmlPreview";
import { FigmaBottomToolbar } from "./FigmaBottomToolbar";

import { Sidebar } from "@/components/layout/Sidebar";
import type { UserProfile } from "@/lib/data/users";
import { PropertiesSidebar, PANEL_SECTIONS, type PanelSectionId } from "./PropertiesSidebar";
import { BottomComponentDock } from "./BottomComponentDock";
import type { ComponentGroup } from "@/lib/data/types";
import type { TemplateRow } from "@/lib/data/template-db-types";
import {
  saveDocumentContent,
  createDocumentFromHtml,
} from "@/app/actions/documents";
import type { Document } from "@/lib/types";

interface PreviewEditorProps {
  initialDocument?: Document | null;
  initialTemplateSlug?: string | null;
  /** Initial HTML for a template draft (the template's preview_html). */
  initialHtml?: string | null;
  documents?: Document[];
  templates?: TemplateRow[];
  profile?: UserProfile | null;
  /** Grouped template components loaded from the database. */
  componentGroups?: ComponentGroup[];
}

export function PreviewEditor({
  initialDocument = null,
  initialTemplateSlug = null,
  initialHtml = null,
  documents = [],
  templates = [],
  profile = null,
  componentGroups = [],
}: PreviewEditorProps) {
  const router = useRouter();

  // Document search state for the dashboard-style sidebar.
  const [query, setQuery] = useState("");

  // ── Dynamic document state ──
  // `docId` is null for a template draft (direct /preview/{slug} visit);
  // clicking Save persists it as a new document.
  const [docId, setDocId] = useState<string | null>(
    initialDocument?.id ?? null,
  );
  // Title is fixed per loaded document (no inline rename in this scope).
  const [docTitle] = useState<string>(initialDocument?.title ?? "Untitled");
  // HTML source is fixed per load; edits live inside the iframe and are
  // captured on Save via getFullHtml().
  const [html] = useState<string | null>(
    initialDocument?.html_code ?? initialHtml ?? null,
  );
  const [dirty, setDirty] = useState(false);
  const [saving, setSaving] = useState(false);

  // ── Editor state (unchanged) ──
  const [selectedElements, setSelectedElements] = useState<ElementInfo[]>([]);
  const [inspectMode, setInspectMode] = useState(false);
  const [leftSidebarOpen, setLeftSidebarOpen] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [splitMode, setSplitMode] = useState(false);
  const [pageBreakCount, setPageBreakCount] = useState(
    () => (html ?? "").match(/data-klone-page-break/g)?.length ?? 0,
  );
  // Multi-page state: pageCount comes from persisted boundaries (or the
  // single default page); currentPage tracks the selection's page.
  const [pageCount, setPageCount] = useState(
    () => ((html ?? "").match(/data-klone-page-boundary/g)?.length ?? 0) + 1,
  );
  const [currentPage, setCurrentPage] = useState(0);
  // ── Canvas zoom ──
  // The preview is scaled around its HORIZONTAL CENTER (transform-origin
  // "top center" in HtmlPreview), so the page can NEVER drift or pan
  // sideways - zoom only changes how big the vertically scrolling document
  // appears. Layout size is unchanged, so no horizontal scrollbars can
  // ever appear.
  const [zoom, setZoom] = useState(1);
  // 100% is the MAXIMUM zoom: the document is authored at its native size
  // and zooming in past that only enlarges pixels without adding detail.
  // Every zoom path (buttons, Ctrl/⌘ + / - / 0, wheel zoom) funnels through
  // clampZoom, so this single bound covers the whole canvas.
  const clampZoom = useCallback(
    (z: number) => Math.min(1, Math.max(0.25, Math.round(z * 100) / 100)),
    [],
  );
  const zoomBy = useCallback(
    (factor: number) => setZoom((z) => clampZoom(z * factor)),
    [clampZoom],
  );
  const zoomTo = useCallback((z: number) => setZoom(clampZoom(z)), [clampZoom]);
  // Live layer tree reported by the iframe editor (Layers sidebar tab).
  // Selection badges are derived from selectedElements instead of the
  // iframe's reported ids so they update instantly with canvas clicks.
  const [layersTree, setLayersTree] = useState<LayerNode[]>([]);
  // isEditingRef is the source of truth for edit-mode gating; the state
  // setter is kept to mirror it into the component (the value itself is
  // never read in render).
  const [, setIsEditing] = useState(false);
  const previewRef = useRef<HtmlPreviewHandle>(null);
  const keyboardCaptureRef = useRef<HTMLInputElement>(null);
  // Canvas scroll container. When the zoom is below 100% the parent owns
  // vertical panning; plain wheel events that land inside the sandboxed
  // iframe are relayed back here ('pan-wheel') and applied to this box.
  const canvasScrollRef = useRef<HTMLDivElement>(null);
  const handlePanWheel = useCallback(
    (deltaX: number, deltaY: number, deltaMode: number) => {
      const el = canvasScrollRef.current;
      if (!el) return;
      // WheelEvent deltaMode: 0 = pixels, 1 = lines, 2 = pages.
      const factor =
        deltaMode === 1 ? 16 : deltaMode === 2 ? el.clientHeight : 1;
      let dy = deltaY * factor;
      const dx = deltaX * factor;
      // Two-finger trackpad sideways pans can arrive as deltaX; the canvas
      // never scrolls horizontally so convert it to vertical pan instead of
      // dropping the gesture.
      if (dx !== 0 && deltaY === 0) dy = dx;
      if (dy === 0) return;
      el.scrollBy({ top: dy, behavior: "auto" });
    },
    [],
  );
  // Ref mirror of isEditing so the message handler (which fires outside
  // render) and the keydown listener always see the latest value.
  const isEditingRef = useRef(false);

  // Left sidebar is open either by hamburger toggle OR by inspect mode
  const leftOpen = leftSidebarOpen || inspectMode;
  const rightOpen = inspectMode;

  // ── Section quick-nav (canvas rail → properties panel) ──
  // The canvas rail lives on the right edge of the canvas (editor-style
  // overlay); clicking an icon asks the properties panel to scroll to the
  // matching Design section and flash a 2s highlight. `token` changes on
  // every click so repeating the same section retriggers the effect.
  const [navRequest, setNavRequest] = useState<{
    section: PanelSectionId;
    token: number;
  } | null>(null);
  const navToSection = (section: PanelSectionId) => {
    if (!inspectMode) setInspectMode(true); // the panel must be open
    setNavRequest({ section, token: Date.now() });
  };

  // Only process element selection when inspect mode is active
  const handleElementSelect = useCallback(
    (elements: ElementInfo[] | null) => {
      if (!inspectMode) {
        // Deselect when not in inspect mode
        if (elements && elements.length > 0) {
          previewRef.current?.deselect();
        }
        return;
      }
      setSelectedElements(elements ?? []);
      // While editing text in the iframe, NEVER touch focus - moving it to
      // the capture input would make the contenteditable lose focus and
      // abort the edit.
      if (isEditingRef.current) return;
      if (elements && elements.length > 0) {
        // preventScroll: at zoom < 100% the canvas container is scrollable
        // and this hidden input is anchored at its top — a bare focus()
        // would auto-scroll the container back to the top, snapping the
        // viewport away from the element the user just clicked.
        keyboardCaptureRef.current?.focus({ preventScroll: true });
      } else {
        keyboardCaptureRef.current?.blur();
      }
    },
    [inspectMode],
  );

  const handleEditModeChange = useCallback((editing: boolean) => {
    isEditingRef.current = editing;
    setIsEditing(editing);
  }, []);

  // Expand shorthand properties (padding, margin, borders) into the
  // sub-properties the property sections actually read. IMPORTANT: this must
  // be a PURE function of (property, value, currentStyles) — callers run from
  // zero-dependency useCallbacks, so reading stale component state here would
  // silently apply outdated expansions.
  const BORDER_SIDES = ["Top", "Right", "Bottom", "Left"] as const;
  function expandStyleProps(
    property: string,
    value: string,
    styles: Record<string, string>,
  ): Record<string, string> {
    if (property === "padding") {
      return {
        padding: value,
        paddingTop: value,
        paddingRight: value,
        paddingBottom: value,
        paddingLeft: value,
      };
    }
    if (property === "margin") {
      return {
        margin: value,
        marginTop: value,
        marginRight: value,
        marginBottom: value,
        marginLeft: value,
      };
    }
    if (property === "backgroundColor") {
      // Mirror the iframe: a solid background color replaces any gradient/
      // image (backgroundImage) so the sidebar stays in sync immediately.
      return { backgroundColor: value, backgroundImage: "none" };
    }
    // ---- Borders ----
    // The StrokeSection derives color / style / weight from the PER-SIDE
    // values (borderTopWidth…, borderTopColor…), so every border-related write
    // must be decomposed into per-side properties. Without that the section
    // keeps showing stale per-side values and only refreshes on the next
    // selection — the "changes appear only after leaving the panel" bug.
  //
  // Values flow two ways: user clicks send single values ('1px', 'solid',
  // '#ff0000'); the iframe round-trip sends COMPUTED styles, which serialize
  // as CSS shorthand when sides differ ("none none solid", "2px 0px").
  // splitShorthand() expands both shapes to exactly four sides. (Colors may
  // contain parens/spaces — "rgb(37, 99, 235)" — so split only on
  // whitespace that is NOT inside parentheses.)
  function splitShorthand(value: string): [string, string, string, string] {
    const parts = value.trim().split(/\s+(?![^(]*\))/);
    if (parts.length === 1) return [parts[0], parts[0], parts[0], parts[0]];
    if (parts.length === 2) return [parts[0], parts[1], parts[0], parts[1]];
    if (parts.length === 3) return [parts[0], parts[1], parts[2], parts[1]];
    return [parts[0], parts[1], parts[2], parts[3]];
  }
  const isNoneStyle = (v: string | undefined) =>
    !v || v === "none" || v === "hidden" || v.includes("none");

  if (
    property === "borderWidth" ||
    property === "borderColor" ||
    property === "borderStyle"
  ) {
    const suffix = property.slice(6); // "Width" | "Color" | "Style"
    const [t, r, b, l] = splitShorthand(value);
    const vals = [t, r, b, l];
    const updates: Record<string, string> = { [property]: value };
    BORDER_SIDES.forEach((side, i) => {
      updates[`border${side}${suffix}`] = vals[i];
    });
    // Mirror the iframe: a non-zero border width is INVISIBLE while its
    // side's style is still 'none'/'hidden' (the CSS initial), so when the
    // element currently has NO visible styles at all, force every side
    // solid (exactly like the iframe's uniform-borderWidth special case;
    // elements that already have a genuine partial stroke are untouched).
    if (property === "borderWidth") {
      const anyPositive = vals.some((v) => parseFloat(v) > 0);
      if (anyPositive) {
        const allNone = BORDER_SIDES.every((side) => {
          const cs = styles[`border${side}Style`] ?? styles.borderStyle;
          return isNoneStyle(cs);
        });
        if (allNone) {
          updates.borderStyle = "solid";
          for (const side of BORDER_SIDES) {
            updates[`border${side}Style`] = "solid";
          }
        }
      }
    }
    return updates;
  }
  // Per-side width (T/R/B/L fields in the panel): set just that side and,
  // mirroring the iframe, force that side solid when it's currently none.
  const perSideMatch = property.match(/^border(Top|Right|Bottom|Left)Width$/);
  if (perSideMatch) {
    const side = perSideMatch[1];
    const updates: Record<string, string> = { [property]: value };
    if (parseFloat(value) > 0) {
      const cs = styles[`border${side}Style`];
      if (isNoneStyle(cs)) updates[`border${side}Style`] = "solid";
    }
    return updates;
  }
  return { [property]: value };
}

  // Any canvas mutation (apply-style, text edit, undo, redo) marks the doc
  // as unsaved so the user knows to hit Save. Updates are computed from the
  // latest element styles (inside the functional setState) so they reflect
  // the real current stroke/border state, not a stale closure.
  const handleStyleUpdated = useCallback(
    (property: string, value: string) => {
      setDirty(true);
      setSelectedElements((prev) =>
        prev.map((el) => ({
          ...el,
          styles: {
            ...el.styles,
            ...expandStyleProps(property, value, el.styles),
          },
        })),
      );
    },
    [],
  );

  const handleApplyStyle = useCallback(
    (property: string, value: string) => {
      previewRef.current?.applyStyleMulti(property, value);
      setSelectedElements((prev) =>
        prev.map((el) => ({
          ...el,
          styles: {
            ...el.styles,
            ...expandStyleProps(property, value, el.styles),
          },
        })),
      );
    },
    [],
  );

  const handleDelete = useCallback(() => {
    previewRef.current?.deleteMulti();
  }, []);

  const handleUndo = useCallback(() => {
    previewRef.current?.undo();
  }, []);

  const handleRedo = useCallback(() => {
    previewRef.current?.redo();
  }, []);

  const handleToggleSplitMode = useCallback(() => {
    setInspectMode(true);
    setSplitMode((enabled) => !enabled);
  }, []);

  const handleClearPageBreak = useCallback(() => {
    previewRef.current?.clearPageBreak();
  }, []);

  const handlePageBreakChange = useCallback(
    (hasBreak: boolean, changed: boolean, count?: number) => {
      setPageBreakCount(count ?? (hasBreak ? 1 : 0));
      if (changed) setDirty(true);
    },
    [],
  );

  const handlePagesChange = useCallback((count: number, changed: boolean) => {
    setPageCount(Math.max(1, count));
    if (changed) setDirty(true);
  }, []);

  const handleLayersTree = useCallback((tree: LayerNode[]) => {
    setLayersTree(tree);
  }, []);

  const handleSelectLayer = useCallback((id: string, additive: boolean) => {
    setInspectMode(true);
    previewRef.current?.selectLayer(id, additive);
  }, []);

  const handleReorderLayer = useCallback(
    (id: string, targetId: string, position: "before" | "after" | "inner") => {
      previewRef.current?.reorderLayer(id, targetId, position);
      setDirty(true);
    },
    [],
  );

  const handlePageInfo = useCallback(
    (info: { page: number; pageCount: number }) => {
      setCurrentPage(info.page);
      setPageCount(Math.max(1, info.pageCount));
    },
    [],
  );

  const handleDeletePage = useCallback((pageIndex: number) => {
    previewRef.current?.deletePage(pageIndex);
  }, []);

  const handleShare = useCallback(async () => {
    setDownloading(true);
    try {
      await previewRef.current?.exportPdf();
    } finally {
      // Keep spinner for a minimum time so it doesn't flash
      await new Promise((r) => setTimeout(r, 1000));
      setDownloading(false);
    }
  }, []);

  const handleSave = useCallback(async () => {
    if (saving) return;
    setSaving(true);
    try {
      const fullHtml = await previewRef.current?.getFullHtml();
      if (!fullHtml) return;

      if (docId) {
        const result = await saveDocumentContent(docId, fullHtml);
        if ("error" in result) {
          console.error("[PreviewEditor] save failed:", result.error);
          return;
        }
        setDirty(false);
      } else {
        // Draft (direct template-slug visit): persist as a new document and
        // move the URL to the real document id. Carry the template slug so
        // the new row is linked to its source template (template_id), which
        // the component dock relies on to list that template's blocks.
        const result = await createDocumentFromHtml(
          docTitle,
          fullHtml,
          initialTemplateSlug,
        );
        if ("error" in result) {
          console.error("[PreviewEditor] save failed:", result.error);
          return;
        }
        setDocId(result.id);
        setDirty(false);
        router.replace(`/preview/${result.id}`);
      }
    } finally {
      setSaving(false);
    }
  }, [saving, docId, docTitle, router, initialTemplateSlug]);

  // Best-effort guard against losing unsaved work on tab close/refresh.
  useEffect(() => {
    if (!dirty) return;
    const handler = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = "";
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [dirty]);

  // Inject a template component block at the bottom of the document.
  const handleAddComponent = useCallback(
    (component: { key: string; html: string; css: string }) => {
      previewRef.current?.addComponent(
        component.key,
        component.html,
        component.css,
      );
      setDirty(true);
    },
    [],
  );

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      // While editing text inside the iframe, let the iframe own all keys.
      if (isEditingRef.current) return;

      // Escape: deselect all elements
      if (e.key === "Escape") {
        if (splitMode) {
          setSplitMode(false);
          return;
        }
        previewRef.current?.deselect();
        setSelectedElements([]);
        return;
      }

      // Undo: Cmd+Z / Ctrl+Z
      if ((e.metaKey || e.ctrlKey) && e.key === "z" && !e.shiftKey) {
        e.preventDefault();
        previewRef.current?.undo();
        return;
      }

      // Redo: Cmd+Shift+Z / Ctrl+Shift+Z
      if ((e.metaKey || e.ctrlKey) && e.key === "z" && e.shiftKey) {
        e.preventDefault();
        previewRef.current?.redo();
        return;
      }

      // Zoom: Ctrl/Cmd + '+'/'-' to zoom in/out, Ctrl/Cmd + '0' resets to
      // 100%. Wheel zoom (Ctrl/⌘+scroll) is relayed from the iframe itself.
      if (e.metaKey || e.ctrlKey) {
        if (e.key === "=" || e.key === "+") {
          e.preventDefault();
          zoomBy(1.2);
          return;
        }
        if (e.key === "-" || e.key === "_") {
          e.preventDefault();
          zoomBy(1 / 1.2);
          return;
        }
        if (e.key === "0") {
          e.preventDefault();
          zoomTo(1);
          return;
        }
      }

      // V key: toggle inspect mode (only when not focused on an input)
      const el = document.activeElement;
      const isInput =
        el?.tagName === "INPUT" ||
        el?.tagName === "TEXTAREA" ||
        el?.tagName === "SELECT";
      const isEditorCapture =
        el?.getAttribute("data-editor-capture") === "true";

      // Copy / Paste as a NEW element: Ctrl+C then Ctrl+V.
      // Works while a block is selected (focus is on the hidden editor-capture
      // input). Disabled when the user is typing in a real form field.
      if (!isInput || isEditorCapture) {
        if ((e.metaKey || e.ctrlKey) && (e.key === "c" || e.key === "C")) {
          e.preventDefault();
          previewRef.current?.copy();
          return;
        }
        if ((e.metaKey || e.ctrlKey) && (e.key === "v" || e.key === "V")) {
          e.preventDefault();
          previewRef.current?.paste();
          return;
        }
      }

      if (!isInput && !e.metaKey && !e.ctrlKey && !e.altKey) {
        if (e.key.toLowerCase() === "v") {
          setInspectMode((prev) => {
            const next = !prev;
            // When turning inspect OFF, also close left sidebar if it was opened by hamburger
            if (!next) setLeftSidebarOpen(false);
            return next;
          });
          setSelectedElements([]);
          previewRef.current?.deselect();
          return;
        }
      }

      // Arrow keys: nudge selected elements (Shift = 10px, default 1px)
      if (
        inspectMode &&
        selectedElements.length > 0 &&
        (!isInput || isEditorCapture) &&
        !e.metaKey &&
        !e.ctrlKey &&
        !e.altKey
      ) {
        const step = e.shiftKey ? 10 : 1;
        if (
          e.key === "ArrowUp" ||
          e.key === "ArrowDown" ||
          e.key === "ArrowLeft" ||
          e.key === "ArrowRight"
        ) {
          e.preventDefault();
          const dx =
            e.key === "ArrowLeft" ? -step : e.key === "ArrowRight" ? step : 0;
          const dy =
            e.key === "ArrowUp" ? -step : e.key === "ArrowDown" ? step : 0;
          previewRef.current?.moveBy(dx, dy);
          return;
        }
      }

      // Delete/Backspace: delete selected elements only when NOT focused
      // on a real form input. The hidden editor-capture input is treated
      // as part of the editor (not a real form input).
      if (e.key === "Delete" || e.key === "Backspace") {
        if (!isInput || isEditorCapture) {
          e.preventDefault();
          previewRef.current?.deleteMulti();
        }
      }
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [inspectMode, selectedElements.length, splitMode, zoomBy, zoomTo]);

  return (
    <div className="flex flex-col w-full h-full bg-[#161617]">
      {/* ── Full-width top bar ── */}
      <FigmaBottomToolbar
        title={docTitle}
        leftSidebarOpen={leftOpen}
        inspectMode={inspectMode}
        dirty={dirty}
        onToggleLeftSidebar={() => setLeftSidebarOpen((p) => !p)}
        onToggleInspect={() => {
          setInspectMode((prev) => {
            const next = !prev;
            if (!next) {
              setLeftSidebarOpen(false);
              setSelectedElements([]);
              setSplitMode(false);
              previewRef.current?.deselect();
            }
            return next;
          });
        }}
        onSave={handleSave}
        saving={saving}
        onShare={handleShare}
        downloading={downloading}
      />

      {/* ── Content area: sidebars + canvas ── */}
      <div className="flex-1 flex flex-row min-h-0">
        {/* ── Left sidebar: dashboard shell (search, nav, templates, account) ── */}
        <div
          className="overflow-hidden transition-[width] duration-200 ease-out"
          style={{ width: leftOpen ? 240 : 0 }}
        >
          <div className="w-60 h-full border-r border-[#2d2d2d]">
            <Sidebar
              documents={documents}
              templates={templates}
              query={query}
              onQueryChange={setQuery}
              profile={profile}
            />
          </div>
        </div>

        {/* ── Center: Canvas ── */}
        <div className="flex-1 h-full relative overflow-hidden">
          {/* Preview iframe area — vertical scrolling only; the page stays
              horizontally centered when zoomed (see HtmlPreview's
              transform-origin), so the canvas can never pan sideways.
              The vertical scrollbar is hidden (wheel/trackpad still scroll;
              `scrollbar-none` utility in app/globals.css). */}
          <div
            ref={canvasScrollRef}
            className="absolute inset-0 flex items-start justify-center overflow-x-hidden overflow-y-auto scrollbar-none"
          >
            <div className="w-full h-full">
              {/*
                Hidden input that captures keyboard focus when elements are selected.
                This ensures the parent's keydown handler fires even after clicking
                inside the cross-origin iframe (which would otherwise steal focus).
              */}
              <input
                ref={keyboardCaptureRef}
                data-editor-capture="true"
                className="absolute w-0 h-0 p-0 m-0 border-0 outline-none opacity-0 pointer-events-none"
                tabIndex={-1}
                aria-hidden="true"
              />
              <HtmlPreview
                ref={previewRef}
                html={html ?? undefined}
                inspectMode={inspectMode}
                splitMode={splitMode}
                zoom={zoom}
                onZoomWheel={zoomBy}
                onPanWheel={handlePanWheel}
                onElementSelect={handleElementSelect}
                onStyleUpdated={handleStyleUpdated}
                onEditModeChange={handleEditModeChange}
                onPageBreakChange={handlePageBreakChange}
                onSplitModeChange={setSplitMode}
                onPageInfo={handlePageInfo}
                onPagesChange={handlePagesChange}
                onLayersTree={handleLayersTree}
              />
            </div>
          </div>

          {/* ── Split-mode hint (inspect mode + split mode) ── */}
          {inspectMode && splitMode && (
            <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-10 pointer-events-none">
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#1a1a1a]/90 border border-[#2d2d2d] backdrop-blur text-[11px] text-[#a1a1aa] shadow-lg whitespace-nowrap">
                <span className="w-1.5 h-1.5 rounded-full bg-[#aef637]" />
                Click an element to start a new PDF page
                <span className="text-[#52525b]">·</span>
                <kbd className="px-1.5 py-0.5 rounded bg-[#1e1e1e] border border-[#3f3f46] text-[10px] text-[#e4e4e7] font-sans">
                  Esc
                </kbd>
                cancel
              </div>
            </div>
          )}

          {/* ── Add page (now lives in the bottom dock, inspect mode only) ── */}

          {/* ── Section quick-nav rail: canvas right edge ──
              One icon per Design-panel section. Clicking scrolls the
              properties sidebar to that section (shown while the panel is
              open) - Figma-style overlay pinned to the canvas edge. */}
          {rightOpen && (
            <div className="absolute right-2 top-1/2 z-10 -translate-y-1/2 flex flex-col items-center gap-0.5 rounded-lg border border-[#2d2d2d] bg-[#1e1e1e]/90 p-1 shadow-lg backdrop-blur-sm">
              {PANEL_SECTIONS.map(({ id, label, Icon }) => (
                <button
                  key={id}
                  type="button"
                  title={label}
                  aria-label={`Go to ${label} section`}
                  onClick={() => navToSection(id)}
                  className="flex size-7 shrink-0 cursor-pointer items-center justify-center rounded-[6px] border-none bg-transparent p-0 text-[#8a8a8a] outline-none transition-colors hover:bg-white/5 hover:text-[#f0f0f0]"
                >
                  <Icon className="size-3.5" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* ── Right sidebar: Design properties ── */}
        <div
          className="overflow-hidden transition-[width] duration-200 ease-out"
          style={{ width: rightOpen ? 256 : 0 }}
        >
          <div className="w-64 h-full border-l border-[#2d2d2d]">
            <PropertiesSidebar
              selectedElements={selectedElements}
              onApplyStyle={handleApplyStyle}
              onAlignElements={(align) =>
                previewRef.current?.alignElements(align)
              }
              onDelete={handleDelete}
              onUndo={handleUndo}
              onRedo={handleRedo}
              splitMode={splitMode}
              hasPageBreak={pageBreakCount > 0}
              pageBreakCount={pageBreakCount}
              onToggleSplitMode={handleToggleSplitMode}
              onClearPageBreak={handleClearPageBreak}
              pageCount={pageCount}
              currentPage={currentPage}
              onMoveToPage={(pageIndex) =>
                previewRef.current?.moveToPage(pageIndex)
              }
              onDeletePage={handleDeletePage}
              layersTree={layersTree}
              selectedLayerIds={selectedElements
                .map((el) => el.id)
                .filter((id): id is string => !!id)}
              onSelectLayer={handleSelectLayer}
              onReorderLayer={handleReorderLayer}
              navRequest={navRequest}
            />
          </div>
        </div>
      </div>

      {/* ── Bottom dock: insert template component + add page (inspect mode) ── */}
      <BottomComponentDock
        groups={componentGroups}
        inspectMode={inspectMode}
        onAddComponent={handleAddComponent}
        onAddPage={() => previewRef.current?.addPage()}
        pageCount={pageCount}
      />
    </div>
  );
}
