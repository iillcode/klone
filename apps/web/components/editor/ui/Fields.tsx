"use client";

import { useEffect, useState, useRef } from "react";
import { Eye, EyeOff, Minus } from "lucide-react";
import { ColorPicker } from "./ColorPicker";
import { NumberField } from "./NumberField";

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
      className={`py-3.5 ${noBorder ? "" : "border-b border-[#3a3a3a]"}`}
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

/* ─── Color row (open-pencil fill row: PaintField + rail eye/minus) ─── */
export function ColorRow({
  label,
  color,
  opacity = 1,
  hidden = false,
  onChange,
  onOpacityChange,
  onToggleVisibility,
  onRemove,
}: {
  label: string;
  color: string;
  opacity?: number;
  hidden?: boolean;
  onChange: (color: string) => void;
  onOpacityChange?: (opacity: number) => void;
  onToggleVisibility?: () => void;
  onRemove?: () => void;
}) {
  const [hexInput, setHexInput] = useState(() =>
    color ? color.toUpperCase() : "",
  );
  const [pickerOpen, setPickerOpen] = useState(false);
  const [pickerPos, setPickerPos] = useState({ left: 0, top: 0 });
  const swatchRef = useRef<HTMLButtonElement>(null);

  // Sync hex input when color changes externally (empty = transparent)
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setHexInput(color ? color.toUpperCase() : "");
  }, [color]);

  const openPicker = () => {
    const r = swatchRef.current?.getBoundingClientRect();
    if (!r) return;
    const W = 272;
    const H = 505;
    let left = r.left - W - 8;
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
    <div
      data-slot="item-row"
      className="group grid min-h-6 grid-cols-[minmax(0,1fr)_auto] items-center gap-x-1.5 gap-y-1.5 py-0.5"
    >
      {/* content */}
      <div className="flex min-w-0 items-center gap-1.5" data-slot="content">
        {/* open-pencil PaintField */}
        <div
          className="h-6 min-w-0 flex-1 flex items-center overflow-hidden rounded border border-transparent bg-[#383838] text-[11px] transition-colors hover:bg-[#404040] focus-within:border-[#3b82f6] focus-within:bg-[#404040]"
          data-slot="paint-field"
          data-property="paint"
        >
          <div className="flex shrink-0 items-center pl-1">
            <button
              type="button"
              ref={swatchRef}
              onClick={openPicker}
              className="relative block size-4 overflow-hidden rounded border border-[#3a3a3a] cursor-pointer bg-[#3a3a3a] bg-[image:linear-gradient(45deg,#555_25%,transparent_25%),linear-gradient(-45deg,#555_25%,transparent_25%),linear-gradient(45deg,transparent_75%,#555_75%),linear-gradient(-45deg,transparent_75%,#555_75%)] bg-[size:8px_8px] bg-[position:0_0,0_4px,4px_-4px,-4px_0]"
              title={`Change ${label.toLowerCase()} color`}
            >
              {color ? (
                <div
                  className="pointer-events-none absolute inset-0"
                  style={{ backgroundColor: color, opacity: opacity }}
                />
              ) : (
                <div className="pointer-events-none absolute inset-0 border border-white/15" />
              )}
            </button>
          </div>
          <input
            type="text"
            value={hexInput}
            placeholder="transparent"
            data-property="color-hex"
            className="min-w-0 flex-1 border-none bg-transparent font-mono text-[11px] pl-1.5 pr-1 text-[#f0f0f0] outline-none caret-[#3b82f6]"
            onChange={(e) => {
              const val = e.target.value;
              setHexInput(val);
              if (/^#[0-9a-fA-F]{6}$/.test(val)) {
                if (val.toLowerCase() === (color || "").toLowerCase()) return;
                onChange(val);
              }
            }}
            onBlur={() => {
              if (hexInput && !/^#[0-9a-fA-F]{6}$/.test(hexInput)) {
                setHexInput(color ? color.toUpperCase() : "");
              }
            }}
          />
          <div className="h-4 w-px shrink-0 bg-[#888888]/40" />
          <NumberField
            className="h-full w-12 flex-none shrink-0 rounded-none border-0 bg-transparent shadow-none"
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
      </div>

      {/* rail: eye/eye-off + minus (open-pencil) */}
      <div className="flex shrink-0 items-center gap-0.5" data-slot="rail">
        {onToggleVisibility && (
          <button
            type="button"
            title={hidden ? "Show" : "Hide"}
            aria-label={hidden ? "Show" : "Hide"}
            onClick={onToggleVisibility}
            className={`flex size-6 shrink-0 cursor-pointer items-center justify-center rounded border-none bg-transparent p-0 text-[#888888] outline-none transition-colors hover:bg-[#353535] hover:text-[#f0f0f0] ${
              hidden ? "text-[#3b82f6]" : ""
            }`}
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
          >
            <Minus className="size-3.5" />
          </button>
        )}
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
    </div>
  );
}
