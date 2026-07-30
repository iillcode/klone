"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { useParams } from "next/navigation";
import {
  HtmlPreview,
  type HtmlPreviewHandle,
  type ElementInfo,
} from "@/components/HtmlPreview";
import { FigmaLayersSidebar } from "@/components/FigmaLayersSidebar";
import { FigmaBottomToolbar } from "@/components/FigmaBottomToolbar";
import { PropertiesSidebar } from "@/components/PropertiesSidebar";

export default function PreviewPage() {
  const { id } = useParams<{ id: string }>();
  const [selectedElements, setSelectedElements] = useState<ElementInfo[]>([]);
  const [inspectMode, setInspectMode] = useState(false);
  const [leftSidebarOpen, setLeftSidebarOpen] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const previewRef = useRef<HtmlPreviewHandle>(null);
  const keyboardCaptureRef = useRef<HTMLInputElement>(null);

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
      if (elements && elements.length > 0) {
        keyboardCaptureRef.current?.focus();
      } else {
        keyboardCaptureRef.current?.blur();
      }
    },
    [inspectMode],
  );

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
    return { [property]: value };
  }

  const handleStyleUpdated = useCallback((property: string, value: string) => {
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

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      // Escape: deselect all elements
      if (e.key === "Escape") {
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

      // Delete/Backspace: delete selected elements only when NOT focused
      // on a real form input. The hidden editor-capture input is treated
      // as part of the editor (not a real form input).
      if (e.key === "Delete" || e.key === "Backspace") {
        const isEditorCapture =
          el?.getAttribute("data-editor-capture") === "true";
        if (!isInput || isEditorCapture) {
          e.preventDefault();
          previewRef.current?.deleteMulti();
        }
      }
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, []);

  return (
    <div className="flex flex-col w-full h-full bg-[#1e1e1e]">
      {/* ── Full-width top bar ── */}
      <FigmaBottomToolbar
        title="Untitled"
        leftSidebarOpen={leftOpen}
        inspectMode={inspectMode}
        onToggleLeftSidebar={() => setLeftSidebarOpen((p) => !p)}
        onToggleInspect={() => {
          setInspectMode((prev) => {
            const next = !prev;
            if (!next) {
              setLeftSidebarOpen(false);
              setSelectedElements([]);
              previewRef.current?.deselect();
            }
            return next;
          });
        }}
        onUndo={handleUndo}
        onRedo={handleRedo}
        onShare={handleShare}
        downloading={downloading}
      />

      {/* ── Content area: sidebars + canvas ── */}
      <div className="flex-1 flex flex-row min-h-0">
        {/* ── Left sidebar: Pages + Layers ── */}
        <div
          className="overflow-hidden transition-[width] duration-200 ease-out"
          style={{ width: leftOpen ? 240 : 0 }}
        >
          <div className="w-60 h-full border-r border-[#2d2d2d]">
            <FigmaLayersSidebar />
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
                inspectMode={inspectMode}
                onElementSelect={handleElementSelect}
                onStyleUpdated={handleStyleUpdated}
              />
            </div>
          </div>
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
              onDelete={handleDelete}
              onUndo={handleUndo}
              onRedo={handleRedo}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
