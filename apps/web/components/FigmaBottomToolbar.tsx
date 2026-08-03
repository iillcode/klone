"use client";

import type { SVGProps } from "react";

/* ─── Tool icons ─── */

function CursorIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24" {...props}>
      <path d="M5.5 3.21V20.8c0 .45.54.67.85.35l4.86-4.86a.5.5 0 0 1 .35-.15h6.87c.48 0 .72-.58.38-.92L6.35 2.85a.5.5 0 0 0-.85.36z" />
    </svg>
  );
}

function DownloadIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      className="w-3.5 h-3.5"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2}
      {...props}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3"
      />
    </svg>
  );
}

function PlayIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24" {...props}>
      <path d="M8 5.14v14l11-7-11-7z" />
    </svg>
  );
}

function MenuIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      className="w-4 h-4"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={1.8}
      {...props}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5"
      />
    </svg>
  );
}

/* ─── Main component ─── */

interface FigmaBottomToolbarProps {
  inspectMode?: boolean;
  onToggleInspect?: () => void;
  title?: string;
  leftSidebarOpen?: boolean;
  onToggleLeftSidebar?: () => void;
  onPresent?: () => void;
  onShare?: () => void;
  downloading?: boolean;
}

export function FigmaBottomToolbar({
  inspectMode = false,
  onToggleInspect,
  title = "Untitled",
  leftSidebarOpen = false,
  onToggleLeftSidebar,
  onPresent,
  onShare,
  downloading = false,
}: FigmaBottomToolbarProps) {
  return (
    <>
      {/* ── Top bar: file name + actions ── */}
      <div className="h-11 flex items-center justify-between px-4 bg-[#1e1e1e] border-b border-[#2d2d2d]/60">
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
                  ? "bg-[#2d2d30] text-[#e4e4e7]"
                  : "text-[#a1a1aa] hover:text-[#e4e4e7] hover:bg-[#2d2d30]"
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
              <span className="text-[10px] text-[#71717a]">Drafts</span>
              <span className="px-1.5 py-0.5 rounded bg-[#2d2d30] text-[9px] font-medium text-[#a1a1aa]">
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
                : "text-[#a1a1aa] hover:text-[#e4e4e7] hover:bg-[#2d2d30]"
            }`}
          >
            <CursorIcon className="w-3.5 h-3.5" />
          </button>
          <div className="w-px h-4 bg-[#2d2d30] mx-1" />
          <button
            onClick={onPresent}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[11px] font-medium text-[#a1a1aa] hover:text-[#e4e4e7] hover:bg-[#2d2d30] transition-colors"
          >
            <PlayIcon className="w-3.5 h-3.5" />
            <span>Present</span>
            <span className="text-[9px] text-[#52525b] font-mono ml-0.5">
              ⌘⌥↵
            </span>
          </button>
          <button
            onClick={onShare}
            disabled={downloading}
            className="flex items-center gap-1.5 px-3 py-1.5 min-w-[110px] justify-center rounded-md bg-[#18a0fb] hover:bg-[#0c8ce9] text-white text-[11px] font-medium transition-colors disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {downloading ? (
              <svg
                className="w-3.5 h-3.5 animate-spin"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="3"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                />
              </svg>
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
