"use client";

import type { ElementInfo } from "@/components/HtmlPreview";

function UndoIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className ?? "w-3.5 h-3.5"}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={1.8}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M9 15L3 9m0 0l6-6M3 9h12a6 6 0 010 12h-3"
      />
    </svg>
  );
}

function RedoIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className ?? "w-3.5 h-3.5"}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={1.8}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M15 15l6-6m0 0l-6-6m6 6H9a6 6 0 000 12h3"
      />
    </svg>
  );
}

interface PreviewToolbarProps {
  selectedElements: ElementInfo[];
  onUndo?: () => void;
  onRedo?: () => void;
}

export function PreviewToolbar({
  selectedElements,
  onUndo,
  onRedo,
}: PreviewToolbarProps) {
  const first = selectedElements[0];
  const count = selectedElements.length;

  return (
    <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-10 flex items-center gap-2 px-3 py-2 rounded-lg bg-[#0d0d0f]/90 backdrop-blur-md border border-[#27272a] select-none shadow-lg">
      {/* Undo / Redo */}
      <div className="flex items-center gap-0.5">
        <button
          onClick={onUndo}
          className="w-7 h-7 rounded flex items-center justify-center text-[#a1a1aa] hover:text-[#e4e4e7] hover:bg-[#27272a] transition-colors"
          title="Undo"
        >
          <UndoIcon />
        </button>
        <button
          onClick={onRedo}
          className="w-7 h-7 rounded flex items-center justify-center text-[#a1a1aa] hover:text-[#e4e4e7] hover:bg-[#27272a] transition-colors"
          title="Redo"
        >
          <RedoIcon />
        </button>
      </div>

      {/* Selection info */}
      {count > 0 && (
        <>
          <div className="w-px h-4 bg-[#27272a]" />
          <span className="text-[11px] text-[#52525b] font-mono">
            &lt;{first.tag}&gt;
          </span>
          {count > 1 && (
            <span className="text-[11px] text-violet-400 font-mono">
              &times;{count}
            </span>
          )}
        </>
      )}
    </div>
  );
}
