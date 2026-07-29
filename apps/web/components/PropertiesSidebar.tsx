"use client";

import { useState, type SVGProps } from "react";
import type { ElementInfo } from "@/components/HtmlPreview";
import { parseRgbToHex, cssPx } from "@/components/style-utils";

/* ─── Icons ─── */

function ChevronDown(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      className="w-3 h-3"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2}
      {...props}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M19.5 8.25l-7.5 7.5-7.5-7.5"
      />
    </svg>
  );
}

function PlusIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      className="w-3 h-3"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2}
      {...props}
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 5v14m-7-7h14" />
    </svg>
  );
}

function UndoIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      className="w-3.5 h-3.5"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={1.8}
      {...props}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M9 15L3 9m0 0l6-6M3 9h12a6 6 0 010 12h-3"
      />
    </svg>
  );
}

function RedoIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      className="w-3.5 h-3.5"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={1.8}
      {...props}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M15 15l6-6m0 0l-6-6m6 6H9a6 6 0 000 12h3"
      />
    </svg>
  );
}

function TrashIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      className="w-3.5 h-3.5"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={1.6}
      {...props}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0"
      />
    </svg>
  );
}

/* ─── Alignment icons (Figma-style 6-box grid) ─── */

function AlignGrid({ onAlign }: { onAlign: (h: string, v: string) => void }) {
  return (
    <div className="grid grid-cols-3 gap-0.5 w-fit">
      {/* Top row */}
      <button
        onClick={() => onAlign("left", "top")}
        className="w-6 h-6 rounded flex items-center justify-center text-[#52525b] hover:text-[#a1a1aa] hover:bg-[#2d2d30] transition-colors"
        title="Align top left"
      >
        <svg className="w-3 h-3" viewBox="0 0 12 12" fill="currentColor">
          <rect x="0" y="0" width="4" height="12" rx="0.5" />
          <rect x="0" y="0" width="12" height="4" rx="0.5" />
        </svg>
      </button>
      <button
        onClick={() => onAlign("center", "top")}
        className="w-6 h-6 rounded flex items-center justify-center text-[#52525b] hover:text-[#a1a1aa] hover:bg-[#2d2d30] transition-colors"
        title="Align top center"
      >
        <svg className="w-3 h-3" viewBox="0 0 12 12" fill="currentColor">
          <rect x="4" y="0" width="4" height="12" rx="0.5" />
          <rect x="0" y="0" width="12" height="4" rx="0.5" />
        </svg>
      </button>
      <button
        onClick={() => onAlign("right", "top")}
        className="w-6 h-6 rounded flex items-center justify-center text-[#52525b] hover:text-[#a1a1aa] hover:bg-[#2d2d30] transition-colors"
        title="Align top right"
      >
        <svg className="w-3 h-3" viewBox="0 0 12 12" fill="currentColor">
          <rect x="8" y="0" width="4" height="12" rx="0.5" />
          <rect x="0" y="0" width="12" height="4" rx="0.5" />
        </svg>
      </button>
      {/* Bottom row */}
      <button
        onClick={() => onAlign("left", "bottom")}
        className="w-6 h-6 rounded flex items-center justify-center text-[#52525b] hover:text-[#a1a1aa] hover:bg-[#2d2d30] transition-colors"
        title="Align bottom left"
      >
        <svg className="w-3 h-3" viewBox="0 0 12 12" fill="currentColor">
          <rect x="0" y="0" width="4" height="12" rx="0.5" />
          <rect x="0" y="8" width="12" height="4" rx="0.5" />
        </svg>
      </button>
      <button
        onClick={() => onAlign("center", "bottom")}
        className="w-6 h-6 rounded flex items-center justify-center text-[#52525b] hover:text-[#a1a1aa] hover:bg-[#2d2d30] transition-colors"
        title="Align bottom center"
      >
        <svg className="w-3 h-3" viewBox="0 0 12 12" fill="currentColor">
          <rect x="4" y="0" width="4" height="12" rx="0.5" />
          <rect x="0" y="8" width="12" height="4" rx="0.5" />
        </svg>
      </button>
      <button
        onClick={() => onAlign("right", "bottom")}
        className="w-6 h-6 rounded flex items-center justify-center text-[#52525b] hover:text-[#a1a1aa] hover:bg-[#2d2d30] transition-colors"
        title="Align bottom right"
      >
        <svg className="w-3 h-3" viewBox="0 0 12 12" fill="currentColor">
          <rect x="8" y="0" width="4" height="12" rx="0.5" />
          <rect x="0" y="8" width="12" height="4" rx="0.5" />
        </svg>
      </button>
    </div>
  );
}

/* ─── Collapsible section ─── */

function Section({
  label,
  defaultOpen = true,
  children,
  onAdd,
}: {
  label: string;
  defaultOpen?: boolean;
  children: React.ReactNode;
  onAdd?: () => void;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="border-b border-[#2d2d2d] last:border-b-0">
      <div
        role="button"
        tabIndex={0}
        onClick={() => setOpen(!open)}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            setOpen(!open);
          }
        }}
        className="flex items-center justify-between w-full px-3 py-2 text-[11px] font-semibold text-[#71717a] hover:text-[#a1a1aa] transition-colors cursor-pointer select-none"
      >
        <div className="flex items-center gap-1.5">
          <ChevronDown
            className={`w-3 h-3 transition-transform ${open ? "rotate-0" : "-rotate-90"}`}
          />
          {label}
        </div>
        {onAdd && open && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onAdd();
            }}
            className="w-5 h-5 flex items-center justify-center rounded hover:bg-[#2d2d30] text-[#52525b] hover:text-[#a1a1aa] transition-colors"
          >
            <PlusIcon className="w-3 h-3" />
          </button>
        )}
      </div>
      {open && <div className="px-3 pb-3 space-y-2">{children}</div>}
    </div>
  );
}

/* ─── Two-column input (for W/H, X/Y, etc.) ─── */

function TwoColInput({
  leftLabel,
  leftValue,
  onLeftChange,
  rightLabel,
  rightValue,
  onRightChange,
}: {
  leftLabel: string;
  leftValue: string | number;
  onLeftChange: (val: string) => void;
  rightLabel: string;
  rightValue: string | number;
  onRightChange: (val: string) => void;
}) {
  return (
    <div className="flex items-center gap-1.5">
      <div className="flex-1 flex items-center gap-1">
        <span className="w-4 text-[10px] text-[#71717a] font-mono text-center">
          {leftLabel}
        </span>
        <input
          type="number"
          value={leftValue}
          onChange={(e) => onLeftChange(e.target.value)}
          className="w-full min-w-0 px-2 py-1 rounded bg-[#2d2d30] border border-[#3f3f46] text-[#e4e4e7] text-[11px] text-center font-mono [appearance:textfield] [&::-webkit-inner-spin-button]:hidden [&::-webkit-outer-spin-button]:hidden focus:border-[#18a0fb] focus:outline-none transition-colors"
        />
      </div>
      <div className="flex-1 flex items-center gap-1">
        <span className="w-4 text-[10px] text-[#71717a] font-mono text-center">
          {rightLabel}
        </span>
        <input
          type="number"
          value={rightValue}
          onChange={(e) => onRightChange(e.target.value)}
          className="w-full min-w-0 px-2 py-1 rounded bg-[#2d2d30] border border-[#3f3f46] text-[#e4e4e7] text-[11px] text-center font-mono [appearance:textfield] [&::-webkit-inner-spin-button]:hidden [&::-webkit-outer-spin-button]:hidden focus:border-[#18a0fb] focus:outline-none transition-colors"
        />
      </div>
    </div>
  );
}

/* ─── Main sidebar component ─── */

interface PropertiesSidebarProps {
  selectedElements: ElementInfo[];
  onApplyStyle: (property: string, value: string) => void;
  onDelete?: () => void;
  onUndo?: () => void;
  onRedo?: () => void;
}

export function PropertiesSidebar({
  selectedElements,
  onApplyStyle,
  onDelete,
  onUndo,
  onRedo,
}: PropertiesSidebarProps) {
  const first = selectedElements[0];
  const s = first?.styles;
  const count = selectedElements.length;
  const hasSelection = count > 0;

  return (
    <div className="w-64 shrink-0 h-full flex flex-col bg-[#1e1e1e] border-l border-[#2d2d2d] select-none overflow-hidden">
      {/* ── Element name + icon row ── */}
      <div className="shrink-0 px-3 py-2.5 border-b border-[#2d2d2d]">
        <div className="flex items-center justify-between mb-2">
          {hasSelection ? (
            <span className="text-[13px] font-semibold text-[#e4e4e7]">
              {first.tag === "div"
                ? "Frame"
                : first.tag === "span"
                  ? "Text"
                  : first.tag === "img"
                    ? "Image"
                    : first.tag === "button"
                      ? "Button"
                      : first.tag === "h1"
                        ? "Heading"
                        : first.tag === "p"
                          ? "Text"
                          : first.tag.charAt(0).toUpperCase() +
                            first.tag.slice(1)}
            </span>
          ) : (
            <span className="text-[13px] font-semibold text-[#52525b]">
              No selection
            </span>
          )}
          <button className="w-6 h-6 flex items-center justify-center rounded hover:bg-[#2d2d30] text-[#71717a] hover:text-[#a1a1aa] transition-colors">
            <svg
              className="w-4 h-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={1.6}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M6.75 12a.75.75 0 11-1.5 0 .75.75 0 011.5 0zM12.75 12a.75.75 0 11-1.5 0 .75.75 0 011.5 0zM18.75 12a.75.75 0 11-1.5 0 .75.75 0 011.5 0z"
              />
            </svg>
          </button>
        </div>
      </div>

      {/* ── Scrollable properties area ── */}
      <div className="flex-1 overflow-y-auto custom-scroll">
        {!hasSelection && (
          <div className="flex items-center justify-center h-full px-6 text-center text-[11px] text-[#52525b] leading-relaxed">
            Select an element
            <br />
            in the preview to edit
          </div>
        )}

        {hasSelection && s && (
          <>
            {/* ── Position section ── */}
            <Section label="Position">
              {/* Alignment grid */}
              <AlignGrid
                onAlign={(h, v) => {
                  /* alignment logic placeholder */
                }}
              />

              {/* X / Y position */}
              <TwoColInput
                leftLabel="X"
                leftValue={cssPx(s.left) || 0}
                onLeftChange={(v) => onApplyStyle("left", v + "px")}
                rightLabel="Y"
                rightValue={cssPx(s.top) || 0}
                onRightChange={(v) => onApplyStyle("top", v + "px")}
              />

              {/* Rotation + flip */}
              <div className="flex items-center gap-2">
                <div className="flex-1 flex items-center gap-1">
                  <span className="w-5 flex items-center justify-center">
                    <svg
                      className="w-3.5 h-3.5 text-[#52525b]"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={1.6}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M19.5 12c0-1.232-.046-2.453-.138-3.662a4.006 4.006 0 00-3.7-3.7 48.678 48.678 0 00-7.324 0 4.006 4.006 0 00-3.7 3.7c-.017.22-.032.441-.046.662M19.5 12l3-3m-3 3l-3-3m-12 3c0 1.232.046 2.453.138 3.662a4.006 4.006 0 003.7 3.7 48.656 48.656 0 007.324 0 4.006 4.006 0 003.7-3.7c.017-.22.032-.441.046-.662M4.5 12l3 3m-3-3l-3 3"
                      />
                    </svg>
                  </span>
                  <input
                    type="number"
                    value={cssPx(s.rotate) || 0}
                    onChange={(e) =>
                      onApplyStyle("rotate", e.target.value + "deg")
                    }
                    className="flex-1 min-w-0 px-2 py-1 rounded bg-[#2d2d30] border border-[#3f3f46] text-[#e4e4e7] text-[11px] text-center font-mono [appearance:textfield] [&::-webkit-inner-spin-button]:hidden [&::-webkit-outer-spin-button]:hidden focus:border-[#18a0fb] focus:outline-none transition-colors"
                  />
                  <span className="text-[10px] text-[#52525b] font-mono">
                    °
                  </span>
                </div>
                {/* Flip buttons */}
                <div className="flex items-center gap-0.5">
                  <button
                    className="w-6 h-6 rounded flex items-center justify-center text-[#52525b] hover:text-[#a1a1aa] hover:bg-[#2d2d30] transition-colors"
                    title="Flip horizontal"
                  >
                    <svg
                      className="w-3.5 h-3.5"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={1.6}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M7.5 21L3 16.5m0 0L7.5 12M3 16.5h13.5m0-13.5L21 7.5m0 0L16.5 12M21 7.5H7.5"
                      />
                    </svg>
                  </button>
                  <button
                    className="w-6 h-6 rounded flex items-center justify-center text-[#52525b] hover:text-[#a1a1aa] hover:bg-[#2d2d30] transition-colors"
                    title="Flip vertical"
                  >
                    <svg
                      className="w-3.5 h-3.5"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={1.6}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182"
                      />
                    </svg>
                  </button>
                </div>
              </div>
            </Section>

            {/* ── Layout section ── */}
            <Section label="Layout">
              <TwoColInput
                leftLabel="W"
                leftValue={cssPx(s.width) || ""}
                onLeftChange={(v) => onApplyStyle("width", v + "px")}
                rightLabel="H"
                rightValue={cssPx(s.height) || ""}
                onRightChange={(v) => onApplyStyle("height", v + "px")}
              />
            </Section>

            {/* ── Appearance section ── */}
            <Section label="Appearance">
              <div className="flex items-center gap-2">
                <div className="flex-1 flex items-center gap-1">
                  <span className="text-[10px] text-[#71717a] font-mono w-12">
                    Opacity
                  </span>
                  <input
                    type="number"
                    value={
                      s.opacity ? Math.round(parseFloat(s.opacity) * 100) : 100
                    }
                    onChange={(e) =>
                      onApplyStyle(
                        "opacity",
                        String(
                          Math.min(100, Math.max(0, Number(e.target.value))) /
                            100,
                        ),
                      )
                    }
                    min={0}
                    max={100}
                    className="flex-1 min-w-0 px-2 py-1 rounded bg-[#2d2d30] border border-[#3f3f46] text-[#e4e4e7] text-[11px] text-center font-mono [appearance:textfield] [&::-webkit-inner-spin-button]:hidden [&::-webkit-outer-spin-button]:hidden focus:border-[#18a0fb] focus:outline-none transition-colors"
                  />
                  <span className="text-[10px] text-[#52525b] font-mono">
                    %
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <div className="flex-1 flex items-center gap-1">
                  <span className="text-[10px] text-[#71717a] font-mono w-12">
                    Radius
                  </span>
                  <input
                    type="number"
                    value={cssPx(s.borderRadius) || 0}
                    onChange={(e) =>
                      onApplyStyle("borderRadius", e.target.value + "px")
                    }
                    min={0}
                    className="flex-1 min-w-0 px-2 py-1 rounded bg-[#2d2d30] border border-[#3f3f46] text-[#e4e4e7] text-[11px] text-center font-mono [appearance:textfield] [&::-webkit-inner-spin-button]:hidden [&::-webkit-outer-spin-button]:hidden focus:border-[#18a0fb] focus:outline-none transition-colors"
                  />
                  <span className="text-[10px] text-[#52525b] font-mono">
                    px
                  </span>
                </div>
              </div>
            </Section>

            {/* ── Fill section ── */}
            <Section label="Fill" onAdd={() => {}}>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={parseRgbToHex(s.backgroundColor)}
                  onChange={(e) =>
                    onApplyStyle("backgroundColor", e.target.value)
                  }
                  className="w-6 h-6 rounded cursor-pointer border border-[#3f3f46] p-0 [&::-webkit-color-swatch-wrapper]:p-0.5 [&::-webkit-color-swatch]:rounded-sm [&::-webkit-color-swatch]:border-0"
                />
                <span className="text-[11px] font-mono text-[#a1a1aa]">
                  {parseRgbToHex(s.backgroundColor).toUpperCase()}
                </span>
                <span className="text-[10px] text-[#52525b] font-mono ml-auto">
                  100%
                </span>
                <button className="w-5 h-5 flex items-center justify-center rounded hover:bg-[#2d2d30] text-[#52525b] hover:text-[#a1a1aa] transition-colors">
                  <svg
                    className="w-3 h-3"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M19.5 12c0-1.232-.046-2.453-.138-3.662a4.006 4.006 0 00-3.7-3.7 48.678 48.678 0 00-7.324 0 4.006 4.006 0 00-3.7 3.7c-.017.22-.032.441-.046.662M19.5 12l3-3m-3 3l-3-3m-12 3c0 1.232.046 2.453.138 3.662a4.006 4.006 0 003.7 3.7 48.656 48.656 0 007.324 0 4.006 4.006 0 003.7-3.7c.017-.22.032-.441.046-.662M4.5 12l3 3m-3-3l-3 3"
                    />
                  </svg>
                </button>
              </div>
            </Section>

            {/* ── Stroke section ── */}
            <Section label="Stroke" onAdd={() => {}}>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={
                    s.borderColor ? parseRgbToHex(s.borderColor) : "#a39e9e"
                  }
                  onChange={(e) => onApplyStyle("borderColor", e.target.value)}
                  className="w-6 h-6 rounded cursor-pointer border border-[#3f3f46] p-0 [&::-webkit-color-swatch-wrapper]:p-0.5 [&::-webkit-color-swatch]:rounded-sm [&::-webkit-color-swatch]:border-0"
                />
                <span className="text-[11px] font-mono text-[#a1a1aa]">
                  {s.borderColor
                    ? parseRgbToHex(s.borderColor).toUpperCase()
                    : "#A39E9E"}
                </span>
                <span className="text-[10px] text-[#52525b] font-mono ml-auto">
                  100%
                </span>
                <button className="w-5 h-5 flex items-center justify-center rounded hover:bg-[#2d2d30] text-[#52525b] hover:text-[#a1a1aa] transition-colors">
                  <svg
                    className="w-3 h-3"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M19.5 12c0-1.232-.046-2.453-.138-3.662a4.006 4.006 0 00-3.7-3.7 48.678 48.678 0 00-7.324 0 4.006 4.006 0 00-3.7 3.7c-.017.22-.032.441-.046.662M19.5 12l3-3m-3 3l-3-3m-12 3c0 1.232.046 2.453.138 3.662a4.006 4.006 0 003.7 3.7 48.656 48.656 0 007.324 0 4.006 4.006 0 003.7-3.7c.017-.22.032-.441.046-.662M4.5 12l3 3m-3-3l-3 3"
                    />
                  </svg>
                </button>
              </div>
              <div className="flex items-center gap-2">
                <div className="flex-1 flex items-center gap-1">
                  <span className="text-[10px] text-[#71717a] font-mono w-14">
                    Position
                  </span>
                  <select className="flex-1 px-2 py-1 rounded bg-[#2d2d30] border border-[#3f3f46] text-[#e4e4e7] text-[11px] font-mono focus:border-[#18a0fb] focus:outline-none transition-colors appearance-none">
                    <option>Inside</option>
                    <option>Center</option>
                    <option>Outside</option>
                  </select>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <div className="flex-1 flex items-center gap-1">
                  <span className="text-[10px] text-[#71717a] font-mono w-14">
                    Weight
                  </span>
                  <input
                    type="number"
                    value={cssPx(s.borderWidth) || 1}
                    onChange={(e) =>
                      onApplyStyle("borderWidth", e.target.value + "px")
                    }
                    min={0}
                    className="flex-1 min-w-0 px-2 py-1 rounded bg-[#2d2d30] border border-[#3f3f46] text-[#e4e4e7] text-[11px] text-center font-mono [appearance:textfield] [&::-webkit-inner-spin-button]:hidden [&::-webkit-outer-spin-button]:hidden focus:border-[#18a0fb] focus:outline-none transition-colors"
                  />
                </div>
              </div>
            </Section>

            {/* ── Effects section ── */}
            <Section label="Effects" defaultOpen={false} onAdd={() => {}}>
              <div className="text-[11px] text-[#52525b] text-center py-2">
                No effects applied
              </div>
            </Section>

            {/* ── Export section ── */}
            <Section label="Export" defaultOpen={false} onAdd={() => {}}>
              <div className="text-[11px] text-[#52525b] text-center py-2">
                No export settings
              </div>
            </Section>

            {/* ── Delete button ── */}
            {onDelete && (
              <div className="px-3 py-3 border-t border-[#2d2d2d]">
                <button
                  onClick={onDelete}
                  className="flex items-center justify-center gap-1.5 w-full py-1.5 rounded text-[11px] text-[#71717a] hover:text-red-400 hover:bg-red-500/10 transition-colors"
                >
                  <TrashIcon />
                  <span>Delete</span>
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
