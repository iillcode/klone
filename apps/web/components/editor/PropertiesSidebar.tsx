"use client";

import type { ElementInfo } from "./HtmlPreview";
import {
  cssPx,
  parseTranslate,
  parseRgbToHex,
  gradientFirstColor,
  isTransparentColor,
} from "./utils/style-utils";
import { FONT_FAMILIES, FONT_WEIGHTS } from "./constants";
import {
  UndoIcon,
  RedoIcon,
  PageBreakIcon,
  ClearPageBreakIcon,
  AlignLeftIcon,
  AlignCenterIcon,
  AlignRightIcon,
  TextAlignIcon,
  DeleteIcon,
} from "./icons/properties-icons";
import { NumberField } from "./ui/NumberField";
import { SelectField } from "./ui/SelectField";
import { IconBtn, BtnGroup, SqBtn } from "./ui/IconButton";
import { FieldBlock, Section, ColorRow } from "./ui/Fields";

interface PropertiesSidebarProps {
  selectedElements: ElementInfo[];
  onApplyStyle: (property: string, value: string) => void;
  onDelete?: () => void;
  onUndo?: () => void;
  onRedo?: () => void;
  splitMode?: boolean;
  hasPageBreak?: boolean;
  pageBreakCount?: number;
  onToggleSplitMode?: () => void;
  onClearPageBreak?: () => void;
}

export function PropertiesSidebar({
  selectedElements,
  onApplyStyle,
  onDelete,
  onUndo,
  onRedo,
  splitMode = false,
  hasPageBreak = false,
  pageBreakCount = 0,
  onToggleSplitMode,
  onClearPageBreak,
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

  // Normalize computed text-align (start/end → left/right)
  const rawAlign = s?.textAlign || "left";
  const alignValue =
    rawAlign === "start" ? "left" : rawAlign === "end" ? "right" : rawAlign;

  // Font weight dropdown value — surface the element's actual computed
  // weight, adding it to the option list when it's not one of the presets
  // (e.g. templates using 300, 800, etc. would otherwise collapse to 400).
  const rawWeight = s?.fontWeight;
  const weightPreset =
    rawWeight === "bold"
      ? "700"
      : rawWeight === "normal" || rawWeight === undefined || rawWeight === ""
        ? "400"
        : rawWeight;
  const weightOptions = FONT_WEIGHTS.some((w) => w.value === weightPreset)
    ? FONT_WEIGHTS
    : [{ value: weightPreset, label: weightPreset }, ...FONT_WEIGHTS];
  const weightValue = weightPreset;

  // Font family dropdown value — surface the element's actual computed
  // family, adding it to the option list when it's not one of the presets.
  const currentFamily = s?.fontFamily ?? "";
  const familyIsPreset = FONT_FAMILIES.some((f) => f.value === currentFamily);
  const fontOptions = familyIsPreset
    ? FONT_FAMILIES
    : [{ value: currentFamily, label: currentFamily }, ...FONT_FAMILIES];
  const fontFamily = currentFamily;

  // The element's VISIBLE background color. A background-image (gradient /
  // image) paints OVER background-color, so when one is present we surface
  // its first color stop; otherwise fall back to background-color.
  const visibleBg =
    gradientFirstColor(s?.backgroundImage) ?? s?.backgroundColor;
  const bgColor = isTransparentColor(visibleBg)
    ? ""
    : parseRgbToHex(visibleBg);
  const txtColor = isTransparentColor(s?.color)
    ? ""
    : parseRgbToHex(s?.color);

  return (
    <div className="w-64 shrink-0 h-full flex flex-col bg-[#161617] border-l border-[#2d2d2d] select-none overflow-hidden">
      {/* ── Scrollable properties area (panel padding 14px) ── */}
      <div className="flex-1 overflow-y-auto custom-scroll px-3.5 py-3.5">
        {!hasSelection && (
          <div className="flex items-center justify-center h-full px-6 text-center text-[11px] text-[#9b9b9b] leading-relaxed">
            Select an element
            <br />
            in the preview to edit
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
                <div className="flex items-center">
                  <BtnGroup>
                    <SqBtn
                      title="Align left"
                      active={alignValue === "left"}
                      onClick={() => onApplyStyle("textAlign", "left")}
                    >
                      <AlignLeftIcon />
                    </SqBtn>
                    <SqBtn
                      title="Align center"
                      active={alignValue === "center"}
                      onClick={() => onApplyStyle("textAlign", "center")}
                    >
                      <AlignCenterIcon />
                    </SqBtn>
                    <SqBtn
                      title="Align right"
                      active={alignValue === "right"}
                      onClick={() => onApplyStyle("textAlign", "right")}
                    >
                      <AlignRightIcon />
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
                onChange={(c) => onApplyStyle("color", c)}
              />
              <ColorRow
                label="Background"
                color={bgColor}
                onChange={(c) => onApplyStyle("backgroundColor", c)}
              />
            </Section>

            {/* ── Typography ── */}
            <Section title="Typography" noBorder>
              <div className="space-y-2">
                <SelectField
                  title="Font family"
                  value={fontFamily}
                  onChange={(v) => onApplyStyle("fontFamily", v)}
                  options={fontOptions}
                  fontPreview
                />
                <div className="flex items-center gap-1.5">
                  <SelectField
                    title="Font weight"
                    grow
                    value={weightValue}
                    onChange={(v) => onApplyStyle("fontWeight", v)}
                    options={weightOptions}
                  />
                  <NumberField
                    className="flex-1 min-w-0"
                    value={cssPx(s.fontSize) || 18}
                    suffix="px"
                    min={0}
                    onChange={(v) => onApplyStyle("fontSize", v + "px")}
                  />
                </div>
                <FieldBlock label="Alignment">
                  <div className="flex items-center">
                    <BtnGroup>
                      <SqBtn
                        title="Align left"
                        active={alignValue === "left"}
                        onClick={() => onApplyStyle("textAlign", "left")}
                      >
                        <TextAlignIcon align="left" />
                      </SqBtn>
                      <SqBtn
                        title="Align center"
                        active={alignValue === "center"}
                        onClick={() => onApplyStyle("textAlign", "center")}
                      >
                        <TextAlignIcon align="center" />
                      </SqBtn>
                      <SqBtn
                        title="Align right"
                        active={alignValue === "right"}
                        onClick={() => onApplyStyle("textAlign", "right")}
                      >
                        <TextAlignIcon align="right" />
                      </SqBtn>
                    </BtnGroup>
                  </div>
                </FieldBlock>
              </div>
            </Section>

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
