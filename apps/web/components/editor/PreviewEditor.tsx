"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  HtmlPreview,
  type HtmlPreviewHandle,
  type ElementInfo,
} from "./HtmlPreview";
import { FigmaBottomToolbar } from "./FigmaBottomToolbar";
import { Sidebar } from "@/components/layout/Sidebar";
import type { UserProfile } from "@/lib/data/users";
import { PropertiesSidebar } from "./PropertiesSidebar";
import { PlusIcon } from "./icons/toolbar-icons";
import { getTemplate } from "@/lib/data/templates";
import {
  saveDocumentContent,
  createDocumentFromHtml,
} from "@/app/actions/documents";
import type { Document } from "@/lib/types";

interface PreviewEditorProps {
  initialDocument?: Document | null;
  initialTemplateSlug?: string | null;
  documents?: Document[];
  profile?: UserProfile | null;
}

export function PreviewEditor({
  initialDocument = null,
  initialTemplateSlug = null,
  documents = [],
  profile = null,
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
  const [docTitle] = useState<string>(
    initialDocument?.title ??
      getTemplate(initialTemplateSlug ?? "")?.name ??
      "Untitled",
  );
  // HTML source is fixed per load; edits live inside the iframe and are
  // captured on Save via getFullHtml().
  const [html] = useState<string | null>(
    initialDocument?.html_code ??
      getTemplate(initialTemplateSlug ?? "")?.html ??
      null,
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
  // isEditingRef is the source of truth for edit-mode gating; the state
  // setter is kept to mirror it into the component (the value itself is
  // never read in render).
  const [, setIsEditing] = useState(false);
  const previewRef = useRef<HtmlPreviewHandle>(null);
  const keyboardCaptureRef = useRef<HTMLInputElement>(null);
  // Ref mirror of isEditing so the message handler (which fires outside
  // render) and the keydown listener always see the latest value.
  const isEditingRef = useRef(false);

  // Left sidebar is open either by hamburger toggle OR by inspect mode
  const leftOpen = leftSidebarOpen || inspectMode;
  const rightOpen = inspectMode;

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
        keyboardCaptureRef.current?.focus();
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

  // Expand shorthand properties (padding, margin) into sub-properties that the toolbar reads
  function expandStyleProps(
    property: string,
    value: string,
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
    return { [property]: value };
  }

  // Any canvas mutation (apply-style, text edit, undo, redo) marks the doc
  // as unsaved so the user knows to hit Save.
  const handleStyleUpdated = useCallback((property: string, value: string) => {
    setDirty(true);
    const updates = expandStyleProps(property, value);
    setSelectedElements((prev) =>
      prev.map((el) => ({ ...el, styles: { ...el.styles, ...updates } })),
    );
  }, []);

  const handleApplyStyle = useCallback((property: string, value: string) => {
    previewRef.current?.applyStyleMulti(property, value);
    const updates = expandStyleProps(property, value);
    setSelectedElements((prev) =>
      prev.map((el) => ({ ...el, styles: { ...el.styles, ...updates } })),
    );
  }, []);

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

  const handlePageInfo = useCallback(
    (info: { page: number; pageCount: number }) => {
      setCurrentPage(info.page);
      setPageCount(Math.max(1, info.pageCount));
    },
    [],
  );

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
        // move the URL to the real document id.
        const result = await createDocumentFromHtml(docTitle, fullHtml);
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
  }, [saving, docId, docTitle, router]);

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

      // V key: toggle inspect mode (only when not focused on an input)
      const el = document.activeElement;
      const isInput =
        el?.tagName === "INPUT" ||
        el?.tagName === "TEXTAREA" ||
        el?.tagName === "SELECT";
      const isEditorCapture =
        el?.getAttribute("data-editor-capture") === "true";
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
  }, [inspectMode, selectedElements.length, splitMode]);

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
              query={query}
              onQueryChange={setQuery}
              profile={profile}
            />
          </div>
        </div>

        {/* ── Center: Canvas ── */}
        <div className="flex-1 h-full relative overflow-hidden">
          {/* Preview iframe area */}
          <div className="absolute inset-0 flex items-start justify-center overflow-auto">
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
                onElementSelect={handleElementSelect}
                onStyleUpdated={handleStyleUpdated}
                onEditModeChange={handleEditModeChange}
                onPageBreakChange={handlePageBreakChange}
                onSplitModeChange={setSplitMode}
                onPageInfo={handlePageInfo}
                onPagesChange={handlePagesChange}
              />
            </div>
          </div>

          {/* ── Split-mode hint (inspect mode + split mode) ── */}
          {inspectMode && splitMode && (
            <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-10 pointer-events-none">
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#1a1a1a]/90 border border-[#2d2d2d] backdrop-blur text-[11px] text-[#a1a1aa] shadow-lg whitespace-nowrap">
                <span className="w-1.5 h-1.5 rounded-full bg-[#18a0fb]" />
                Click an element to start a new PDF page
                <span className="text-[#52525b]">·</span>
                <kbd className="px-1.5 py-0.5 rounded bg-[#1e1e1e] border border-[#3f3f46] text-[10px] text-[#e4e4e7] font-sans">
                  Esc
                </kbd>
                cancel
              </div>
            </div>
          )}

          {/* ── Add page button (inspect mode) ── */}
          {inspectMode && (
            <button
              onClick={() => previewRef.current?.addPage()}
              className="absolute bottom-14 left-1/2 -translate-x-1/2 z-10 flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-[#1a1a1a]/95 border border-[#2d2d2d] shadow-lg text-[11px] font-medium text-[#e4e4e7] hover:bg-[#232325] hover:border-[#3f3f46] transition-colors whitespace-nowrap"
            >
              <PlusIcon className="w-3.5 h-3.5 text-[#18a0fb]" />
              Add page
              {pageCount > 1 && (
                <span className="text-[#71717a] font-mono text-[10px]">
                  · {pageCount}
                </span>
              )}
            </button>
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
            />
          </div>
        </div>
      </div>
    </div>
  );
}
