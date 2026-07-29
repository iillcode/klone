"use client";

import { useState } from "react";
import { ThemeToggle } from "@/components/theme-toggle";

type ViewportSize = "mobile" | "tablet" | "desktop";

const VIEWPORTS: { key: ViewportSize; label: string; width: number }[] = [
  { key: "mobile", label: "375", width: 375 },
  { key: "tablet", label: "768", width: 768 },
  { key: "desktop", label: "1440", width: 1440 },
];

interface EditorTopBarProps {
  title?: string;
  onViewportChange?: (width: number) => void;
}

export function EditorTopBar({ title, onViewportChange }: EditorTopBarProps) {
  const [activeViewport, setActiveViewport] = useState<ViewportSize>("desktop");

  return (
    <div className="flex items-center justify-between h-10 px-3 bg-[#0d0d0f] border-b border-[#27272a] select-none shrink-0">
      {/* Left: Viewport switcher */}
      <div className="flex items-center gap-1">
        {VIEWPORTS.map((vp) => (
          <button
            key={vp.key}
            onClick={() => {
              setActiveViewport(vp.key);
              onViewportChange?.(vp.width);
            }}
            className={`px-2 py-1 rounded text-[11px] font-medium leading-none transition-colors ${
              activeViewport === vp.key
                ? "bg-[#27272a] text-[#e4e4e7]"
                : "text-[#52525b] hover:text-[#a1a1aa] hover:bg-[#18181b]"
            }`}
            title={`${vp.label}px — ${vp.key}`}
          >
            {vp.label}
          </button>
        ))}
      </div>

      {/* Center: Page title */}
      <div className="text-[11px] text-[#52525b] font-medium tracking-wide truncate px-4">
        {title || "Canvas Editor"}
      </div>

      {/* Right: zoom indicator + theme toggle */}
      <div className="flex items-center gap-2">
        <span className="text-[11px] text-[#52525b] font-mono">100%</span>
        <ThemeToggle />
      </div>
    </div>
  );
}
