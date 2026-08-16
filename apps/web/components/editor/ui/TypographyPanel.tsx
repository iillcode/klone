"use client";

import { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import {
  Bold,
  Italic,
  Underline,
  Strikethrough,
  Baseline,
  ALargeSmall,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
  AlignVerticalJustifyStart,
  AlignVerticalJustifyCenter,
  AlignVerticalJustifyEnd,
  Check,
  Search,
} from "lucide-react";
import { FONT_FAMILIES, FONT_WEIGHTS } from "../constants";
import { NumberField } from "./NumberField";
import { SelectField } from "./SelectField";

/* ── Open-pencil Typography panel clone (6-control layout) ── */

const ALIGN_OPTIONS: { value: string; label: string; icon: React.ReactNode }[] = [
  { value: "left", label: "Align left", icon: <AlignLeft className="size-3.5" /> },
  { value: "center", label: "Align center", icon: <AlignCenter className="size-3.5" /> },
  { value: "right", label: "Align right", icon: <AlignRight className="size-3.5" /> },
  { value: "justify", label: "Justify", icon: <AlignJustify className="size-3.5" /> },
];

const VALIGN_OPTIONS: { value: string; label: string; icon: React.ReactNode }[] = [
  { value: "top", label: "Align top", icon: <AlignVerticalJustifyStart className="size-3.5" /> },
  { value: "center", label: "Align center", icon: <AlignVerticalJustifyCenter className="size-3.5" /> },
  { value: "bottom", label: "Align bottom", icon: <AlignVerticalJustifyEnd className="size-3.5" /> },
];

const DIRECTION_OPTIONS = [
  { value: "auto", label: "Auto" },
  { value: "ltr", label: "LTR" },
  { value: "rtl", label: "RTL" },
];

const CASE_OPTIONS = [
  { value: "none", label: "Original" },
  { value: "uppercase", label: "Uppercase" },
  { value: "lowercase", label: "Lowercase" },
  { value: "capitalize", label: "Title" },
];

const TRUNCATION_OPTIONS = [
  { value: "none", label: "Disabled" },
  { value: "ellipsis", label: "Ending" },
];

/* Compact font picker (open-pencil FontPicker look) */
function FontPicker({
  value,
  onChange,
}: {
  value: string;
  onChange: (v: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState<{ top: number; left: number; width: number } | null>(null);
  const [query, setQuery] = useState("");
  const triggerRef = useRef<HTMLButtonElement>(null);

  const currentLabel =
    FONT_FAMILIES.find((f) => f.value === value)?.label || value || "Default";

  const updatePos = () => {
    const el = triggerRef.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const estH = Math.min(280, FONT_FAMILIES.length * 30 + 44);
    let top = r.bottom + 4;
    if (window.innerHeight - r.bottom < estH) top = r.top - estH - 4;
    setPos({ top, left: Math.max(8, r.left), width: r.width });
  };

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
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      const t = e.target as Node;
      if (triggerRef.current?.contains(t)) return;
      setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const filtered = FONT_FAMILIES.filter((f) =>
    f.label.toLowerCase().includes(query.toLowerCase()),
  );

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        onClick={() => (open ? setOpen(false) : (setOpen(true), updatePos()))}
        className="flex h-6 min-w-0 flex-1 cursor-pointer items-center gap-1.5 rounded border border-transparent bg-[#1e1e1e] px-1.5 text-[11px] text-[#f0f0f0] outline-none transition-colors hover:bg-[#262626] focus:border-[#3b82f6] focus:bg-[#262626] focus-visible:border-[#3b82f6] focus-within:border-[#3b82f6] focus-within:bg-[#262626]"
        style={{ fontFamily: value || undefined }}
      >
        <span className="truncate">{currentLabel}</span>
        <svg className="ml-auto shrink-0 text-[#888888]" width="10" height="6" viewBox="0 0 10 6">
          <path d="M1 1l4 4 4-4" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
      </button>
      {open && pos && createPortal(
        <div
          style={{ position: "fixed", top: pos.top, left: pos.left, width: pos.width, zIndex: 9999 }}
          className="overflow-hidden rounded-md bg-[#2a2a2a] shadow-[0_8px_30px_rgba(0,0,0,0.4)]"
        >
          <div className="flex items-center gap-1.5 border-b border-[#3a3a3a] px-2 py-1.5">
            <Search className="size-3.5 shrink-0 text-[#888888]" />
            <input
              autoFocus
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search fonts"
              className="min-w-0 flex-1 border-none bg-transparent text-[11px] text-[#f0f0f0] outline-none placeholder:text-[#888888]"
            />
          </div>
          <div className="max-h-[240px] overflow-y-auto scrollbar-none p-0.5">
            {filtered.map((f) => (
              <button
                key={f.value}
                type="button"
                onClick={() => {
                  onChange(f.value);
                  setOpen(false);
                  setQuery("");
                }}
                className="flex h-6 w-full select-none items-center justify-between gap-2 rounded px-2 text-left text-[11px] text-[#f0f0f0] outline-none transition-colors hover:bg-[#353535]"
                style={{ fontFamily: f.value }}
              >
                <span className="truncate">{f.label}</span>
                {f.value === value && <Check className="size-3.5 shrink-0 text-[#3b82f6]" />}
              </button>
            ))}
          </div>
        </div>,
        document.body,
      )}
    </>
  );
}

function SegmentedControl({
  options,
  value,
  onChange,
  label,
}: {
  options: { value: string; label: string; icon: React.ReactNode }[];
  value: string;
  onChange: (v: string) => void;
  label: string;
}) {
  return (
    <div
      role="toolbar"
      aria-label={label}
      className="flex w-full items-center gap-0.5 rounded bg-[#1e1e1e] p-0.5 hover:bg-[#262626]"
    >
      {options.map((opt) => {
        const selected = opt.value === value;
        return (
          <button
            key={opt.value}
            type="button"
            title={opt.label}
            aria-label={opt.label}
            aria-pressed={selected}
            onClick={() => onChange(opt.value)}
            className={`flex h-6 flex-1 cursor-pointer items-center justify-center rounded border-none p-0 outline-none transition-colors ${
              selected
                ? "bg-[#2e2e2e] text-[#f0f0f0]"
                : "text-[#888888] hover:text-[#f0f0f0]"
            }`}
          >
            {opt.icon}
          </button>
        );
      })}
    </div>
  );
}

export function TypographyPanel({
  styles,
  onApplyStyle,
}: {
  styles: Record<string, string>;
  onApplyStyle: (property: string, value: string) => void;
}) {
  const family = styles.fontFamily || FONT_FAMILIES[0].value;
  const weight = styles.fontWeight || "400";
  const size = Math.round(parseFloat(styles.fontSize || "14")) || 14;
  const lh = styles.lineHeight ? Math.round(parseFloat(styles.lineHeight)) || 0 : 0;
  const ls = styles.letterSpacing ? Math.round(parseFloat(styles.letterSpacing)) || 0 : 0;
  const direction = styles.direction === "rtl" ? "rtl" : styles.direction === "ltr" ? "ltr" : "auto";
  const align = styles.textAlign || "left";
  const valign = styles.verticalAlign || "top";
  const transform = styles.textTransform || "none";
  const truncation = styles.textOverflow === "ellipsis" ? "ellipsis" : "none";

  const deco = styles.textDecorationLine || "none";
  const bold = weight === "700" || weight === "bold" || parseFloat(weight) >= 700;
  const italic = styles.fontStyle === "italic";
  const underline = deco.includes("underline");
  const strike = deco.includes("line-through");

  const toggleDeco = (token: string, on: boolean) => {
    const set = new Set(deco.split(" ").filter((d) => d && d !== "none"));
    if (on) set.add(token);
    else set.delete(token);
    onApplyStyle("textDecorationLine", set.size ? Array.from(set).join(" ") : "none");
  };

  const fmtBlock =
    "mb-3 flex w-full items-center gap-0.5 rounded bg-[#1e1e1e] p-0.5 hover:bg-[#262626]";
  const fmtBtn =
    "flex h-6 flex-1 cursor-pointer items-center justify-center rounded border-none bg-transparent p-0 outline-none transition-colors text-[#888888] hover:text-[#f0f0f0]";

  return (
    <div className="px-3 py-2.5 border-b border-[#3a3a3a]">
      <div className="text-[11px] font-semibold text-[#f0f0f0] mb-3">Typography</div>

      {/* Font + settings row */}
      <div className="mb-3 flex min-w-0 items-center gap-1.5">
        <FontPicker value={family} onChange={(v) => onApplyStyle("fontFamily", v)} />
        <button
          type="button"
          title="Font settings"
          className="flex size-6 shrink-0 cursor-pointer items-center justify-center rounded border-none bg-transparent p-0 text-[#888888] outline-none transition-colors hover:bg-[#353535] hover:text-[#f0f0f0]"
        >
          <svg width="14" height="14" viewBox="0 0 16 16" className="size-3.5">
            <path d="M8 1.5a2 2 0 100 4 2 2 0 000-4zM3.5 7h9l-1 7.5h-2L10 11H6l.5 3.5h-2z" fill="currentColor" />
          </svg>
        </button>
      </div>

      {/* Weight + size */}
      <div className="mb-3 grid grid-cols-2 items-center gap-1.5">
        <div>
          <div className="text-[11px] leading-none text-[#888888] mb-1 select-none">Weight</div>
          <SelectField value={weight} options={FONT_WEIGHTS} onChange={(v) => onApplyStyle("fontWeight", v)} />
        </div>
        <div>
          <div className="text-[11px] leading-none text-[#888888] mb-1 select-none">Size</div>
          <NumberField
            min={1}
            max={1000}
            value={size}
            onChange={(v) => onApplyStyle("fontSize", `${Math.max(1, parseFloat(v || "14"))}px`)}
          />
        </div>
      </div>

      {/* Line height + letter spacing */}
      <div className="mb-3 grid grid-cols-2 items-center gap-1.5">
        <div>
          <div className="text-[11px] leading-none text-[#888888] mb-1 select-none">Line height</div>
          <NumberField
            icon={<Baseline className="size-3" />}
            min={0}
            value={lh}
            onChange={(v) => onApplyStyle("lineHeight", `${Math.max(0, parseFloat(v || "0"))}`)}
          />
        </div>
        <div>
          <div className="text-[11px] leading-none text-[#888888] mb-1 select-none">Letter spacing</div>
          <NumberField
            icon={<ALargeSmall className="size-3" />}
            value={ls}
            onChange={(v) => onApplyStyle("letterSpacing", `${parseFloat(v || "0")}px`)}
          />
        </div>
      </div>

      {/* Direction */}
      <div className="mb-3">
        <div className="text-[11px] leading-none text-[#888888] mb-1 select-none">Direction</div>
        <SelectField value={direction} options={DIRECTION_OPTIONS} onChange={(v) => onApplyStyle("direction", v)} />
      </div>

      {/* Horizontal alignment */}
      <div className="mb-3">
        <div className="text-[11px] leading-none text-[#888888] mb-1 select-none">Alignment</div>
        <SegmentedControl
          label="Text alignment"
          value={align}
          options={ALIGN_OPTIONS}
          onChange={(v) => onApplyStyle("textAlign", v)}
        />
      </div>

      {/* Vertical alignment */}
      <div className="mb-3">
        <div className="text-[11px] leading-none text-[#888888] mb-1 select-none">Vertical alignment</div>
        <SegmentedControl
          label="Vertical text alignment"
          value={valign}
          options={VALIGN_OPTIONS}
          onChange={(v) => onApplyStyle("verticalAlign", v)}
        />
      </div>

      {/* Formatting toolbar */}
      <div className="mb-3">
        <div className="text-[11px] leading-none text-[#888888] mb-1 select-none">Text formatting</div>
        <div className={fmtBlock} role="toolbar" aria-label="Text formatting">
          <button
            type="button"
            title="Bold"
            aria-label="Bold"
            aria-pressed={bold}
            onClick={() => onApplyStyle("fontWeight", bold ? "400" : "700")}
            className={`${fmtBtn} ${bold ? "text-[#3b82f6]" : ""}`}
          >
            <Bold className="size-3.5" />
          </button>
          <button
            type="button"
            title="Italic"
            aria-label="Italic"
            aria-pressed={italic}
            onClick={() => onApplyStyle("fontStyle", italic ? "normal" : "italic")}
            className={`${fmtBtn} ${italic ? "text-[#3b82f6]" : ""}`}
          >
            <Italic className="size-3.5" />
          </button>
          <button
            type="button"
            title="Underline"
            aria-label="Underline"
            aria-pressed={underline}
            onClick={() => toggleDeco("underline", !underline)}
            className={`${fmtBtn} ${underline ? "text-[#3b82f6]" : ""}`}
          >
            <Underline className="size-3.5" />
          </button>
          <button
            type="button"
            title="Strikethrough"
            aria-label="Strikethrough"
            aria-pressed={strike}
            onClick={() => toggleDeco("line-through", !strike)}
            className={`${fmtBtn} ${strike ? "text-[#3b82f6]" : ""}`}
          >
            <Strikethrough className="size-3.5" />
          </button>
        </div>
      </div>

      {/* Case + truncation */}
      <div className="grid grid-cols-2 items-center gap-1.5">
        <div>
          <div className="text-[11px] leading-none text-[#888888] mb-1 select-none">Case</div>
          <SelectField value={transform} options={CASE_OPTIONS} onChange={(v) => onApplyStyle("textTransform", v)} />
        </div>
        <div>
          <div className="text-[11px] leading-none text-[#888888] mb-1 select-none">Truncation</div>
          <SelectField
            value={truncation}
            options={TRUNCATION_OPTIONS}
            onChange={(v) => {
              if (v === "ellipsis") {
                onApplyStyle("textOverflow", "ellipsis");
                onApplyStyle("whiteSpace", "nowrap");
                onApplyStyle("overflow", "hidden");
              } else {
                onApplyStyle("textOverflow", "clip");
                onApplyStyle("whiteSpace", "normal");
                onApplyStyle("overflow", "visible");
              }
            }}
          />
        </div>
      </div>
    </div>
  );
}

