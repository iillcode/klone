"use client";

import {
  CursorIcon,
  DownloadIcon,
  PlayIcon,
  MenuIcon,
  SaveIcon,
  SpinnerIcon,
} from "./icons/toolbar-icons";

/* ─── Main component ─── */

interface FigmaBottomToolbarProps {
  inspectMode?: boolean;
  onToggleInspect?: () => void;
  title?: string;
  leftSidebarOpen?: boolean;
  onToggleLeftSidebar?: () => void;
  onPresent?: () => void;
  onShare?: () => void;
  onSave?: () => void;
  downloading?: boolean;
  saving?: boolean;
  dirty?: boolean;
}

export function FigmaBottomToolbar({
  inspectMode = false,
  onToggleInspect,
  title = "Untitled",
  leftSidebarOpen = false,
  onToggleLeftSidebar,
  onPresent,
  onShare,
  onSave,
  downloading = false,
  saving = false,
  dirty = false,
}: FigmaBottomToolbarProps) {
  return (
    <>
      {/* ── Top bar: file name + actions ── */}
      <div className="h-11 flex items-center justify-between px-4 bg-[#161617] border-b border-[#2d2d2d]/60">
        {/* Left: hamburger + file info */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5">
            {/* Left nav toggle (just icon) */}
            <button
              onClick={onToggleLeftSidebar}
              title={
                leftSidebarOpen ? "Close layers panel" : "Open layers panel"
              }
              className={`w-7 h-7 flex items-center justify-center rounded-md transition-colors ${
                leftSidebarOpen
                  ? "bg-[#202020] text-[#e4e4e7]"
                  : "text-[#a1a1aa] hover:text-[#e4e4e7] hover:bg-[#202020]"
              }`}
            >
              <MenuIcon />
            </button>
            <div className="w-6 h-6 rounded bg-[#0d9d58] flex items-center justify-center">
              <span className="text-white font-bold text-[10px]">F</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[12px] font-medium text-[#e4e4e7]">
                {title}
              </span>
              {dirty && (
                <span className="flex items-center gap-1 text-[10px] text-[#f59e0b]">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#f59e0b]" />
                  Unsaved
                </span>
              )}
              <span className="text-[10px] text-[#71717a]">Drafts</span>
              <span className="px-1.5 py-0.5 rounded bg-[#1e1e1e] text-[9px] font-medium text-[#a1a1aa]">
                Free
              </span>
            </div>
          </div>
        </div>

        {/* Right: inspect toggle + undo/redo + present + share */}
        <div className="flex items-center gap-1">
          {/* Inspect mode toggle (Move/V tool) */}
          <button
            onClick={onToggleInspect}
            title={inspectMode ? "Disable inspect (V)" : "Enable inspect (V)"}
            className={`w-7 h-7 flex items-center justify-center rounded-md transition-colors ${
              inspectMode
                ? "bg-[#18a0fb] text-white shadow-[0_0_6px_rgba(24,160,251,0.3)]"
                : "text-[#a1a1aa] hover:text-[#e4e4e7] hover:bg-[#202020]"
            }`}
          >
            <CursorIcon className="w-3.5 h-3.5" />
          </button>
          <div className="w-px h-4 bg-[#262626] mx-1" />
          <button
            onClick={onPresent}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[11px] font-medium text-[#a1a1aa] hover:text-[#e4e4e7] hover:bg-[#202020] transition-colors"
          >
            <PlayIcon className="w-3.5 h-3.5" />
            <span>Present</span>
            <span className="text-[9px] text-[#52525b] font-mono ml-0.5">
              ⌘⌥↵
            </span>
          </button>
          <button
            onClick={onSave}
            disabled={saving}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[11px] font-medium text-[#e4e4e7] border border-[#262626] hover:bg-[#202020] transition-colors disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {saving ? (
              <SpinnerIcon />
            ) : (
              <SaveIcon className="w-3.5 h-3.5" />
            )}
            <span>{saving ? "Saving…" : "Save"}</span>
          </button>
          <button
            onClick={onShare}
            disabled={downloading}
            className="flex items-center gap-1.5 px-3 py-1.5 min-w-[110px] justify-center rounded-md bg-[#18a0fb] hover:bg-[#0c8ce9] text-white text-[11px] font-medium transition-colors disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {downloading ? (
              <SpinnerIcon />
            ) : (
              <DownloadIcon className="w-3.5 h-3.5" />
            )}
            <span>{downloading ? "Downloading…" : "Download"}</span>
          </button>
        </div>
      </div>
    </>
  );
}
