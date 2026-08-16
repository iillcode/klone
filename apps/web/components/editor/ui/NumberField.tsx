"use client";

import { useState, useRef, useEffect } from "react";import { cn } from "@/lib/utils";
/* Number field (`.input-field` style: 32px, #3a3a3a, radius 6)
   Keeps Figma-style scrub / ↑↓ nudge behavior */
export function NumberField({
  value,
  onChange,
  prefix,
  icon,
  suffix = "",
  min,
  max,
  disabled = false,
  className = "",
}: {
  value: string | number;
  onChange: (val: string) => void;
  prefix?: React.ReactNode;
  icon?: React.ReactNode;
  suffix?: string;
  min?: number;
  max?: number;
  disabled?: boolean;
  className?: string;
}) {
  const strValue = String(value ?? "");
  const [local, setLocal] = useState(strValue);
  const composing = useRef(false);
  const lastCommitted = useRef(strValue);
  const inputRef = useRef<HTMLInputElement>(null);

  // Sync from parent only when the user isn't typing. Kept as an effect so the
  // `composing` ref is evaluated when `value` changes; `local` is deliberately
  // omitted from deps (adding it would clobber the user's in-progress typing).
  useEffect(() => {
    if (!composing.current && value !== undefined) {
      const v = String(value);
      if (v !== local) {
        // Intentional prop→local sync (see comment above).
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setLocal(v);
        lastCommitted.current = v;
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  const clampNum = (n: number) => {
    if (min !== undefined) n = Math.max(min, n);
    if (max !== undefined) n = Math.min(max, n);
    return n;
  };

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
    // Commit final value on blur (handles edge cases like partial edits),
    // and clamp to the allowed range.
    let n = parseFloat(local);
    if (Number.isNaN(n)) n = 0;
    n = clampNum(n);
    const v = String(n);
    setLocal(v);
    if (v !== lastCommitted.current) {
      onChange(v);
      lastCommitted.current = v;
    }
  };

  // ↑/↓ steps the value (Shift = 10px) - Figma-style nudge.
  const step = (dir: number, shift: boolean) => {
    const cur = parseFloat(lastCommitted.current);
    const base = Number.isNaN(cur) ? 0 : cur;
    const next = clampNum(base + dir * (shift ? 10 : 1));
    const v = String(next);
    setLocal(v);
    lastCommitted.current = v;
    onChange(v);
  };

  // Horizontal drag on the number scrubs the value (Shift = 10x).
  const startScrub = (e: React.PointerEvent<HTMLInputElement>) => {
    if (disabled || e.button !== 0 || composing.current) return;
    e.preventDefault(); // keep the caret from appearing during scrub
    const startX = e.clientX;
    const startVal = parseFloat(lastCommitted.current);
    const base = Number.isNaN(startVal) ? 0 : startVal;
    let moved = false;
    const onMove = (ev: PointerEvent) => {
      const dx = ev.clientX - startX;
      if (!moved && Math.abs(dx) < 3) return;
      moved = true;
      const stepSize = ev.shiftKey ? 10 : 1;
      const next = clampNum(base + dx * stepSize);
      const v = String(Math.round(next * 10) / 10);
      setLocal(v);
      lastCommitted.current = v;
      onChange(v);
    };
    const onUp = () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
      // Enter edit mode on a plain click; keep focus after a scrub.
      inputRef.current?.focus();
      inputRef.current?.select();
    };
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
  };

  return (
    <div
      className={cn(
        "h-6 min-w-0 w-full flex items-center rounded border border-transparent bg-[#1e1e1e] text-[#f0f0f0] outline-none hover:bg-[#262626] focus-within:border-[#3b82f6] focus-within:bg-[#262626] text-[11px] tabular-nums",
        className,
      )}
    >
      {prefix && (
        <span className="flex shrink-0 items-center justify-center self-stretch px-[5px] text-[#888888] select-none [&>*]:pointer-events-none">
          {prefix}
        </span>
      )}
      {icon && (
        <span className="flex shrink-0 items-center justify-center self-stretch px-[5px] text-[#888888] select-none [&>*]:pointer-events-none">
          {icon}
        </span>
      )}
      <input
        ref={inputRef}
        type="text"
        inputMode="numeric"
        value={local}
        disabled={disabled}
        onChange={handleChange}
        onBlur={handleBlur}
        onFocus={(e) => e.target.select()}
        onPointerDown={startScrub}
        onKeyDown={(e) => {
          if (e.key === "ArrowUp") {
            e.preventDefault();
            step(1, e.shiftKey);
          } else if (e.key === "ArrowDown") {
            e.preventDefault();
            step(-1, e.shiftKey);
          }
        }}
        onCompositionStart={() => {
          composing.current = true;
        }}
        onCompositionEnd={(e) => {
          composing.current = false;
          const v = (e.target as HTMLInputElement).value || "0";
          onChange(v);
          lastCommitted.current = v;
        }}
        className="min-w-0 flex-1 cursor-text border-none bg-transparent pr-1.5 font-[inherit] text-[11px] text-[#f0f0f0] outline-none caret-[#3b82f6] disabled:opacity-40 disabled:cursor-not-allowed"
      />
      {suffix && !disabled && (
        <span className="shrink-0 pr-1.5 text-[#888888] select-none">{suffix}</span>
      )}
    </div>
  );
}
