"use client";

import type { ElementInfo, AlignMode } from "./HtmlPreview";
import {
  Keyboard,
  Undo2,
  Redo2,
  AlignStartVertical,
  AlignCenterVertical,
  AlignEndVertical,
  AlignStartHorizontal,
  AlignCenterHorizontal,
  AlignEndHorizontal,
  FlipHorizontal2,
  FlipVertical2,
  RotateCwSquare,
  RotateCw,
  DeleteIcon,
} from "lucide-react";
import { parseTranslate } from "./utils/style-utils";
import { NumberField } from "./ui/NumberField";
import { TypographyPanel } from "./ui/TypographyPanel";
import { AppearanceSection } from "./ui/AppearanceSection";
import { StrokeSection } from "./ui/StrokeSection";
import { EffectsSection } from "./ui/EffectsSection";
import { LayoutSection } from "./ui/LayoutSection";
import { FillSection } from "./ui/FillSection";

/**
 * Keyboard shortcuts available in the Klone editor, shown in the design
 * panel when nothing is selected. `keys` are rendered as small kbd chips;
 * "⌘" means ⌘ on macOS / Ctrl on Windows & Linux.
 */
const SHORTCUT_GROUPS: {
  title: string;
  items: { label: string; keys: string[] }[];
}[] = [
  {
    title: "Inspect & select",
    items: [
      { label: "Inspect mode", keys: ["V"] },
      { label: "Select all", keys: ["⌘", "A"] },
      { label: "Toggle selection", keys: ["⌘", "Click"] },
      { label: "Additive marquee", keys: ["⇧", "Drag"] },
      { label: "Clear selection", keys: ["Esc"] },
    ],
  },
  {
    title: "Editing",
    items: [
      { label: "Edit text", keys: ["Double-click"] },
      { label: "Undo", keys: ["⌘", "Z"] },
      { label: "Redo", keys: ["⇧", "⌘", "Z"] },
      { label: "Delete selection", keys: ["⌫"] },
      { label: "Nudge 1px", keys: ["← ↑ ↓ →"] },
      { label: "Nudge 10px", keys: ["⇧", "← ↑ ↓ →"] },
    ],
  },
  {
    title: "Text editing",
    items: [
      { label: "Save text", keys: ["Enter"] },
      { label: "Save (code blocks)", keys: ["⌘", "Enter"] },
      { label: "Cancel edit", keys: ["Esc"] },
    ],
  },
  {
    title: "Canvas",
    items: [
      { label: "Search documents", keys: ["/"] },
      { label: "Cancel page break", keys: ["Esc"] },
    ],
  },
];

interface PropertiesSidebarProps {
  selectedElements: ElementInfo[];
  onApplyStyle: (property: string, value: string) => void;
  onAlignElements?: (align: AlignMode) => void;
  onDelete?: () => void;
  onUndo?: () => void;
  onRedo?: () => void;
  splitMode?: boolean;
  hasPageBreak?: boolean;
  pageBreakCount?: number;
  onToggleSplitMode?: () => void;
  onClearPageBreak?: () => void;
  pageCount?: number;
  currentPage?: number;
  onMoveToPage?: (pageIndex: number) => void;
  onDeletePage?: (pageIndex: number) => void;
}

export function PropertiesSidebar({
  selectedElements,
  onApplyStyle,
  onAlignElements,
  onDelete,
  onUndo,
  onRedo,
  splitMode = false,
  hasPageBreak = false,
  pageBreakCount = 0,
  onToggleSplitMode,
  onClearPageBreak,
  pageCount = 1,
  currentPage = 0,
  onMoveToPage,
  onDeletePage,
}: PropertiesSidebarProps) {
  const first = selectedElements[0];
  const s = first?.styles;
  const count = selectedElements.length;
  const hasSelection = count > 0;
  // The document container (body/html or the template's system frame -
  // .scroll-wrapper / .klone-frame) is STICKY: its W control is disabled
  // (locked width) and X/Y position is locked too, so the page frame can
  // never be moved.
  const isContainerSel =
    !!first &&
    (first.tag === "html" ||
      first.tag === "body" ||
      ["scroll-wrapper", "klone-frame"].some((cls) =>
        String(first.classes || "")
          .split(" ")
          .includes(cls),
      ));

  // Element display name (Figma-style)
  const elementName = !first
    ? "No selection"
    : first.tag === "div"
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
                : first.tag.charAt(0).toUpperCase() + first.tag.slice(1);

  // Current translate (X/Y) from the element's transform
  const translate = s?.transform
    ? parseTranslate(s.transform)
    : ([0, 0] as [number, number]);

  // Format numbers without trailing decimals (12.5 stays 12.5, 12.0 → 12)
  const fmtNum = (n: number) => (Math.round(n * 10) / 10).toString();

  // Rotation / flip helpers (compose with the existing translate transform).
  const rotation = Math.round(parseFloat(s?.rotate || "0")) || 0;
  const scaleX = parseFloat(s?.scaleX || "1");
  const scaleY = parseFloat(s?.scaleY || "1");
  const applyRotation = (deg: number) => onApplyStyle("rotate", `${deg}deg`);
  const flipHorizontal = () => onApplyStyle("scaleX", String(scaleX * -1));
  const flipVertical = () => onApplyStyle("scaleY", String(scaleY * -1));
  const rotate90 = () => applyRotation((rotation + 90) % 360);

  return (
    <div className="w-64 shrink-0 h-full flex flex-col bg-[#161617] select-none overflow-hidden">
      {/* ── Scrollable properties area (panel padding 14px) ── */}
      <div className="flex-1 overflow-y-auto custom-scroll px-3.5 py-3.5">
        {!hasSelection && (
          <div className="flex h-full flex-col p-3">
            {/* Keyboard shortcuts */}
            <div className="mb-3.5 flex items-center gap-2">
              <Keyboard className="h-3.5 w-3.5 text-[#52525b]" />
              <span className="text-[10px] font-semibold uppercase tracking-[0.08em] text-[#6f6f6f]">
                Keyboard shortcuts
              </span>
            </div>

            {SHORTCUT_GROUPS.map((group) => (
              <div key={group.title} className="mb-4">
                <p className="mb-1.5 text-[9.5px] font-semibold uppercase tracking-[0.08em] text-[#4a4a4a]">
                  {group.title}
                </p>
                <div className="space-y-[5px]">
                  {group.items.map((item) => (
                    <div
                      key={item.label}
                      className="flex items-center justify-between gap-2"
                    >
                      <span className="min-w-0 flex-1 truncate text-[10.5px] text-[#71717a]">
                        {item.label}
                      </span>
                      <span className="flex flex-none items-center gap-[3px]">
                        {item.keys.map((key, i) => (
                          <kbd
                            key={i}
                            className="rounded-[4px] border border-[#262626] bg-[#1a1a1a] px-[5px] py-[2px] font-mono text-[8.5px] font-medium leading-[12px] text-[#8f8f8f]"
                          >
                            {key}
                          </kbd>
                        ))}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {hasSelection && s && (
          <div className="w-full">
            {/* ── Header: element name + actions ── */}
            <div className="flex items-center justify-between pb-3">
              <span className="text-[14px] font-semibold text-[#ffffff] truncate">
                {elementName}
                {count > 1 ? ` · ${count}` : ""}
              </span>
              <div className="flex items-center gap-0.5 shrink-0">
                <button
                  type="button"
                  title="Undo (⌘Z)"
                  onClick={onUndo}
                  className="flex size-6 shrink-0 cursor-pointer items-center justify-center rounded border-none bg-transparent p-0 text-[#888888] outline-none transition-colors hover:bg-[#353535] hover:text-[#f0f0f0]"
                >
                  <Undo2 className="size-3.5" />
                </button>
                <button
                  type="button"
                  title="Redo (⌘⇧Z)"
                  onClick={onRedo}
                  className="flex size-6 shrink-0 cursor-pointer items-center justify-center rounded border-none bg-transparent p-0 text-[#888888] outline-none transition-colors hover:bg-[#353535] hover:text-[#f0f0f0]"
                >
                  <Redo2 className="size-3.5" />
                </button>
                <button
                  type="button"
                  title={
                    splitMode
                      ? "Cancel PDF page break selection"
                      : hasPageBreak
                        ? `Manage PDF page breaks (${pageBreakCount})`
                        : "Add PDF page break"
                  }
                  onClick={onToggleSplitMode}
                  className={`relative flex size-6 shrink-0 cursor-pointer items-center justify-center rounded border-none p-0 outline-none transition-colors hover:bg-[#353535] hover:text-[#f0f0f0] ${
                    splitMode ? "text-[#3b82f6]" : "text-[#888888]"
                  }`}
                >
                  <svg width="15" height="15" viewBox="0 0 16 16" className="size-3.5">
                    <path d="M9.5 2.5L13.5 6.5L8 12h-4v-4z M3.5 13.5l3-3" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round" />
                  </svg>
                  {hasPageBreak && (
                    <span className="absolute -top-0.5 -right-0.5 min-w-[14px] h-[14px] px-1 rounded-full bg-[#18a0fb] text-white text-[9px] leading-[14px] text-center">
                      {pageBreakCount}
                    </span>
                  )}
                </button>
                {hasPageBreak && (
                  <button
                    type="button"
                    title={`Remove all PDF page breaks (${pageBreakCount})`}
                    onClick={onClearPageBreak}
                    className="flex size-6 shrink-0 cursor-pointer items-center justify-center rounded border-none bg-transparent p-0 text-[#888888] outline-none transition-colors hover:bg-[#353535] hover:text-[#f0f0f0]"
                  >
                    <svg width="15" height="15" viewBox="0 0 16 16" className="size-3.5">
                      <path d="M3 4.5L13 11.5M13 4.5L3 11.5" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
                    </svg>
                  </button>
                )}
              </div>
            </div>

            {/* ── Position ── */}
            <div className="py-3.5 border-b border-[#3a3a3a]">
              <div className="text-[11px] font-semibold text-[#f0f0f0] mb-3">
                Position
              </div>

              <div
                role="toolbar"
                aria-label="Align"
                className="mb-1.5 flex justify-between"
              >
                <div className="flex gap-0.5">
                  <button
                    type="button"
                    title="Align left"
                    onClick={() => onAlignElements?.("left")}
                    className="flex size-6 shrink-0 cursor-pointer items-center justify-center rounded border-none bg-transparent p-0 text-[#888888] outline-none transition-colors hover:bg-[#353535] hover:text-[#f0f0f0]"
                  >
                    <AlignStartVertical className="size-3.5" />
                  </button>
                  <button
                    type="button"
                    title="Align center horizontally"
                    onClick={() => onAlignElements?.("center-x")}
                    className="flex size-6 shrink-0 cursor-pointer items-center justify-center rounded border-none bg-transparent p-0 text-[#888888] outline-none transition-colors hover:bg-[#353535] hover:text-[#f0f0f0]"
                  >
                    <AlignCenterVertical className="size-3.5" />
                  </button>
                  <button
                    type="button"
                    title="Align right"
                    onClick={() => onAlignElements?.("right")}
                    className="flex size-6 shrink-0 cursor-pointer items-center justify-center rounded border-none bg-transparent p-0 text-[#888888] outline-none transition-colors hover:bg-[#353535] hover:text-[#f0f0f0]"
                  >
                    <AlignEndVertical className="size-3.5" />
                  </button>
                </div>
                <div className="flex gap-0.5">
                  <button
                    type="button"
                    title="Align top"
                    onClick={() => onAlignElements?.("top")}
                    className="flex size-6 shrink-0 cursor-pointer items-center justify-center rounded border-none bg-transparent p-0 text-[#888888] outline-none transition-colors hover:bg-[#353535] hover:text-[#f0f0f0]"
                  >
                    <AlignStartHorizontal className="size-3.5" />
                  </button>
                  <button
                    type="button"
                    title="Align center vertically"
                    onClick={() => onAlignElements?.("center-y")}
                    className="flex size-6 shrink-0 cursor-pointer items-center justify-center rounded border-none bg-transparent p-0 text-[#888888] outline-none transition-colors hover:bg-[#353535] hover:text-[#f0f0f0]"
                  >
                    <AlignCenterHorizontal className="size-3.5" />
                  </button>
                  <button
                    type="button"
                    title="Align bottom"
                    onClick={() => onAlignElements?.("bottom")}
                    className="flex size-6 shrink-0 cursor-pointer items-center justify-center rounded border-none bg-transparent p-0 text-[#888888] outline-none transition-colors hover:bg-[#353535] hover:text-[#f0f0f0]"
                  >
                    <AlignEndHorizontal className="size-3.5" />
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 items-center gap-1.5">
                <NumberField
                  className="flex-1 min-w-0"
                  prefix="X"
                  disabled={isContainerSel}
                  value={fmtNum(translate[0])}
                  onChange={(v) =>
                    onApplyStyle(
                      "transform",
                      `translate(${v}px, ${translate[1]}px)`,
                    )
                  }
                />
                <NumberField
                  className="flex-1 min-w-0"
                  prefix="Y"
                  disabled={isContainerSel}
                  value={fmtNum(translate[1])}
                  onChange={(v) =>
                    onApplyStyle(
                      "transform",
                      `translate(${translate[0]}px, ${v}px)`,
                    )
                  }
                />
              </div>

              <div className="mt-1.5 grid grid-cols-2 items-center gap-1.5">
                <NumberField
                  icon={<RotateCw className="size-3" />}
                  suffix="°"
                  min={-360}
                  max={360}
                  value={rotation}
                  onChange={(v) => applyRotation(parseFloat(v || "0"))}
                />
                <div className="flex h-6 items-center justify-end gap-0.5">
                  <button
                    type="button"
                    title="Flip horizontal"
                    onClick={flipHorizontal}
                    className="flex size-6 shrink-0 cursor-pointer items-center justify-center rounded border-none bg-transparent p-0 text-[#888888] outline-none transition-colors hover:bg-[#353535] hover:text-[#f0f0f0]"
                  >
                    <FlipHorizontal2 className="size-3.5" />
                  </button>
                  <button
                    type="button"
                    title="Flip vertical"
                    onClick={flipVertical}
                    className="flex size-6 shrink-0 cursor-pointer items-center justify-center rounded border-none bg-transparent p-0 text-[#888888] outline-none transition-colors hover:bg-[#353535] hover:text-[#f0f0f0]"
                  >
                    <FlipVertical2 className="size-3.5" />
                  </button>
                  <button
                    type="button"
                    title="Rotate 90°"
                    onClick={rotate90}
                    className="flex size-6 shrink-0 cursor-pointer items-center justify-center rounded border-none bg-transparent p-0 text-[#888888] outline-none transition-colors hover:bg-[#353535] hover:text-[#f0f0f0]"
                  >
                    <RotateCwSquare className="size-3.5" />
                  </button>
                </div>
              </div>
            </div>

            {/* ── Layout ── */}
            <LayoutSection
              styles={s}
              onApplyStyle={onApplyStyle}
              container={isContainerSel}
              text={first?.tag === "span" || first?.tag === "p" || first?.tag === "h1" || first?.tag === "button"}
            />

            {/* ── Appearance ── */}
            <AppearanceSection styles={s} onApplyStyle={onApplyStyle} />

            {/* ── Stroke ── */}
            <StrokeSection styles={s} onApplyStyle={onApplyStyle} />

            {/* ── Fill (open-pencil clone) ── */}
            <FillSection styles={s} onApplyStyle={onApplyStyle} />

            {/* ── Effects ── */}
            <EffectsSection styles={s} onApplyStyle={onApplyStyle} />

            {/* ── Typography ── */}
            <TypographyPanel styles={s} onApplyStyle={onApplyStyle} />

            {/* ── Pages ── */}
            {onMoveToPage && pageCount > 0 && !isContainerSel && (
              <div className="py-3.5">
                <div className="text-[11px] font-semibold text-[#f0f0f0] mb-3">
                  Pages
                </div>
                <div className="space-y-2">
                  <span className="block text-[10px] text-[#71717a]">
                    On page {currentPage + 1} of {pageCount}
                  </span>

                  {/* Page list: every page shown with a delete button. Page
                      1 is the root canvas and cannot be deleted. Selecting a
                      page moves the current selection onto it (+ New page
                      appends a fresh page). */}
                  <div className="space-y-1">
                    {Array.from({ length: pageCount }, (_, i) => {
                      const isCurrent = i === currentPage;
                      return (
                        <div
                          key={i}
                          className={
                            "group flex items-center justify-between gap-2 px-2 py-1.5 rounded-[6px] text-[11px] transition-colors " +
                            (isCurrent
                              ? "bg-[#8b5cf6]/15 text-[#c4b5fd]"
                              : "text-[#9b9b9b] hover:bg-white/5")
                          }
                        >
                          <button
                            type="button"
                            disabled={!onMoveToPage}
                            onClick={() =>
                              onMoveToPage && onMoveToPage(i)
                            }
                            className="flex-1 text-left truncate"
                            title="Move selection to this page"
                          >
                            Page {i + 1}
                            {i === currentPage ? " (current)" : ""}
                          </button>
                          {i > 0 && onDeletePage && (
                            <button
                              type="button"
                              onClick={() => onDeletePage(i)}
                              title="Delete this page and everything on it"
                              className="flex items-center justify-center w-5 h-5 rounded-[5px] text-[#71717a] hover:text-red-400 hover:bg-red-500/10 transition-colors"
                            >
                              <DeleteIcon />
                            </button>
                          )}
                        </div>
                      );
                    })}
                    <button
                      type="button"
                      disabled={!onMoveToPage}
                      onClick={() => onMoveToPage && onMoveToPage(-1)}
                      className="flex items-center justify-center w-full py-1.5 rounded-[6px] text-[10px] text-[#9b9b9b] hover:text-[#c4b5fd] hover:bg-white/5 transition-colors"
                    >
                      + New page
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* ── Delete ── */}
            {onDelete && (
              <div className="pt-3.5 mt-1 border-t border-[rgba(255,255,255,0.08)]">
                <button
                  type="button"
                  onClick={onDelete}
                  className="flex items-center justify-center gap-1.5 w-full py-1.5 rounded-[6px] text-[11px] text-[#9b9b9b] hover:text-red-400 hover:bg-red-500/10 transition-colors"
                >
                  <DeleteIcon />
                  <span>Delete</span>
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
