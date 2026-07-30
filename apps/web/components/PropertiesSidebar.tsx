"use client";

import { useState, useCallback, useRef, useEffect, type SVGProps } from "react";
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

/* ─── Visual Number Input ─── */

function VisualNumberInput({
  value,
  onChange,
  suffix = "",
  min,
  max,
  compact = false,
  className = "",
}: {
  value: string | number;
  onChange: (val: string) => void;
  suffix?: string;
  min?: number;
  max?: number;
  compact?: boolean;
  className?: string;
}) {
  const strValue = String(value ?? "");
  const [local, setLocal] = useState(strValue);
  const composing = useRef(false);
  const lastCommitted = useRef(strValue);

  // Sync from parent only when the user isn't typing
  useEffect(() => {
    if (!composing.current && value !== undefined) {
      const v = String(value);
      if (v !== local) {
        setLocal(v);
        lastCommitted.current = v;
      }
    }
  }, [value]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = e.target.value;
    setLocal(v);
    // Only commit valid numbers to avoid pushing garbage upstream
    if (v === "" || v === "-" || /^\d*\.?\d*$/.test(v)) {
      onChange(v || "0");
      lastCommitted.current = v || "0";
    }
  };

  const handleBlur = () => {
    // Commit final value on blur (handles edge cases like partial edits)
    const v = local || "0";
    if (v !== lastCommitted.current) {
      onChange(v);
      lastCommitted.current = v;
    }
  };

  return (
    <div className={`flex items-center gap-0.5 ${className}`}>
      <input
        type="text"
        inputMode="numeric"
        value={local}
        onChange={handleChange}
        onBlur={handleBlur}
        onCompositionStart={() => {
          composing.current = true;
        }}
        onCompositionEnd={(e) => {
          composing.current = false;
          const v = (e.target as HTMLInputElement).value || "0";
          onChange(v);
          lastCommitted.current = v;
        }}
        className={`min-w-0 rounded bg-[#2d2d30] border border-[#3f3f46] text-[#e4e4e7] text-[11px] text-center font-mono focus:border-[#18a0fb] focus:outline-none transition-colors ${
          compact ? "w-10 px-1 py-1" : "w-full px-2 py-1"
        }`}
      />
      {suffix && (
        <span className="text-[10px] text-[#52525b] font-mono w-4 shrink-0">
          {suffix}
        </span>
      )}
    </div>
  );
}

/* ─── Visual Padding Control (Figma-style cross layout) ─── */

function PaddingIcon() {
  return (
    <svg
      className="w-8 h-8 text-[#52525b]"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.2}
    >
      <rect x="3" y="3" width="18" height="18" rx="2" />
      <rect x="7" y="7" width="10" height="10" rx="1" strokeDasharray="2 2" />
      <path
        strokeLinecap="round"
        d="M12 3v2M12 19v2M3 12h2M19 12h2"
        strokeWidth={1.5}
      />
    </svg>
  );
}

function VisualPaddingControl({
  paddingTop,
  paddingRight,
  paddingBottom,
  paddingLeft,
  onPaddingChange,
}: {
  paddingTop: string;
  paddingRight: string;
  paddingBottom: string;
  paddingLeft: string;
  onPaddingChange: (property: string, value: string) => void;
}) {
  const [linked, setLinked] = useState(true);

  const pt = cssPx(paddingTop);
  const pr = cssPx(paddingRight);
  const pb = cssPx(paddingBottom);
  const pl = cssPx(paddingLeft);

  const handleChange = (side: string, val: string) => {
    const numVal = parseFloat(val) || 0;
    const propMap: Record<string, string> = {
      top: "paddingTop",
      right: "paddingRight",
      bottom: "paddingBottom",
      left: "paddingLeft",
    };
    if (linked) {
      onPaddingChange("padding", numVal + "px");
    } else {
      onPaddingChange(propMap[side], numVal + "px");
    }
  };

  const allEqual = pt === pr && pr === pb && pb === pl;
  const centerValue = allEqual ? pt : null;

  return (
    <div className="w-full flex flex-col items-center">
      {/* Top — T label above input */}
      <div className="flex flex-col items-center gap-0.5 mb-1">
        <span className="text-[9px] text-[#71717a] font-mono w-3 text-center shrink-0">
          T
        </span>
        <VisualNumberInput
          value={pt}
          onChange={(v) => handleChange("top", v)}
          compact
        />
      </div>

      {/* Middle row: L input — center icon — R input */}
      <div className="flex items-center gap-2 w-full">
        {/* Left — L label before input */}
        <div className="flex-1 flex items-center justify-end gap-1">
          <span className="text-[9px] text-[#71717a] font-mono w-3 text-center shrink-0">
            L
          </span>
          <VisualNumberInput
            value={pl}
            onChange={(v) => handleChange("left", v)}
            compact
          />
        </div>

        {/* Center icon — fixed size, stays centered */}
        <div className="relative flex flex-col items-center justify-center shrink-0">
          <div className="relative flex items-center justify-center">
            <PaddingIcon />
            <button
              onClick={() => setLinked(!linked)}
              className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-4 h-4 flex items-center justify-center rounded transition-colors ${
                linked
                  ? "text-[#18a0fb]"
                  : "text-[#52525b] hover:text-[#a1a1aa]"
              }`}
              title={linked ? "Unlink padding values" : "Link padding values"}
            >
              <svg
                className="w-3 h-3"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                {linked ? (
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"
                  />
                ) : (
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M6 18L18 6M6 6l12 12"
                  />
                )}
              </svg>
            </button>
          </div>
          {linked && centerValue !== null && (
            <span className="text-[9px] text-[#52525b] font-mono mt-0.5">
              {centerValue}px
            </span>
          )}
        </div>

        {/* Right — input then R label */}
        <div className="flex-1 flex items-center justify-start gap-1">
          <VisualNumberInput
            value={pr}
            onChange={(v) => handleChange("right", v)}
            compact
          />
          <span className="text-[9px] text-[#71717a] font-mono w-3 text-center shrink-0">
            R
          </span>
        </div>
      </div>

      {/* Bottom — input then B label below */}
      <div className="flex flex-col items-center gap-0.5 mt-1">
        <VisualNumberInput
          value={pb}
          onChange={(v) => handleChange("bottom", v)}
          compact
        />
        <span className="text-[9px] text-[#71717a] font-mono w-3 text-center shrink-0">
          B
        </span>
      </div>
    </div>
  );
}

/* ─── Visual Slider Input (for W/H) ─── */

function VisualSliderInput({
  label,
  value,
  max = 800,
  onChange,
}: {
  label: string;
  value: string | number;
  max?: number;
  onChange: (val: string) => void;
}) {
  const numValue = typeof value === "string" ? parseFloat(value) || 0 : value;
  const pct = Math.min(100, Math.max(0, (numValue / max) * 100));

  return (
    <div className="flex items-center gap-2">
      <span className="text-[10px] text-[#71717a] font-mono w-4 text-center">
        {label}
      </span>
      <div className="flex-1 flex items-center gap-1.5">
        {/* Visual bar track */}
        <div className="flex-1 h-2 rounded-full bg-[#2d2d30] overflow-hidden cursor-pointer relative">
          <div
            className="h-full rounded-full bg-[#18a0fb] transition-[width] duration-100 ease-out"
            style={{ width: `${pct}%` }}
          />
        </div>
        {/* Number input with steppers */}
        <VisualNumberInput
          value={String(numValue)}
          onChange={onChange}
          suffix=""
          min={0}
          compact
        />
      </div>
    </div>
  );
}

/* ─── Visual Color Picker ─── */

const PRESET_COLORS = [
  "#000000",
  "#ffffff",
  "#f87171",
  "#fb923c",
  "#facc15",
  "#4ade80",
  "#34d399",
  "#22d3ee",
  "#60a5fa",
  "#818cf8",
  "#a78bfa",
  "#c084fc",
  "#f472b6",
  "#fb7185",
  "#78716c",
  "#a1a1aa",
  "#52525b",
  "#27272a",
];

function VisualColorPicker({
  color,
  opacity = 100,
  onChange,
  onOpacityChange,
}: {
  color: string;
  opacity?: number;
  onChange: (color: string) => void;
  onOpacityChange?: (opacity: number) => void;
}) {
  const [hexInput, setHexInput] = useState(color.toUpperCase());
  const colorPickerRef = useRef<HTMLInputElement>(null);

  // Sync hex input when color changes externally
  useEffect(() => {
    setHexInput(color.toUpperCase());
  }, [color]);

  return (
    <div className="space-y-2">
      {/* Color swatch + hex + opacity row */}
      <div className="flex items-center gap-2">
        {/* Color swatch (click to open native picker) */}
        <button
          onClick={() => colorPickerRef.current?.click()}
          className="relative w-8 h-8 rounded border border-[#3f3f46] overflow-hidden shrink-0 cursor-pointer"
          title="Click to change color"
        >
          <div className="w-full h-full" style={{ backgroundColor: color }} />
          <input
            ref={colorPickerRef}
            type="color"
            value={color}
            onChange={(e) => {
              onChange(e.target.value);
              setHexInput(e.target.value.toUpperCase());
            }}
            className="absolute inset-0 opacity-0 cursor-pointer w-0 h-0"
          />
        </button>

        {/* Hex input */}
        <div className="flex-1">
          <input
            type="text"
            value={hexInput}
            onChange={(e) => {
              const val = e.target.value;
              setHexInput(val);
              if (/^#[0-9a-fA-F]{6}$/.test(val)) {
                onChange(val);
              }
            }}
            onBlur={() => {
              // Reset to actual color on blur if invalid
              if (!/^#[0-9a-fA-F]{6}$/.test(hexInput)) {
                setHexInput(color.toUpperCase());
              }
            }}
            className="w-full px-2 py-1 rounded bg-[#2d2d30] border border-[#3f3f46] text-[#e4e4e7] text-[11px] font-mono uppercase focus:border-[#18a0fb] focus:outline-none transition-colors"
          />
        </div>

        {/* Opacity */}
        {onOpacityChange && (
          <div className="flex items-center gap-1">
            <input
              type="number"
              value={opacity}
              onChange={(e) =>
                onOpacityChange(
                  Math.min(100, Math.max(0, Number(e.target.value))),
                )
              }
              min={0}
              max={100}
              className="w-12 px-1.5 py-1 rounded bg-[#2d2d30] border border-[#3f3f46] text-[#e4e4e7] text-[11px] text-center font-mono [appearance:textfield] [&::-webkit-inner-spin-button]:hidden [&::-webkit-outer-spin-button]:hidden focus:border-[#18a0fb] focus:outline-none transition-colors"
            />
            <span className="text-[9px] text-[#52525b] font-mono">%</span>
          </div>
        )}
      </div>

      {/* Preset color palette */}
      <div className="flex flex-wrap gap-1">
        {PRESET_COLORS.map((c) => (
          <button
            key={c}
            onClick={() => {
              onChange(c);
              setHexInput(c.toUpperCase());
            }}
            className={`w-5 h-5 rounded-full border transition-all ${
              c.toUpperCase() === color.toUpperCase()
                ? "border-[#18a0fb] ring-1 ring-[#18a0fb] scale-110"
                : "border-[#3f3f46] hover:border-[#71717a]"
            }`}
            style={{ backgroundColor: c }}
            title={c}
          />
        ))}
      </div>
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
              {/* Visual padding control */}
              <VisualPaddingControl
                paddingTop={s.paddingTop || "0"}
                paddingRight={s.paddingRight || "0"}
                paddingBottom={s.paddingBottom || "0"}
                paddingLeft={s.paddingLeft || "0"}
                onPaddingChange={(prop, val) => onApplyStyle(prop, val)}
              />

              {/* Rotation */}
              <div className="flex items-center gap-2">
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
                <VisualNumberInput
                  value={cssPx(s.rotate) || 0}
                  onChange={(v) => onApplyStyle("rotate", v + "deg")}
                  suffix="°"
                />
              </div>
            </Section>

            {/* ── Layout section ── */}
            <Section label="Layout">
              <VisualSliderInput
                label="W"
                value={cssPx(s.width) || 0}
                onChange={(v) => onApplyStyle("width", v + "px")}
              />
              <VisualSliderInput
                label="H"
                value={cssPx(s.height) || 0}
                onChange={(v) => onApplyStyle("height", v + "px")}
              />
            </Section>

            {/* ── Appearance section ── */}
            <Section label="Appearance">
              <div className="flex items-center gap-2">
                <span className="text-[10px] text-[#71717a] font-mono w-12 shrink-0">
                  Opacity
                </span>
                <VisualNumberInput
                  value={
                    s.opacity ? Math.round(parseFloat(s.opacity) * 100) : 100
                  }
                  onChange={(v) =>
                    onApplyStyle(
                      "opacity",
                      String(Math.min(100, Math.max(0, Number(v))) / 100),
                    )
                  }
                  suffix="%"
                  min={0}
                  max={100}
                />
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] text-[#71717a] font-mono w-12 shrink-0">
                  Radius
                </span>
                <VisualNumberInput
                  value={cssPx(s.borderRadius) || 0}
                  onChange={(v) => onApplyStyle("borderRadius", v + "px")}
                  suffix="px"
                  min={0}
                />
              </div>
            </Section>

            {/* ── Fill section ── */}
            <Section label="Fill" onAdd={() => {}}>
              <VisualColorPicker
                color={parseRgbToHex(s.backgroundColor)}
                opacity={
                  s.opacity ? Math.round(parseFloat(s.opacity) * 100) : 100
                }
                onChange={(c) => onApplyStyle("backgroundColor", c)}
                onOpacityChange={(o) =>
                  onApplyStyle("opacity", String(o / 100))
                }
              />
            </Section>

            {/* ── Stroke section ── */}
            <Section label="Stroke" onAdd={() => {}}>
              <VisualColorPicker
                color={s.borderColor ? parseRgbToHex(s.borderColor) : "#a39e9e"}
                onChange={(c) => onApplyStyle("borderColor", c)}
              />
              <div className="flex items-center gap-2">
                <span className="text-[10px] text-[#71717a] font-mono w-14 shrink-0">
                  Weight
                </span>
                <VisualNumberInput
                  value={cssPx(s.borderWidth) || 1}
                  onChange={(v) => onApplyStyle("borderWidth", v + "px")}
                  suffix="px"
                  min={0}
                />
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
