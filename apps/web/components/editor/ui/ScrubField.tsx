"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

/**
 * Display/scrub number control — faithful React port of open-pencil's
 * `NumberField` in display mode (src/components/inputs/NumberField.vue):
 *   - renders as a transparent `role="spinbutton"` row showing `value` + a
 *     muted `suffix`, `cursor-ew-resize` across the whole control
 *   - horizontal drag scrubs the value (Shift = 10x), ↑/↓ step (Shift = 10)
 *   - a plain click (no drag) switches to edit mode with a bare text input;
 *     Enter/blur commits and returns to display mode
 *
 * Used for the paint-field opacity control so Klone matches open-pencil's
 * "100 %" opacity cell exactly.
 */
export function ScrubField({
  value,
  onChange,
  suffix,
  min,
  max,
  disabled = false,
  label,
  className = "",
}: {
  value: number;
  onChange: (v: number) => void;
  suffix?: string;
  min?: number;
  max?: number;
  disabled?: boolean;
  /** Accessible label (aria-label). */
  label?: string;
  className?: string;
}) {
  const [editing, setEditing] = useState(false);
  const [text, setText] = useState(String(value));
  const inputRef = useRef<HTMLInputElement>(null);
  const lastCommitted = useRef(value);

  // Keep display in sync with the model while not editing.
  useEffect(() => {
    if (!editing) {
      lastCommitted.current = value;
    }
  }, [value, editing]);

  useEffect(() => {
    if (editing) inputRef.current?.focus();
  }, [editing]);

  const clampN = (n: number) => {
    if (min !== undefined) n = Math.max(min, n);
    if (max !== undefined) n = Math.min(max, n);
    return n;
  };

  const commit = () => {
    const n = parseFloat(text);
    const next = clampN(Number.isNaN(n) ? lastCommitted.current : n);
    setEditing(false);
    if (next !== lastCommitted.current) {
      lastCommitted.current = next;
      onChange(next);
    }
  };

  /* Horizontal drag scrubs the value (Shift = 10x). A plain click without
     movement enters edit mode instead (open-pencil parity). */
  const startScrub = (e: React.PointerEvent<HTMLDivElement>) => {
    if (disabled || editing || e.button !== 0) return;
    e.preventDefault();
    const startX = e.clientX;
    const base = lastCommitted.current;
    let moved = false;
    const target = e.currentTarget;
    target.setPointerCapture(e.pointerId);
    const onMove = (ev: PointerEvent) => {
      const dx = ev.clientX - startX;
      if (!moved && Math.abs(dx) < 3) return;
      moved = true;
      const stepSize = ev.shiftKey ? 10 : 1;
      const next = clampN(Math.round(base + dx * stepSize));
      if (next !== lastCommitted.current) {
        lastCommitted.current = next;
        onChange(next);
      }
    };
    const onUp = () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
      // Plain click → enter edit mode (display → input).
      if (!moved) {
        setText(String(lastCommitted.current));
        setEditing(true);
      }
    };
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
  };

  return (
    <div
      role="spinbutton"
      tabIndex={disabled ? undefined : 0}
      aria-label={label}
      aria-valuenow={value}
      aria-valuemin={min}
      aria-valuemax={max}
      aria-disabled={disabled || undefined}
      data-slot="root"
      onPointerDown={startScrub}
      onKeyDown={(e) => {
        if (editing || disabled) return;
        if (e.key === "ArrowUp" || e.key === "ArrowDown") {
          e.preventDefault();
          const dir = e.key === "ArrowUp" ? 1 : -1;
          const next = clampN(
            Math.round(lastCommitted.current + dir * (e.shiftKey ? 10 : 1)),
          );
          lastCommitted.current = next;
          onChange(next);
        } else if (e.key === "Enter") {
          e.preventDefault();
          setText(String(lastCommitted.current));
          setEditing(true);
        }
      }}
      className={cn(
        "flex h-6 min-w-0 items-center text-[11px] tabular-nums text-[#f0f0f0] outline-none",
        disabled
          ? "cursor-not-allowed opacity-60"
          : editing
            ? "cursor-auto"
            : "cursor-ew-resize",
        className,
      )}
    >
      {editing ? (
        <input
          ref={inputRef}
          type="text"
          inputMode="numeric"
          value={text}
          aria-label={label}
          onChange={(e) => setText(e.target.value.replace(/[^\d.-]/g, ""))}
          onBlur={commit}
          onFocus={(e) => e.target.select()}
          onKeyDown={(e) => {
            if (e.key === "Enter") commit();
            if (e.key === "Escape") setEditing(false);
          }}
          className="min-w-0 flex-1 border-none bg-transparent py-0 pr-1.5 pl-1.5 font-[inherit] text-[11px] text-[#f0f0f0] outline-none caret-[#aef637]"
        />
      ) : (
        <span
          className="flex min-w-0 flex-1 items-center overflow-hidden truncate pr-1.5 pl-1.5 select-none"
          data-slot="value"
        >
          <span className="flex-1 truncate text-[#f0f0f0]">{value}</span>
          {suffix && (
            <span className="shrink-0 pr-1.5 text-[#888888]">{suffix}</span>
          )}
        </span>
      )}
    </div>
  );
}
