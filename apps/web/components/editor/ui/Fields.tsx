"use client";

import { useEffect, useState, useRef } from "react";

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
   and the hex input reads "transparent". */
export function ColorRow({
  label,
  color,
  onChange,
}: {
  label: string;
  color: string;
  onChange: (color: string) => void;
}) {
  const [hexInput, setHexInput] = useState(() =>
    color ? color.toUpperCase() : "",
  );
  const pickerRef = useRef<HTMLInputElement>(null);

  // Sync hex input when color changes externally (empty = transparent)
  useEffect(() => {
    // Intentional prop→local sync (see comment above).
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setHexInput(color ? color.toUpperCase() : "");
  }, [color]);

  return (
    <FieldBlock label={label}>
      <div className="h-8 flex items-center gap-1.5 bg-[#1e1e1e] rounded-[6px] px-2.5">
        {/* Swatch with transparency checkerboard */}
        <button
          type="button"
          onClick={() => pickerRef.current?.click()}
          className="relative w-4 h-4 rounded-[4px] overflow-hidden shrink-0 cursor-pointer"
          style={{
            background:
              "conic-gradient(#555555 25%, #3a3a3a 0 50%, #555555 0 75%, #3a3a3a 0) 0 0 / 8px 8px",
          }}
          title={`Change ${label.toLowerCase()} color`}
        >
          {color ? (
            <div className="w-full h-full" style={{ backgroundColor: color }} />
          ) : (
            <div className="w-full h-full border border-white/15" />
          )}
          <input
            ref={pickerRef}
            type="color"
            value={color || "#000000"}
            onChange={(e) => {
              // Skip events that re-send the current color (the native
              // picker fires a redundant change when the dialog closes).
              if (e.target.value.toLowerCase() === (color || "").toLowerCase())
                return;
              onChange(e.target.value);
              setHexInput(e.target.value.toUpperCase());
            }}
            className="absolute inset-0 opacity-0 cursor-pointer w-0 h-0"
          />
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
          className="w-full min-w-0 bg-transparent text-[13px] text-[#eaeaea] font-mono uppercase focus:outline-none"
        />
      </div>
    </FieldBlock>
  );
}
