"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import type { ElementInfo } from "@/components/HtmlPreview";
import { cssPx, parseTranslate, parseRgbToHex, gradientFirstColor } from "@/components/style-utils";

/** True when a computed color value is transparent (no visible color). */
function isTransparentColor(color: string | undefined): boolean {
  return (
    !color ||
    color === "transparent" ||
    color === "rgba(0, 0, 0, 0)" ||
    color === "rgba(0,0,0,0)"
  );
}

/* ═══════════════════════════════════════════════════════════════
   Icons (faithful port of the mock)
   ═══════════════════════════════════════════════════════════════ */

function UndoIcon() {
  return (
    <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 15L3 9m0 0l6-6M3 9h12a6 6 0 010 12h-3" />
    </svg>
  );
}
function RedoIcon() {
  return (
    <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 15l6-6m0 0l-6-6m6 6H9a6 6 0 000 12h3" />
    </svg>
  );
}
function EyeIcon() {
  return (
    <svg viewBox="0 0 16 16" width="15" height="15" fill="none">
      <path d="M1 8s2.5-4.5 7-4.5S15 8 15 8s-2.5 4.5-7 4.5S1 8 1 8z" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round" />
      <circle cx="8" cy="8" r="2" stroke="currentColor" strokeWidth="1.2" />
    </svg>
  );
}
function DropletIcon() {
  return (
    <svg viewBox="0 0 16 16" width="15" height="15" fill="none">
      <path d="M8 1.5S3.5 6.8 3.5 10a4.5 4.5 0 009 0C12.5 6.8 8 1.5 8 1.5z" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round" />
    </svg>
  );
}
function MoreDotsIcon() {
  return (
    <svg viewBox="0 0 16 16" width="15" height="15" fill="none">
      <circle cx="4.5" cy="4" r="1.1" fill="currentColor" />
      <circle cx="11.5" cy="4" r="1.1" fill="currentColor" />
      <circle cx="4.5" cy="8" r="1.1" fill="currentColor" />
      <circle cx="11.5" cy="8" r="1.1" fill="currentColor" />
      <circle cx="4.5" cy="12" r="1.1" fill="currentColor" />
      <circle cx="11.5" cy="12" r="1.1" fill="currentColor" />
    </svg>
  );
}

function AlignLeftIcon() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="none">
      <line x1="5" y1="4" x2="5" y2="20" stroke="currentColor" strokeWidth="1.5" />
      <rect x="8" y="6" width="10" height="3.2" rx="0.8" fill="currentColor" />
      <rect x="8" y="14.8" width="6" height="3.2" rx="0.8" fill="currentColor" />
    </svg>
  );
}
function AlignCenterIcon() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="none">
      <line x1="12" y1="4" x2="12" y2="20" stroke="currentColor" strokeWidth="1.5" />
      <rect x="6" y="6" width="12" height="3.2" rx="0.8" fill="currentColor" />
      <rect x="8" y="14.8" width="8" height="3.2" rx="0.8" fill="currentColor" />
    </svg>
  );
}
function AlignRightIcon() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="none">
      <line x1="19" y1="4" x2="19" y2="20" stroke="currentColor" strokeWidth="1.5" />
      <rect x="6" y="6" width="10" height="3.2" rx="0.8" fill="currentColor" />
      <rect x="10" y="14.8" width="6" height="3.2" rx="0.8" fill="currentColor" />
    </svg>
  );
}
function AlignTopIcon() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="none">
      <line x1="4" y1="5" x2="20" y2="5" stroke="currentColor" strokeWidth="1.5" />
      <rect x="6" y="8" width="3.2" height="10" rx="0.8" fill="currentColor" />
      <rect x="14.8" y="8" width="3.2" height="6" rx="0.8" fill="currentColor" />
    </svg>
  );
}
function AlignMiddleIcon() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="none">
      <line x1="4" y1="12" x2="20" y2="12" stroke="currentColor" strokeWidth="1.5" />
      <rect x="6" y="6" width="3.2" height="12" rx="0.8" fill="currentColor" />
      <rect x="14.8" y="8" width="3.2" height="8" rx="0.8" fill="currentColor" />
    </svg>
  );
}
function AlignBottomIcon() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="none">
      <line x1="4" y1="19" x2="20" y2="19" stroke="currentColor" strokeWidth="1.5" />
      <rect x="6" y="6" width="3.2" height="10" rx="0.8" fill="currentColor" />
      <rect x="14.8" y="10" width="3.2" height="6" rx="0.8" fill="currentColor" />
    </svg>
  );
}

function ConstraintsIcon() {
  return (
    <svg viewBox="0 0 16 16" width="16" height="16" fill="none">
      <rect x="3" y="3" width="10" height="10" rx="1" stroke="currentColor" strokeWidth="1.2" />
      <line x1="3" y1="1" x2="3" y2="2.2" stroke="currentColor" strokeWidth="1.2" />
      <line x1="13" y1="1" x2="13" y2="2.2" stroke="currentColor" strokeWidth="1.2" />
      <line x1="3" y1="13.8" x2="3" y2="15" stroke="currentColor" strokeWidth="1.2" />
      <line x1="13" y1="13.8" x2="13" y2="15" stroke="currentColor" strokeWidth="1.2" />
    </svg>
  );
}
function ConstrainIcon() {
  return (
    <svg viewBox="0 0 16 16" width="16" height="16" fill="none">
      <rect x="2" y="2" width="5" height="5" rx="1" stroke="currentColor" strokeWidth="1.2" />
      <rect x="9" y="9" width="5" height="5" rx="1" stroke="currentColor" strokeWidth="1.2" />
      <path d="M7 9L4.5 11.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
      <path d="M9 7l2.5-2.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
    </svg>
  );
}

function RotateIcon() {
  return (
    <svg viewBox="0 0 16 16" width="14" height="14" fill="none">
      <path d="M3 8a5 5 0 019-3" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
      <path d="M12 2.5v2.7h-2.7" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
function FlipHIcon() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="none">
      <line x1="12" y1="4" x2="12" y2="20" stroke="currentColor" strokeWidth="1.3" strokeDasharray="2 2" />
      <path d="M9 8L6 12l3 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M15 8l3 4-3 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
function FlipVIcon() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="none">
      <line x1="4" y1="12" x2="20" y2="12" stroke="currentColor" strokeWidth="1.3" strokeDasharray="2 2" />
      <path d="M8 9L12 6l4 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M8 15l4 3 4-3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
function CornersIcon() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="none">
      <path d="M6 10V7a1 1 0 011-1h3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M18 10V7a1 1 0 00-1-1h-3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M6 14v3a1 1 0 001 1h3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M18 14v3a1 1 0 01-1 1h-3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

function ResizeWIcon() {
  return (
    <svg viewBox="0 0 32 20" width="30" height="18" fill="none">
      <line x1="4" y1="4" x2="4" y2="16" stroke="currentColor" strokeWidth="1.4" />
      <line x1="28" y1="4" x2="28" y2="16" stroke="currentColor" strokeWidth="1.4" />
      <path d="M9 10h14" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
      <path d="M11 7l-3 3 3 3" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M21 7l3 3-3 3" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
function ResizeHIcon() {
  return (
    <svg viewBox="0 0 32 20" width="30" height="18" fill="none">
      <rect x="6" y="3" width="20" height="14" rx="1" stroke="currentColor" strokeWidth="1.4" />
      <line x1="10" y1="3" x2="10" y2="17" stroke="currentColor" strokeWidth="1.2" />
      <line x1="22" y1="3" x2="22" y2="17" stroke="currentColor" strokeWidth="1.2" />
    </svg>
  );
}
function ResizeAutoIcon() {
  return (
    <svg viewBox="0 0 32 20" width="30" height="18" fill="none">
      <rect x="4" y="2" width="24" height="16" rx="2" stroke="currentColor" strokeWidth="1.3" />
      <line x1="8" y1="7" x2="24" y2="7" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
      <line x1="8" y1="10" x2="24" y2="10" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
      <line x1="8" y1="13" x2="18" y2="13" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  );
}

function RadiusIcon() {
  return (
    <svg viewBox="0 0 16 16" width="13" height="13" fill="none">
      <path d="M2 10V5a3 3 0 013-3h5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
    </svg>
  );
}
function LineHeightIcon() {
  return (
    <svg viewBox="0 0 16 16" width="13" height="13" fill="none">
      <line x1="2" y1="4" x2="14" y2="4" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
      <line x1="2" y1="8" x2="14" y2="8" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
      <line x1="2" y1="12" x2="14" y2="12" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
    </svg>
  );
}
function LetterSpacingIcon() {
  return (
    <svg viewBox="0 0 16 16" width="13" height="13" fill="none">
      <path d="M2 4v8M14 4v8" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
      <path d="M6 8h4" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
    </svg>
  );
}
function ChevronIcon() {
  return (
    <svg viewBox="0 0 12 12" width="12" height="12" fill="none">
      <path d="M3 4.5l3 3 3-3" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
function CheckIcon() {
  return (
    <svg viewBox="0 0 12 12" width="11" height="11" fill="none">
      <path d="M2.5 6.2l2.3 2.3 4.7-5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
function TextAlignIcon({ align }: { align: "left" | "center" | "right" }) {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="none">
      {align === "left" && (
        <>
          <line x1="5" y1="6" x2="19" y2="6" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
          <line x1="5" y1="11" x2="14" y2="11" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
          <line x1="5" y1="16" x2="17" y2="16" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
        </>
      )}
      {align === "center" && (
        <>
          <line x1="5" y1="6" x2="19" y2="6" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
          <line x1="7" y1="11" x2="17" y2="11" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
          <line x1="6" y1="16" x2="18" y2="16" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
        </>
      )}
      {align === "right" && (
        <>
          <line x1="5" y1="6" x2="19" y2="6" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
          <line x1="10" y1="11" x2="19" y2="11" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
          <line x1="7" y1="16" x2="19" y2="16" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
        </>
      )}
    </svg>
  );
}

/* ═══════════════════════════════════════════════════════════════
   Number field (`.input-field` style: 32px, #3a3a3a, radius 6)
   Keeps Figma-style scrub / ↑↓ nudge behavior
   ═══════════════════════════════════════════════════════════════ */

function NumberField({
  value,
  onChange,
  prefix,
  suffix = "",
  min,
  max,
  disabled = false,
  className = "",
}: {
  value: string | number;
  onChange: (val: string) => void;
  prefix?: React.ReactNode;
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
      className={`flex items-center gap-1.5 bg-[#3a3a3a] rounded-[6px] px-2.5 h-8 min-w-0 ${className}`}
    >
      {prefix && (
        <span className="text-[12px] text-[#9b9b9b] shrink-0 select-none flex items-center">
          {prefix}
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
        className="w-full min-w-0 bg-transparent text-[13px] text-[#eaeaea] font-mono text-center focus:outline-none disabled:opacity-40 disabled:cursor-not-allowed"
      />
      {suffix && !disabled && (
        <span className="text-[12px] text-[#9b9b9b] shrink-0 select-none">
          {suffix}
        </span>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   Building blocks (faithful port of the mock's controls)
   ═══════════════════════════════════════════════════════════════ */

/* .icon-btn (square, header actions) */
function IconBtn({
  title,
  onClick,
  active = false,
  size = 16,
  className = "",
  children,
}: {
  title?: string;
  onClick?: () => void;
  active?: boolean;
  size?: number;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      title={title}
      onClick={onClick}
      aria-pressed={active}
      className={`w-8 h-8 shrink-0 flex items-center justify-center rounded-[6px] transition-colors ${
        active
          ? "bg-[#454545] text-[#ffffff] shadow-[inset_0_0_0_1px_rgba(255,255,255,0.15)]"
          : "text-[#b8b8b8] hover:bg-[#454545] hover:text-[#ffffff]"
      } ${className}`}
    >
      <span style={{ width: size, height: size }} className="flex items-center justify-center">
        {children}
      </span>
    </button>
  );
}

/* .btn-group — one joined group of 32x28 icon buttons */
function BtnGroup({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex bg-[#3a3a3a] rounded-[6px] overflow-hidden mr-1.5 last:mr-0">
      {children}
    </div>
  );
}

/* .icon-btn.sq — 32x28 member of a btn-group */
function SqBtn({
  title,
  onClick,
  active = false,
  children,
}: {
  title?: string;
  onClick?: () => void;
  active?: boolean;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      title={title}
      onClick={onClick}
      aria-pressed={active}
      className={`w-8 h-7 shrink-0 flex items-center justify-center transition-colors ${
        active
          ? "bg-[#454545] text-[#ffffff] shadow-[inset_0_0_0_1px_rgba(255,255,255,0.15)]"
          : "text-[#b8b8b8] hover:bg-[#454545] hover:text-[#ffffff]"
      }`}
    >
      {children}
    </button>
  );
}

/* .icon-btn.box — standalone 32x32 field-style button */
function BoxBtn({
  title,
  onClick,
  active = false,
  children,
}: {
  title?: string;
  onClick?: () => void;
  active?: boolean;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      title={title}
      onClick={onClick}
      aria-pressed={active}
      className={`w-8 h-8 shrink-0 flex items-center justify-center rounded-[6px] transition-colors ${
        active
          ? "bg-[#454545] text-[#ffffff] shadow-[inset_0_0_0_1px_rgba(255,255,255,0.15)]"
          : "bg-[#3a3a3a] text-[#b8b8b8] hover:bg-[#454545] hover:text-[#ffffff]"
      }`}
    >
      {children}
    </button>
  );
}

/* .icon-btn.wide — flex-1 32px option row (resizing) */
function WideBtn({
  title,
  onClick,
  active = false,
  children,
}: {
  title?: string;
  onClick?: () => void;
  active?: boolean;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      title={title}
      onClick={onClick}
      aria-pressed={active}
      className={`flex-1 h-8 min-w-0 flex items-center justify-center rounded-[6px] transition-colors ${
        active
          ? "bg-[#454545] text-[#ffffff] shadow-[inset_0_0_0_1px_rgba(255,255,255,0.15)]"
          : "bg-[#3a3a3a] text-[#9b9b9b] hover:bg-[#454545] hover:text-[#ffffff]"
      }`}
    >
      {children}
    </button>
  );
}

/* ─── Font options ─── */
const FONT_FAMILIES = [
  { value: "Inter", label: "Inter" },
  { value: "Arial, sans-serif", label: "Arial" },
  { value: "Georgia, serif", label: "Georgia" },
  { value: "'Times New Roman', serif", label: "Times New Roman" },
  { value: "'Courier New', monospace", label: "Courier New" },
  { value: "Verdana, sans-serif", label: "Verdana" },
  { value: "'Trebuchet MS', sans-serif", label: "Trebuchet MS" },
  { value: "Impact, sans-serif", label: "Impact" },
];

const FONT_WEIGHTS = [
  { value: "400", label: "Regular" },
  { value: "500", label: "Medium" },
  { value: "600", label: "Semibold" },
  { value: "700", label: "Bold" },
];

/* .dropdown — fully custom dropdown (button + portal menu) styled to match the panel */
function SelectField({
  value,
  options,
  onChange,
  grow = false,
  className = "",
  title,
  fontPreview = false,
}: {
  value: string;
  options: { value: string; label: string }[];
  onChange: (v: string) => void;
  grow?: boolean;
  className?: string;
  title?: string;
  /** Render each option's label in its own font (for font-family pickers) */
  fontPreview?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState<{
    top: number;
    left: number;
    width: number;
  } | null>(null);
  const [activeIdx, setActiveIdx] = useState(-1);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  const currentLabel =
    options.find((o) => o.value === value)?.label ?? value;

  const updatePos = useCallback(() => {
    const el = triggerRef.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    // Estimate menu height (option row 32px + padding 8px)
    const estH = options.length * 32 + 8;
    const spaceBelow = window.innerHeight - r.bottom;
    let top = r.bottom + 4;
    if (spaceBelow < estH && r.top > estH + 4) top = r.top - estH - 4;
    // Clamp so the menu never goes off the right edge of the viewport
    const left = Math.max(8, Math.min(r.left, window.innerWidth - 240));
    setPos({ top, left, width: r.width });
  }, [options.length]);

  const close = useCallback(() => {
    setOpen(false);
    setPos(null);
    setActiveIdx(-1);
    triggerRef.current?.focus();
  }, []);

  const openMenu = useCallback(() => {
    const idx = Math.max(0, options.findIndex((o) => o.value === value));
    setActiveIdx(idx);
    setOpen(true);
  }, [options, value]);

  const select = useCallback(
    (v: string) => {
      onChange(v);
      close();
    },
    [onChange, close],
  );

  // Position the menu when it opens, and keep it glued to the trigger on scroll/resize
  useEffect(() => {
    if (!open) return;
    updatePos();
    const reposition = () => updatePos();
    window.addEventListener("scroll", reposition, true);
    window.addEventListener("resize", reposition);
    return () => {
      window.removeEventListener("scroll", reposition, true);
      window.removeEventListener("resize", reposition);
    };
  }, [open, updatePos]);

  // Close on outside click or Escape
  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      const t = e.target as Node;
      if (triggerRef.current?.contains(t) || menuRef.current?.contains(t))
        return;
      close();
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
    };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open, close]);

  const onTriggerKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      if (open) close();
      else openMenu();
    } else if (e.key === "ArrowDown" || e.key === "ArrowUp") {
      e.preventDefault();
      if (!open) {
        openMenu();
        return;
      }
      setActiveIdx((i) => {
        const n = options.length;
        if (i < 0) return 0;
        return e.key === "ArrowDown" ? (i + 1) % n : (i - 1 + n) % n;
      });
    } else if (e.key === "Enter" && open) {
      e.preventDefault();
      if (activeIdx >= 0) select(options[activeIdx].value);
    }
  };

  return (
    <>
      <div
        className={`relative h-8 bg-[#3a3a3a] rounded-[6px] transition-colors hover:bg-[#454545] ${
          open ? "bg-[#454545]" : ""
        } ${grow ? "flex-1 min-w-0" : "shrink-0"} ${className}`}
      >
        <button
          ref={triggerRef}
          type="button"
          title={title}
          aria-haspopup="listbox"
          aria-expanded={open}
          onClick={() => (open ? close() : openMenu())}
          onKeyDown={onTriggerKeyDown}
          className="w-full h-full flex items-center pl-2.5 pr-7 text-[13px] text-[#eaeaea] truncate focus:outline-none cursor-pointer"
        >
          <span className="truncate">{currentLabel}</span>
        </button>
        <span
          className={`pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-[#9b9b9b] flex items-center transition-transform ${
            open ? "rotate-180" : ""
          }`}
        >
          <ChevronIcon />
        </span>
      </div>

      {open &&
        pos &&
        createPortal(
          <div
            ref={menuRef}
            role="listbox"
            style={{
              position: "fixed",
              top: pos.top,
              left: pos.left,
              minWidth: pos.width,
              zIndex: 9999,
            }}
            className="py-1 bg-[#262626] border border-[#3f3f46] rounded-[6px] shadow-[0_8px_24px_rgba(0,0,0,0.5)]"
          >
            {options.map((o, i) => {
              const selected = o.value === value;
              const active = i === activeIdx;
              return (
                <button
                  key={o.value}
                  type="button"
                  role="option"
                  aria-selected={selected}
                  onMouseEnter={() => setActiveIdx(i)}
                  onClick={() => select(o.value)}
                  style={fontPreview ? { fontFamily: o.value } : undefined}
                  className={`w-full flex items-center gap-1.5 pl-2 pr-2.5 h-8 text-[13px] text-left truncate transition-colors ${
                    active
                      ? "bg-[#454545] text-white"
                      : selected
                        ? "text-white"
                        : "text-[#eaeaea]"
                  }`}
                >
                  <span className="w-4 shrink-0 flex items-center justify-center">
                    {selected && <CheckIcon />}
                  </span>
                  <span className="truncate">{o.label}</span>
                </button>
              );
            })}
          </div>,
          document.body,
        )}
    </>
  );
}

/* .field-block — 11px label + control */
function FieldBlock({
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
function Section({
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
function ColorRow({
  label,
  color,
  onChange,
}: {
  label: string;
  color: string;
  onChange: (color: string) => void;
}) {
  // Sync hex input when color changes externally (empty = transparent)
  useEffect(() => {
    setHexInput(color ? color.toUpperCase() : "");
  }, [color]); // eslint-disable-line react-hooks/exhaustive-deps

  const [hexInput, setHexInput] = useState(() =>
    color ? color.toUpperCase() : "",
  );
  const pickerRef = useRef<HTMLInputElement>(null);

  return (
    <FieldBlock label={label}>
      <div className="h-8 flex items-center gap-1.5 bg-[#3a3a3a] rounded-[6px] px-2.5">
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

/* ═══════════════════════════════════════════════════════════════
   Main sidebar component (exact port of the mock)
   ═══════════════════════════════════════════════════════════════ */

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
  // The document container (body/html or the template's .scroll-wrapper)
  // has a locked width - its W control is disabled so it can't be edited.
  // X/Y stay editable: the page frame can be moved.
  const isContainerSel =
    !!first &&
    (first.tag === "html" ||
      first.tag === "body" ||
      String(first.classes || "")
        .split(" ")
        .includes("scroll-wrapper"));

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

  // Opacity as whole percent (100 = default)
  const opacityPct = s?.opacity
    ? Math.round(parseFloat(s.opacity) * 100)
    : 100;

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
    <div className="w-64 shrink-0 h-full flex flex-col bg-[#1e1e1e] border-l border-[#2d2d2d] select-none overflow-hidden">
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
                  <BtnGroup>
                    <SqBtn title="Align top">
                      <AlignTopIcon />
                    </SqBtn>
                    <SqBtn title="Align middle">
                      <AlignMiddleIcon />
                    </SqBtn>
                    <SqBtn title="Align bottom">
                      <AlignBottomIcon />
                    </SqBtn>
                  </BtnGroup>
                </div>
              </FieldBlock>

              <FieldBlock label="Position">
                <div className="flex items-center gap-1.5">
                  <NumberField
                    className="flex-1 min-w-0"
                    prefix="X"
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
                    value={fmtNum(translate[1])}
                    onChange={(v) =>
                      onApplyStyle(
                        "transform",
                        `translate(${translate[0]}px, ${v}px)`,
                      )
                    }
                  />
                  <BoxBtn title="Constraints">
                    <ConstraintsIcon />
                  </BoxBtn>
                </div>
              </FieldBlock>

              <FieldBlock label="Rotation">
                <div className="flex items-center gap-1.5">
                  <div className="flex-1 min-w-0 h-8 flex items-center gap-1.5 bg-[#3a3a3a] rounded-[6px] px-2.5">
                    <RotateIcon />
                    <span className="text-[13px] text-[#eaeaea] font-mono">
                      0°
                    </span>
                  </div>
                  <BtnGroup>
                    <SqBtn title="Flip horizontal">
                      <FlipHIcon />
                    </SqBtn>
                    <SqBtn title="Flip vertical">
                      <FlipVIcon />
                    </SqBtn>
                    <SqBtn title="Individual corners">
                      <CornersIcon />
                    </SqBtn>
                  </BtnGroup>
                </div>
              </FieldBlock>
            </Section>

            {/* ── Layout ── */}
            <Section title="Layout">
              <FieldBlock label="Resizing">
                <div className="flex items-center gap-1.5">
                  <WideBtn title="Fixed width">
                    <ResizeWIcon />
                  </WideBtn>
                  <WideBtn title="Fixed height">
                    <ResizeHIcon />
                  </WideBtn>
                  <WideBtn title="Auto (hug contents)" active>
                    <ResizeAutoIcon />
                  </WideBtn>
                </div>
              </FieldBlock>

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
                  <BoxBtn title="Constrain proportions">
                    <ConstrainIcon />
                  </BoxBtn>
                </div>
              </FieldBlock>
            </Section>

            {/* ── Appearance ── */}
            <Section
              title="Appearance"
              headerIcons={
                <>
                  <IconBtn title="Visible">
                    <EyeIcon />
                  </IconBtn>
                  <IconBtn title="Opacity">
                    <DropletIcon />
                  </IconBtn>
                </>
              }
            >
              <div className="flex items-start gap-1.5">
                <FieldBlock label="Opacity" grow>
                  <div className="h-8 flex items-center gap-1.5 bg-[#3a3a3a] rounded-[6px] px-2.5">
                    <DropletIcon />
                    <span className="text-[13px] text-[#eaeaea] font-mono">
                      {opacityPct}%
                    </span>
                  </div>
                </FieldBlock>
                <FieldBlock label="Corner radius" grow>
                  <div className="h-8 flex items-center gap-1.5 bg-[#3a3a3a] rounded-[6px] px-2.5">
                    <RadiusIcon />
                    <span className="text-[13px] text-[#eaeaea] font-mono">
                      {cssPx(s.borderRadius) || 0}
                    </span>
                  </div>
                </FieldBlock>
              </div>
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
            <Section
              title="Typography"
              noBorder
              headerIcons={
                <IconBtn title="More typography settings">
                  <MoreDotsIcon />
                </IconBtn>
              }
            >
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
                <div className="flex items-start gap-1.5 pt-1">
                  <FieldBlock label="Line height" grow>
                    <div className="h-8 flex items-center gap-1.5 bg-[#3a3a3a] rounded-[6px] px-2.5">
                      <LineHeightIcon />
                      <span className="text-[13px] text-[#eaeaea] font-mono">
                        Auto
                      </span>
                    </div>
                  </FieldBlock>
                  <FieldBlock label="Letter spacing" grow>
                    <div className="h-8 flex items-center gap-1.5 bg-[#3a3a3a] rounded-[6px] px-2.5">
                      <LetterSpacingIcon />
                      <span className="text-[13px] text-[#eaeaea] font-mono">
                        0%
                      </span>
                    </div>
                  </FieldBlock>
                </div>
                <FieldBlock label="Alignment" className="pt-1">
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
                    <BtnGroup>
                      <SqBtn title="Align top">
                        <AlignTopIcon />
                      </SqBtn>
                      <SqBtn title="Align middle">
                        <AlignMiddleIcon />
                      </SqBtn>
                      <SqBtn title="Align bottom">
                        <AlignBottomIcon />
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
                  <svg viewBox="0 0 16 16" width="13" height="13" fill="none">
                    <path
                      d="M3 4.5h10M6.5 4.5V3.2A1.2 1.2 0 017.7 2h.6a1.2 1.2 0 011.2 1.2v1.3M5 4.5l.5 8a1.2 1.2 0 001.2 1.1h2.6a1.2 1.2 0 001.2-1.1l.5-8"
                      stroke="currentColor"
                      strokeWidth="1.2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
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
