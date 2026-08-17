"use client";

import { useEffect, useState, useRef } from "react";
import { Eye, EyeOff, Minus } from "lucide-react";
import { ColorPicker } from "./ColorPicker";
import { PanelSelect } from "./PanelSelect";
import { ScrubField } from "./ScrubField";

/* .field-block — 11px label + control (open-pencil tokens) */
export function FieldBlock({
  label,
  children,
  grow = false,
  className = "",
}: {
  label: string;
  children: React.ReactNode;
  grow?: boolean;
  className?: string;
}) {
  return (
    <div className={`${grow ? "flex-1 min-w-0" : ""} ${className}`}>
      <div className="text-[11px] leading-none text-[#888888] mb-1 select-none">{label}</div>
      {children}
    </div>
  );
}

/* .section — 11px/600 title row (+ optional header actions), open-pencil tokens */
export function Section({
  title,
  noBorder = false,
  headerIcons,
  children,
}: {
  title: string;
  noBorder?: boolean;
  headerIcons?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div
      className={`px-3 py-3.5 ${noBorder ? "" : "border-b border-[#3a3a3a]"}`}
    >
      {headerIcons ? (
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-semibold text-[#f0f0f0]">
            {title}
          </span>
          <div className="flex items-center gap-0.5">{headerIcons}</div>
        </div>
      ) : (
        <div className="text-[11px] font-semibold text-[#f0f0f0]">{title}</div>
      )}
      <div className="mt-3 space-y-3">{children}</div>
    </div>
  );
}

/* ─── Color row — exact open-pencil Fill item (PaintField + rail + blend) ─── */
const FILL_BLEND_OPTIONS = [
  { value: "NORMAL", label: "Normal" },
  { value: "MULTIPLY", label: "Multiply" },
  { value: "SCREEN", label: "Screen" },
  { value: "OVERLAY", label: "Overlay" },
  { value: "DARKEN", label: "Darken" },
  { value: "LIGHTEN", label: "Lighten" },
  { value: "COLOR_DODGE", label: "Color Dodge" },
  { value: "COLOR_BURN", label: "Color Burn" },
  { value: "HARD_LIGHT", label: "Hard Light" },
  { value: "SOFT_LIGHT", label: "Soft Light" },
  { value: "DIFFERENCE", label: "Difference" },
  { value: "EXCLUSION", label: "Exclusion" },
  { value: "HUE", label: "Hue" },
  { value: "SATURATION", label: "Saturation" },
  { value: "COLOR", label: "Color" },
  { value: "LUMINOSITY", label: "Luminosity" },
];

export function ColorRow({
  label,
  color,
  opacity = 1,
  hidden = false,
  blendMode = "NORMAL",
  index = 0,
  onChange,
  onOpacityChange,
  onToggleVisibility,
  onRemove,
  onBlendModeChange,
}: {
  label: string;
  color: string;
  opacity?: number;
  hidden?: boolean;
  blendMode?: string;
  /** Position of this fill in the section's item list (open-pencil data-index). */
  index?: number;
  onChange: (color: string) => void;
  onOpacityChange?: (opacity: number) => void;
  onToggleVisibility?: () => void;
  onRemove?: () => void;
  onBlendModeChange?: (mode: string) => void;
}) {
  // Open-pencil shows the hex WITHOUT the leading '#' (maxlength 6).
  const [hexInput, setHexInput] = useState(() =>
    color ? color.replace("#", "").toUpperCase() : "",
  );
  const [pickerOpen, setPickerOpen] = useState(false);
  const [pickerPos, setPickerPos] = useState({ left: 0, top: 0 });
  const swatchRef = useRef<HTMLButtonElement>(null);

  // Sync hex input when color changes externally (empty = transparent)
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setHexInput(color ? color.replace("#", "").toUpperCase() : "");
  }, [color]);

  const openPicker = () => {
    const r = swatchRef.current?.getBoundingClientRect();
    if (!r) return;
    // open-pencil popover: w-60 p-2; approximate rendered height for clamping.
    const W = 240;
    const H = 380;
    let left = r.left - W - 4;
    if (left < 8) left = r.right + 4;
    if (left + W > window.innerWidth - 8)
      left = Math.max(8, window.innerWidth - W - 8);
    let top = r.top - 4;
    if (top + H > window.innerHeight - 8)
      top = Math.max(8, window.innerHeight - H - 8);
    setPickerPos({ left, top });
    setPickerOpen(true);
  };

  const hasBase = !!color;
  const opacityPct = Math.round((opacity || 0) * 100);
  const hex6 = hexInput.replace("#", "").toUpperCase();

  return (
    <div
      data-slot="item"
      className="group grid min-h-6 grid-cols-[minmax(0,1fr)_auto] items-start gap-x-1.5 gap-y-1.5 py-0.5"
      data-property="fills"
      data-index={index}
    >
      {/* content */}
      <div className="flex min-w-0 items-center gap-1.5" data-slot="content">
        {/* open-pencil PaintField */}
        <div
          className="flex h-6 min-w-0 items-center overflow-hidden rounded border border-transparent bg-[#1e1e1e] text-[11px] transition-colors hover:bg-[#262626] focus-within:border-[#aef637] focus-within:bg-[#262626] w-full flex-none"
          data-slot="paint-field"
          data-property="paint"
        >
          <div className="flex shrink-0 items-center pl-1" data-slot="preview">
            <button
              type="button"
              ref={swatchRef}
              onClick={openPicker}
              className="size-4 shrink-0 cursor-pointer rounded-sm border-0 bg-transparent p-0"
              title={`Change ${label.toLowerCase()} color`}
              aria-label={label}
              data-test-id="fill-picker-swatch"
            >
              <span
                className="relative block size-full overflow-hidden rounded border border-[#3a3a3a] bg-[#3a3a3a] bg-[image:linear-gradient(45deg,#4a4a4a_25%,transparent_25%),linear-gradient(-45deg,#4a4a4a_25%,transparent_25%),linear-gradient(45deg,transparent_75%,#4a4a4a_75%),linear-gradient(-45deg,transparent_75%,#4a4a4a_75%)] bg-[size:8px_8px] bg-[position:0_0,0_4px,4px_-4px,-4px_0]"
                data-fill-type="SOLID"
                data-fill-category="SOLID"
                role="img"
                aria-roledescription="fill swatch"
                data-slot="swatch"
                style={
                  color
                    ? { ["--open-pencil-fill-swatch-background" as string]: color }
                    : undefined
                }
              >
                {color ? (
                  <span
                    className="pointer-events-none absolute inset-0"
                    style={{ backgroundColor: color, opacity: opacity }}
                  />
                ) : (
                  <span className="pointer-events-none absolute inset-0 border border-white/15" />
                )}
              </span>
            </button>
          </div>
          <div
            className="flex min-w-0 flex-1 items-center pl-1.5 pr-1"
            data-slot="value"
          >
            <input
              type="text"
              aria-label={label}
              data-property="color-hex"
              maxLength={6}
              value={hex6}
              placeholder="transparent"
              className="min-w-0 flex-1 border-none bg-transparent font-mono text-xs text-[#f0f0f0] outline-none caret-[#aef637]"
              onChange={(e) => {
                const val = e.target.value.replace(/[^0-9a-fA-F]/g, "").toUpperCase();
                setHexInput(val);
                if (/^[0-9a-fA-F]{6}$/.test(val)) {
                  const withHash = `#${val}`;
                  if (withHash.toLowerCase() === (color || "").toLowerCase()) return;
                  onChange(withHash);
                }
              }}
              onBlur={() => {
                if (!/^[0-9a-fA-F]{6}$/.test(hexInput.replace("#", ""))) {
                  setHexInput(color ? color.replace("#", "").toUpperCase() : "");
                }
              }}
            />
          </div>
          <div className="h-4 w-px shrink-0 bg-[#888888]/40" data-slot="divider" />
          <ScrubField
            className="h-full w-12 flex-none shrink-0 rounded-none border-0 bg-transparent shadow-none"
            label="Opacity"
            suffix="%"
            min={0}
            max={100}
            disabled={!hasBase}
            value={opacityPct}
            onChange={(v) => {
              onOpacityChange?.(Math.min(1, Math.max(0, v / 100)));
            }}
          />
        </div>
      </div>

      {/* rail: eye/eye-off + minus (open-pencil) */}
      <div className="flex shrink-0 items-center gap-0.5" data-slot="rail">
        {onToggleVisibility && (
          <button
            type="button"
            title={hidden ? "Show" : "Hide"}
            aria-label={hidden ? "Show" : "Hide"}
            aria-pressed={hidden}
            onClick={onToggleVisibility}
            className={`flex size-6 shrink-0 cursor-pointer items-center justify-center rounded border-none bg-transparent p-0 text-[#888888] outline-none transition-colors hover:bg-[#353535] hover:text-[#f0f0f0] ${
              hidden ? "text-[#aef637]" : ""
            }`}
            data-slot="visibility"
          >
            {hidden ? <EyeOff className="size-3.5" /> : <Eye className="size-3.5" />}
          </button>
        )}
        {onRemove && (
          <button
            type="button"
            title="Remove"
            aria-label="Remove"
            onClick={onRemove}
            className="flex size-6 shrink-0 cursor-pointer items-center justify-center rounded border-none bg-transparent p-0 text-[#888888] outline-none transition-colors hover:bg-[#353535] hover:text-[#f0f0f0]"
            data-slot="remove"
          >
            <Minus className="size-3.5" />
          </button>
        )}
      </div>

      {/* per-fill Blend mode (open-pencil details row) */}
      {onBlendModeChange && (
        <div className="col-span-2 min-w-0" data-slot="details">
          <div data-slot="root" data-panel-field-group="" className="min-w-0">
            <label
              data-slot="label"
              className="mb-1 block truncate text-[11px] leading-none text-[#888888]"
            >
              Blend mode
            </label>
            <div
              data-slot="container"
              className="flex min-w-0 flex-col gap-1.5"
            >
              <PanelSelect
                value={blendMode}
                label="Blend mode"
                dataProperty="fill-blend-mode"
                className="w-full min-w-0"
                options={FILL_BLEND_OPTIONS}
                onChange={(v) => onBlendModeChange(v)}
              />
            </div>
          </div>
        </div>
      )}

      {pickerOpen && (
        <ColorPicker
          value={color}
          alpha={opacity}
          position={pickerPos}
          onChange={(c) => {
            if (c.toLowerCase() === (color || "").toLowerCase()) return;
            onChange(c);
          }}
          onClose={() => setPickerOpen(false)}
        />
      )}
    </div>
  );
}
