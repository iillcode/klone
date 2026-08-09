"use client";

import type { ElementInfo, AlignMode } from "./HtmlPreview";
import { Keyboard } from "lucide-react";
import {
  cssPx,
  parseTranslate,
  parseRgbToHex,
  parseColorAlpha,
  withColorAlpha,
  gradientFirstColor,
  isTransparentColor,
} from "./utils/style-utils";
import {
  UndoIcon,
  RedoIcon,
  PageBreakIcon,
  ClearPageBreakIcon,
  AlignHLeftIcon,
  AlignHCenterIcon,
  AlignHRightIcon,
  AlignVTopIcon,
  AlignVMiddleIcon,
  AlignVBottomIcon,
  DeleteIcon,
} from "./icons/properties-icons";
import { NumberField } from "./ui/NumberField";
import { SelectField } from "./ui/SelectField";
import { IconBtn, BtnGroup, SqBtn } from "./ui/IconButton";
import { FieldBlock, Section, ColorRow } from "./ui/Fields";
import { TypographyPanel } from "./ui/TypographyPanel";

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

  // The element's VISIBLE background color. A background-image (gradient /
  // image) paints OVER background-color, so when one is present we surface
  // its first color stop; otherwise fall back to background-color.
  const visibleBg =
    gradientFirstColor(s?.backgroundImage) ?? s?.backgroundColor;
  const bgColor = isTransparentColor(visibleBg)
    ? ""
    : parseRgbToHex(visibleBg);
  const bgOpacity = parseColorAlpha(visibleBg);
  const txtColor = isTransparentColor(s?.color)
    ? ""
    : parseRgbToHex(s?.color);
  const txtOpacity = parseColorAlpha(s?.color);

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
                <IconBtn title="Undo (⌘Z)" onClick={onUndo}>
                  <UndoIcon />
                </IconBtn>
                <IconBtn title="Redo (⌘⇧Z)" onClick={onRedo}>
                  <RedoIcon />
                </IconBtn>
                <IconBtn
                  title={
                    splitMode
                      ? "Cancel PDF page break selection"
                      : hasPageBreak
                        ? `Manage PDF page breaks (${pageBreakCount})`
                        : "Add PDF page break"
                  }
                  onClick={onToggleSplitMode}
                  active={splitMode}
                  className="relative"
                >
                  <PageBreakIcon />
                  {hasPageBreak && (
                    <span className="absolute -top-0.5 -right-0.5 min-w-[14px] h-[14px] px-1 rounded-full bg-[#18a0fb] text-white text-[9px] leading-[14px] text-center">
                      {pageBreakCount}
                    </span>
                  )}
                </IconBtn>
                {hasPageBreak && (
                  <IconBtn
                    title={`Remove all PDF page breaks (${pageBreakCount})`}
                    onClick={onClearPageBreak}
                  >
                    <ClearPageBreakIcon />
                  </IconBtn>
                )}
              </div>
            </div>

            {/* ── Position ── */}
            <Section title="Position">
              <FieldBlock label="Alignment">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <BtnGroup>
                    <SqBtn
                      title="Align left"
                      onClick={() => onAlignElements?.("left")}
                    >
                      <AlignHLeftIcon />
                    </SqBtn>
                    <SqBtn
                      title="Align center"
                      onClick={() => onAlignElements?.("center-x")}
                    >
                      <AlignHCenterIcon />
                    </SqBtn>
                    <SqBtn
                      title="Align right"
                      onClick={() => onAlignElements?.("right")}
                    >
                      <AlignHRightIcon />
                    </SqBtn>
                  </BtnGroup>
                  <BtnGroup>
                    <SqBtn
                      title="Align top"
                      onClick={() => onAlignElements?.("top")}
                    >
                      <AlignVTopIcon />
                    </SqBtn>
                    <SqBtn
                      title="Align middle"
                      onClick={() => onAlignElements?.("center-y")}
                    >
                      <AlignVMiddleIcon />
                    </SqBtn>
                    <SqBtn
                      title="Align bottom"
                      onClick={() => onAlignElements?.("bottom")}
                    >
                      <AlignVBottomIcon />
                    </SqBtn>
                  </BtnGroup>
                </div>
              </FieldBlock>

              <FieldBlock label="Position">
                <div className="flex items-center gap-1.5">
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
              </FieldBlock>
            </Section>

            {/* ── Layout ── */}
            <Section title="Layout">
              <FieldBlock label="Dimensions">
                <div className="flex items-center gap-1.5">
                  <NumberField
                    className="flex-1 min-w-0"
                    prefix="W"
                    disabled={isContainerSel}
                    value={cssPx(s.width) || 0}
                    onChange={(v) => onApplyStyle("width", v + "px")}
                  />
                  <NumberField
                    className="flex-1 min-w-0"
                    prefix="H"
                    value={cssPx(s.height) || 0}
                    onChange={(v) => onApplyStyle("height", v + "px")}
                  />
                </div>
              </FieldBlock>
            </Section>

            {/* ── Color ── */}
            <Section title="Color">
              <ColorRow
                label="Text"
                color={txtColor}
                opacity={txtOpacity}
                onChange={(c) => {
                  // If the incoming value already carries an alpha (color
                  // picker alpha slider), use it as-is. Otherwise keep the
                  // current opacity — unless there is no base color yet,
                  // in which case the new color shows at full opacity.
                  const cAlpha = parseColorAlpha(c);
                  onApplyStyle(
                    "color",
                    cAlpha < 1 || !txtColor
                      ? c
                      : withColorAlpha(c, txtOpacity),
                  );
                }}
                onOpacityChange={(a) => {
                  if (!txtColor) return;
                  onApplyStyle("color", withColorAlpha(txtColor, a));
                }}
              />
              <ColorRow
                label="Background"
                color={bgColor}
                opacity={bgOpacity}
                onChange={(c) => {
                  const cAlpha = parseColorAlpha(c);
                  onApplyStyle(
                    "backgroundColor",
                    cAlpha < 1 || !bgColor
                      ? c
                      : withColorAlpha(c, bgOpacity),
                  );
                }}
                onOpacityChange={(a) => {
                  if (!bgColor) return;
                  onApplyStyle("backgroundColor", withColorAlpha(bgColor, a));
                }}
              />
            </Section>

            {/* ── Typography ── */}
            <TypographyPanel styles={s} onApplyStyle={onApplyStyle} />

            {/* ── Pages ── */}
            {onMoveToPage && pageCount > 0 && !isContainerSel && (
              <Section title="Pages" noBorder>
                <div className="space-y-2">
                  <span className="block text-[10px] text-[#71717a]">
                    On page {currentPage + 1} of {pageCount}
                  </span>
                  <SelectField
                    title="Move to page"
                    value={String(currentPage)}
                    onChange={(v) => {
                      const target = v === "-1" ? -1 : parseInt(v, 10);
                      if (Number.isNaN(target) || target === currentPage)
                        return;
                      onMoveToPage(target);
                    }}
                    options={[
                      ...Array.from({ length: pageCount }, (_, i) => ({
                        value: String(i),
                        label: `Page ${i + 1}${
                          i === currentPage ? " (current)" : ""
                        }`,
                      })),
                      { value: "-1", label: "+ New page" },
                    ]}
                  />
                </div>
              </Section>
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
