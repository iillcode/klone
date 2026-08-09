"use client";

import { useEffect, useState, useRef } from "react";
import { ColorPicker } from "./ColorPicker";
import { NumberField } from "./NumberField";

/* .field-block — 11px label + control */
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
      <div className="text-[11px] text-[#9b9b9b] mb-1.5 select-none">{label}</div>
      {children}
    </div>
  );
}

/* .section — 13px/600 title row (+ optional header actions), 1px divider */
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
      className={`py-3.5 ${noBorder ? "" : "border-b border-[rgba(255,255,255,0.08)]"}`}
    >
      {headerIcons ? (
        <div className="flex items-center justify-between">
          <span className="text-[13px] font-semibold text-[#ffffff]">
            {title}
          </span>
          <div className="flex items-center gap-0.5">{headerIcons}</div>
        </div>
      ) : (
        <div className="text-[13px] font-semibold text-[#ffffff]">{title}</div>
      )}
      <div className="mt-3 space-y-3">{children}</div>
    </div>
  );
}

/* ─── Color row (mock style: 32px field with swatch + hex) ───
   An empty `color` means transparent: the swatch shows only the checkerboard
   and the hex input reads "transparent". `opacity` (0..1) drives the inline
   opacity field next to the hex input; when the base color is transparent
   the field is disabled (there is nothing to make opaque). */
export function ColorRow({
  label,
  color,
  opacity = 1,
  onChange,
  onOpacityChange,
}: {
  label: string;
  color: string;
  opacity?: number;
  onChange: (color: string) => void;
  onOpacityChange?: (opacity: number) => void;
}) {
  const [hexInput, setHexInput] = useState(() =>
    color ? color.toUpperCase() : "",
  );
  const [pickerOpen, setPickerOpen] = useState(false);
  const [pickerPos, setPickerPos] = useState({ left: 0, top: 0 });
  const swatchRef = useRef<HTMLButtonElement>(null);

  // Sync hex input when color changes externally (empty = transparent)
  useEffect(() => {
    // Intentional prop→local sync (see comment above).
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setHexInput(color ? color.toUpperCase() : "");
  }, [color]);

  const openPicker = () => {
    const r = swatchRef.current?.getBoundingClientRect();
    if (!r) return;
    const W = 272;
    const H = 505; // approx height of the picker
    let left = r.left - W - 8; // pop out to the left (Figma style)
    if (left < 8) left = r.right + 8;
    if (left + W > window.innerWidth - 8)
      left = Math.max(8, window.innerWidth - W - 8);
    let top = r.top;
    if (top + H > window.innerHeight - 8)
      top = Math.max(8, window.innerHeight - H - 8);
    setPickerPos({ left, top });
    setPickerOpen(true);
  };

  const hasBase = !!color;
  const opacityPct = Math.round((opacity || 0) * 100);

  return (
    <FieldBlock label={label}>
      <div className="flex items-center gap-1.5">
        <div className="h-7 flex-1 min-w-0 flex items-center gap-1.5 bg-[#1e1e1e] rounded-[6px] px-2.5 border border-transparent transition-colors focus-within:border-[#3b82f6]">
          {/* Swatch with transparency checkerboard */}
          <button
            type="button"
            ref={swatchRef}
            onClick={openPicker}
            className="relative w-4 h-4 rounded-[4px] overflow-hidden shrink-0 cursor-pointer"
            style={{
              background:
                "conic-gradient(#555555 25%, #3a3a3a 0 50%, #555555 0 75%, #3a3a3a 0) 0 0 / 8px 8px",
            }}
            title={`Change ${label.toLowerCase()} color`}
          >
            {color ? (
              <div
                className="w-full h-full"
                style={{ backgroundColor: color, opacity: opacity }}
              />
            ) : (
              <div className="w-full h-full border border-white/15" />
            )}
          </button>
          {/* Hex input */}
          <input
            type="text"
            value={hexInput}
            placeholder="transparent"
            onChange={(e) => {
              const val = e.target.value;
              setHexInput(val);
              if (/^#[0-9a-fA-F]{6}$/.test(val)) {
                // Skip re-typing the current value - no redundant undo entries.
                if (val.toLowerCase() === (color || "").toLowerCase()) return;
                onChange(val);
              }
            }}
            onBlur={() => {
              // Reset to actual color on blur if invalid
              if (hexInput && !/^#[0-9a-fA-F]{6}$/.test(hexInput)) {
                setHexInput(color ? color.toUpperCase() : "");
              }
            }}
            className="w-full min-w-0 bg-transparent text-[13px] text-[#eaeaea] font-mono uppercase focus:outline-none caret-[#3b82f6]"
          />
        </div>
        {/* Opacity (percent of the current color) */}
        <NumberField
          className="w-[64px] shrink-0"
          suffix="%"
          min={0}
          max={100}
          disabled={!hasBase}
          value={opacityPct}
          onChange={(v) => {
            const n = Math.round(parseFloat(v || "0") * 10) / 10;
            onOpacityChange?.(Math.min(1, Math.max(0, n / 100)));
          }}
        />
      </div>
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
    </FieldBlock>
  );
}
