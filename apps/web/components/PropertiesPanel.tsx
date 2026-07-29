"use client";

import { useState, type SVGProps } from "react";
import type { ElementInfo } from "@/components/HtmlPreview";
import { parseRgbToHex, cssPx } from "@/components/style-utils";

/* ─── Minimal inline icons ─── */

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

function AlignLeftIcon(props: SVGProps<SVGSVGElement>) {
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
        d="M3.75 6.75h16.5M3.75 12h10.5m-10.5 5.25h16.5"
      />
    </svg>
  );
}

function AlignCenterIcon(props: SVGProps<SVGSVGElement>) {
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
        d="M8.25 3h7.5M8.25 12h4.5m-4.5 5.25h6"
      />
    </svg>
  );
}

function AlignRightIcon(props: SVGProps<SVGSVGElement>) {
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
        d="M15.75 3h-7.5M15.75 12H21m-11.25 5.25h7.5"
      />
    </svg>
  );
}

function PaintIcon(props: SVGProps<SVGSVGElement>) {
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
        d="M4.098 19.902a3.75 3.75 0 005.304 0l6.401-6.402M6.75 21A3.75 3.75 0 013 17.25V4.125C3 3.504 3.504 3 4.125 3h5.25c.621 0 1.125.504 1.125 1.125v4.072M6.75 21a3.75 3.75 0 003.75-3.75V8.197M6.75 21h13.125c.621 0 1.125-.504 1.125-1.125v-5.25c0-.621-.504-1.125-1.125-1.125h-4.072"
      />
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

/* ─── Collapsible section ─── */

function Section({
  label,
  defaultOpen = true,
  children,
}: {
  label: string;
  defaultOpen?: boolean;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div>
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1.5 w-full px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wider text-[#52525b] hover:text-[#a1a1aa] transition-colors"
      >
        <ChevronDown
          className={`w-3 h-3 transition-transform ${open ? "rotate-0" : "-rotate-90"}`}
        />
        {label}
      </button>
      {open && <div className="px-3 pb-2 space-y-2">{children}</div>}
    </div>
  );
}

/* ─── Color swatch row ─── */

function ColorRow({
  label,
  icon,
  value,
  onChange,
}: {
  label: string;
  icon: React.ReactNode;
  value: string;
  onChange: (val: string) => void;
}) {
  return (
    <label className="flex items-center gap-2 text-[11px] text-[#a1a1aa] cursor-pointer">
      {icon}
      <span className="w-6">{label}</span>
      <input
        type="color"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-5 h-5 p-0 rounded cursor-pointer border-0 bg-transparent [&::-webkit-color-swatch-wrapper]:p-0 [&::-webkit-color-swatch]:rounded-sm [&::-webkit-color-swatch]:border-0"
      />
      <span className="font-mono text-[10px] text-[#52525b]">{value}</span>
    </label>
  );
}

/* ─── Number input row ─── */

function NumberRow({
  label,
  value,
  onChange,
  min,
  title,
}: {
  label: string;
  value: number;
  onChange: (val: string) => void;
  min?: number;
  title?: string;
}) {
  return (
    <label
      className="flex items-center gap-2 text-[11px] text-[#a1a1aa]"
      title={title}
    >
      <span className="w-4 font-mono text-[10px] uppercase text-[#52525b]">
        {label}
      </span>
      <input
        type="number"
        value={value || ""}
        onChange={(e) => onChange(e.target.value + "px")}
        className="flex-1 min-w-0 px-1.5 py-1 rounded bg-[#18181b] border border-[#27272a] text-[#e4e4e7] text-[11px] text-center [appearance:textfield] [&::-webkit-inner-spin-button]:hidden [&::-webkit-outer-spin-button]:hidden focus:border-violet-500/50 focus:outline-none transition-colors"
        min={min}
      />
      <span className="text-[10px] text-[#52525b] font-mono w-5">px</span>
    </label>
  );
}

/* ─── Main component ─── */

interface PropertiesPanelProps {
  selectedElements: ElementInfo[];
  onApplyStyle: (property: string, value: string) => void;
  onDelete?: () => void;
}

export function PropertiesPanel({
  selectedElements,
  onApplyStyle,
  onDelete,
}: PropertiesPanelProps) {
  const first = selectedElements[0];
  if (!first) return null;

  const s = first.styles;
  const count = selectedElements.length;

  return (
    <div className="absolute top-12 right-4 z-20 w-56 rounded-lg border border-[#27272a] bg-[#0d0d0f]/95 backdrop-blur-md shadow-2xl select-none overflow-hidden">
      {/* ── Element header ── */}
      <div className="px-3 pt-2.5 pb-2 border-b border-[#27272a]">
        <div className="flex items-center justify-between">
          <span className="text-[13px] font-semibold text-[#e4e4e7] font-mono">
            &lt;{first.tag}&gt;
          </span>
          {count > 1 && (
            <span className="px-1.5 py-0.5 rounded bg-violet-500/20 text-violet-300 text-[10px] font-mono leading-none">
              &times;{count}
            </span>
          )}
        </div>
        {first.classes && (
          <div className="mt-0.5 text-[10px] text-[#52525b] font-mono truncate">
            .{first.classes.replace(/\s+/g, " .")}
          </div>
        )}
      </div>

      {/* ── Layout section ── */}
      <Section label="Layout">
        <NumberRow
          label="W"
          value={cssPx(s.width)}
          onChange={(v) => onApplyStyle("width", v)}
          min={0}
          title="Width"
        />
        <NumberRow
          label="P"
          value={cssPx(s.paddingTop)}
          onChange={(v) => onApplyStyle("padding", v)}
          min={0}
          title="Padding (all sides)"
        />
        <NumberRow
          label="M"
          value={cssPx(s.marginTop)}
          onChange={(v) => onApplyStyle("margin", v)}
          title="Margin (all sides)"
        />
      </Section>

      {/* ── Typography section ── */}
      <Section label="Typography">
        {/* Alignment */}
        <div className="flex items-center gap-1 text-[11px] text-[#a1a1aa]">
          <span className="text-[10px] text-[#52525b] font-mono w-8">
            Align
          </span>
          <div className="flex items-center gap-0.5 ml-auto">
            {(["start", "center", "end"] as const).map((align) => (
              <button
                key={align}
                onClick={() => onApplyStyle("textAlign", align)}
                className={`w-7 h-7 rounded flex items-center justify-center text-[#a1a1aa] hover:text-[#e4e4e7] hover:bg-[#27272a] transition-colors ${
                  s.textAlign === align ? "bg-[#27272a] text-white" : ""
                }`}
              >
                {align === "start" ? (
                  <AlignLeftIcon />
                ) : align === "center" ? (
                  <AlignCenterIcon />
                ) : (
                  <AlignRightIcon />
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Text color */}
        <ColorRow
          label="Color"
          icon={<PaintIcon />}
          value={parseRgbToHex(s.color)}
          onChange={(v) => onApplyStyle("color", v)}
        />
      </Section>

      {/* ── Background section ── */}
      <Section label="Background" defaultOpen={false}>
        <ColorRow
          label="Fill"
          icon={<PaintIcon />}
          value={parseRgbToHex(s.backgroundColor)}
          onChange={(v) => onApplyStyle("backgroundColor", v)}
        />
      </Section>

      {/* ── Delete ── */}
      {onDelete && (
        <div className="border-t border-[#27272a] px-3 py-2">
          <button
            onClick={onDelete}
            className="flex items-center justify-center gap-1.5 w-full py-1.5 rounded text-[11px] text-[#a1a1aa] hover:text-red-400 hover:bg-red-500/10 transition-colors"
          >
            <TrashIcon />
            <span>Delete element</span>
          </button>
        </div>
      )}
    </div>
  );
}
