"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Square, Blend, Image as ImageIcon } from "lucide-react";
import { NumberField } from "./NumberField";
import { PanelSelect } from "./PanelSelect";

/* ─────────────────────────────────────────────────────────────────────────────
   Fill color picker — faithful React port of open-pencil's FillPicker
   (src/components/fill-picker/FillPicker.vue) rendering the SOLID branch of
   ColorPickerPanel (src/components/color-picker-panel/*):
     • Fill-type tab row: Solid / Gradient / Image (fill-picker theme tabs)
     • Saturation/Value area (hsb, x=saturation y=brightness, h-140px)
     • Labeled slider rows: Hue + Alpha, each with a 56px number field and a
       white 3.5px-bordered round thumb (color-slider theme)
     • Format select (RGB / HSL / HSB, w-120px) + 3-cell channel input grid
   Popover shell: w-60 p-2 rounded-xl panel bg + open-pencil popover shadow.
───────────────────────────────────────────────────────────────────────────── */

type Format = "rgb" | "hsl" | "hsb";
type FillTab = "SOLID" | "GRADIENT" | "IMAGE";
type HSV = { h: number; s: number; v: number };

const clamp = (v: number, min: number, max: number) =>
  Math.min(max, Math.max(min, v));

/* ── Color math ── */
function rgbFromChroma(
  h: number,
  c: number,
  x: number,
  m: number,
): [number, number, number] {
  let r: number, g: number, b: number;
  if (h < 60) [r, g, b] = [c, x, 0];
  else if (h < 120) [r, g, b] = [x, c, 0];
  else if (h < 180) [r, g, b] = [0, c, x];
  else if (h < 240) [r, g, b] = [0, x, c];
  else if (h < 300) [r, g, b] = [x, 0, c];
  else [r, g, b] = [c, 0, x];
  return [
    Math.round((r + m) * 255),
    Math.round((g + m) * 255),
    Math.round((b + m) * 255),
  ];
}

const hsvToRgb = (h: number, s: number, v: number): [number, number, number] =>
  rgbFromChroma(h, v * s, v * s * (1 - Math.abs(((h / 60) % 2) - 1)), v - v * s);

function hslToRgb(h: number, s: number, l: number): [number, number, number] {
  const c = (1 - Math.abs(2 * l - 1)) * s;
  return rgbFromChroma(
    h,
    c,
    c * (1 - Math.abs(((h / 60) % 2) - 1)),
    l - c / 2,
  );
}

function rgbToHsv(r: number, g: number, b: number): {
  h: number | null;
  s: number;
  v: number;
} {
  r /= 255;
  g /= 255;
  b /= 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const d = max - min;
  let h: number | null = null;
  if (d) {
    if (max === r) h = ((g - b) / d) % 6;
    else if (max === g) h = (b - r) / d + 2;
    else h = (r - g) / d + 4;
    h *= 60;
    if (h < 0) h += 360;
  }
  return { h, s: max ? d / max : 0, v: max };
}

function rgbToHsl(
  r: number,
  g: number,
  b: number,
  fallback = 0,
): { h: number; s: number; l: number } {
  r /= 255;
  g /= 255;
  b /= 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const d = max - min;
  let h = fallback;
  if (d) {
    if (max === r) h = ((g - b) / d) % 6;
    else if (max === g) h = (b - r) / d + 2;
    else h = (r - g) / d + 4;
    h *= 60;
    if (h < 0) h += 360;
  }
  const l = (max + min) / 2;
  return { h, s: d ? d / (1 - Math.abs(2 * l - 1)) : 0, l };
}

const rgbToHex = (r: number, g: number, b: number) =>
  [r, g, b].map((n) => n.toString(16).padStart(2, "0")).join("");

function hexToRgb(hex: string): [number, number, number] {
  let h = hex.replace("#", "");
  if (h.length === 3) h = h.split("").map((c) => c + c).join("");
  const n = parseInt(h, 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

/* ── Static gradients & options ── */
const HUE_GRADIENT =
  "linear-gradient(to right,#f00 0%,#ff0 17%,#0f0 33%,#0ff 50%,#00f 67%,#f0f 83%,#f00 100%)";

/* open-pencil checkerboard under the alpha track (#3a3a3a base, #4a4a4a muted) */
const CHECKERBOARD_BG =
  "bg-[#3a3a3a] bg-[image:linear-gradient(45deg,#4a4a4a_25%,transparent_25%),linear-gradient(-45deg,#4a4a4a_25%,transparent_25%),linear-gradient(45deg,transparent_75%,#4a4a4a_75%),linear-gradient(-45deg,transparent_75%,#4a4a4a_75%)] bg-[size:8px_8px] bg-[position:0_0,0_4px,4px_-4px,-4px_0]";

const FORMAT_OPTIONS = [
  { value: "rgb", label: "RGB" },
  { value: "hsl", label: "HSL" },
  { value: "hsb", label: "HSB" },
];

const CHANNEL_LABELS: Record<Format, [string, string, string]> = {
  rgb: ["Red", "Green", "Blue"],
  hsl: ["Hue", "Saturation", "Lightness"],
  hsb: ["Hue", "Saturation", "Brightness"],
};

const TABS: { id: FillTab; title: string; icon: React.ReactNode }[] = [
  { id: "SOLID", title: "Solid", icon: <Square className="size-3.5" /> },
  {
    id: "GRADIENT",
    title: "Linear gradient",
    icon: <Blend className="size-3.5" />,
  },
  { id: "IMAGE", title: "Image", icon: <ImageIcon className="size-3.5" /> },
];

/* ── Drag helper: pointer-capture based, clamps to 0..1 ── */
function useDrag(onMove: (x: number, y: number) => void) {
  const rel = (el: HTMLElement, e: { clientX: number; clientY: number }) => {
    const r = el.getBoundingClientRect();
    return {
      x: clamp((e.clientX - r.left) / r.width, 0, 1),
      y: clamp((e.clientY - r.top) / r.height, 0, 1),
    };
  };
  const onPointerDown = (e: React.PointerEvent<HTMLElement>) => {
    e.preventDefault();
    const el = e.currentTarget;
    el.setPointerCapture(e.pointerId);
    const p = rel(el, e);
    onMove(p.x, p.y);
  };
  const onPointerMove = (e: React.PointerEvent<HTMLElement>) => {
    const el = e.currentTarget;
    if (!el.hasPointerCapture(e.pointerId)) return;
    const p = rel(el, e);
    onMove(p.x, p.y);
  };
  const onPointerUp = (e: React.PointerEvent<HTMLElement>) => {
    const el = e.currentTarget;
    if (el.hasPointerCapture(e.pointerId)) el.releasePointerCapture(e.pointerId);
  };
  return { onPointerDown, onPointerMove, onPointerUp };
}

/* Channel triple for the active format, derived from the HSV model. */
function channelsFor(fmt: Format, hsv: HSV): [number, number, number] {
  const [r, g, b] = hsvToRgb(hsv.h, hsv.s, hsv.v);
  if (fmt === "rgb") return [r, g, b];
  if (fmt === "hsb")
    return [Math.round(hsv.h), Math.round(hsv.s * 100), Math.round(hsv.v * 100)];
  const { h, s, l } = rgbToHsl(r, g, b, hsv.h);
  return [Math.round(h), Math.round(s * 100), Math.round(l * 100)];
}

/* Convert a committed channel triple back into the HSV model. */
function hsvFromChannels(
  fmt: Format,
  vals: [number, number, number],
  fallbackHue: number,
): HSV {
  if (fmt === "rgb") {
    const { h, s, v } = rgbToHsv(
      clamp(vals[0], 0, 255),
      clamp(vals[1], 0, 255),
      clamp(vals[2], 0, 255),
    );
    return { h: h ?? fallbackHue, s, v };
  }
  if (fmt === "hsb") {
    return {
      h: clamp(vals[0], 0, 360),
      s: clamp(vals[1], 0, 100) / 100,
      v: clamp(vals[2], 0, 100) / 100,
    };
  }
  const [r, g, b] = hslToRgb(
    clamp(vals[0], 0, 360),
    clamp(vals[1], 0, 100) / 100,
    clamp(vals[2], 0, 100) / 100,
  );
  const { h, s, v } = rgbToHsv(r, g, b);
  return { h: h ?? fallbackHue, s, v };
}

function parseInitial(
  value: string,
  alphaProp = 1,
): { hsv: HSV; alpha: number; formatted: string } {
  const a = clamp(alphaProp, 0, 1);
  let r = 0;
  let g = 0;
  let b = 0;
  let hsv: HSV;
  if (/^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(value)) {
    [r, g, b] = hexToRgb(value);
    const { h, s, v } = rgbToHsv(r, g, b);
    hsv = { h: h ?? 25, s, v };
  } else {
    hsv = { h: 25, s: 0, v: 0 };
  }
  // `formatted` mirrors exactly what the emit effect would produce for the
  // initial state, so opening the picker never fires a spurious change.
  const formulated = rgbToHex(r, g, b);
  const formatted =
    a >= 1
      ? "#" + formulated
      : `rgba(${r}, ${g}, ${b}, ${Math.round(a * 100) / 100})`;
  return { hsv, alpha: a, formatted };
}

/* open-pencil slider thumb (color-slider theme) */
const thumbCls =
  "pointer-events-none absolute top-1/2 size-3.5 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white shadow-sm outline-none";

interface ColorPickerProps {
  /** Current color as hex "#rrggbb", or "" for transparent. */
  value: string;
  /** Current alpha (0..1) of the element's color, used to seed the alpha
   * slider so opening the picker never resets opacity to 100%. */
  alpha?: number;
  /** Fixed screen position for the popover (top-left corner). */
  position: { left: number; top: number };
  onChange: (color: string) => void;
  onClose: () => void;
}

export function ColorPicker({
  value,
  alpha: initialAlpha,
  position,
  onChange,
  onClose,
}: ColorPickerProps) {
  const [init] = useState(() => parseInitial(value, initialAlpha));
  const [hsv, setHsv] = useState<HSV>(init.hsv);
  const [alpha, setAlpha] = useState(init.alpha);
  const [tab, setTab] = useState<FillTab>("SOLID");
  const [format, setFormat] = useState<Format>("rgb");
  const [channelText, setChannelText] = useState<string[]>(() =>
    channelsFor("rgb", init.hsv).map(String),
  );

  const channelRefs = useRef<(HTMLInputElement | null)[]>([]);
  const lastEmitted = useRef(init.formatted);

  const [r, g, b] = hsvToRgb(hsv.h, hsv.s, hsv.v);
  const hex = rgbToHex(r, g, b);

  /* Emit on any color change, skipping redundant identical values */
  useEffect(() => {
    const color =
      alpha >= 1
        ? "#" + hex
        : `rgba(${r}, ${g}, ${b}, ${Math.round(alpha * 100) / 100})`;
    if (color !== lastEmitted.current) {
      lastEmitted.current = color;
      onChange(color);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hsv, alpha]);

  /* Sync channel fields with the model unless a field is being typed in */
  useEffect(() => {
    const vals = channelsFor(format, hsv).map(String);
    setChannelText((prev) =>
      vals.map((v, i) =>
        channelRefs.current[i] === document.activeElement ? (prev[i] ?? v) : v,
      ),
    );
  }, [hsv, format]);

  /* Close on Escape */
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const svDrag = useDrag((x, y) =>
    setHsv((prev) => ({ ...prev, s: x, v: 1 - y })),
  );
  const hueDrag = useDrag((x) => setHsv((prev) => ({ ...prev, h: x * 360 })));
  const alphaDrag = useDrag((x) => setAlpha(x));

  const commitChannels = () => {
    const nums = channelText.map((v) => parseInt(v, 10));
    if (nums.some((n) => Number.isNaN(n))) {
      setChannelText(channelsFor(format, hsv).map(String));
      return;
    }
    setHsv(hsvFromChannels(format, [nums[0], nums[1], nums[2]], hsv.h));
  };

  return createPortal(
    <>
      {/* Backdrop: click anywhere outside to close */}
      <div className="fixed inset-0 z-[100]" onClick={onClose} />

      <div
        className="fixed z-[101]"
        style={{ left: position.left, top: position.top }}
      >
        {/* open-pencil popover content: w-60 p-2 rounded-xl bg-panel */}
        <div
          data-picker-content
          className="w-60 rounded-xl bg-[#2a2a2a] p-2 text-[11px] text-[#f0f0f0] shadow-[0_8px_30px_rgba(0,0,0,0.4)] select-none"
        >
          {/* ── Fill-type tabs (fill-picker theme) ── */}
          <div className="mb-2 flex items-center gap-0.5">
            {TABS.map((t) => {
              const active = tab === t.id;
              return (
                <button
                  key={t.id}
                  type="button"
                  title={t.title}
                  aria-label={t.title}
                  data-active={active || undefined}
                  data-test-id={`fill-picker-tab-${t.id.toLowerCase()}`}
                  onClick={() => setTab(t.id)}
                  className={`flex size-6 cursor-pointer items-center justify-center rounded border-none p-0 transition-colors outline-none focus-visible:ring-1 focus-visible:ring-[#3b82f6] ${
                    active
                      ? "bg-[#353535] text-[#f0f0f0]"
                      : "text-[#888888] hover:bg-[#353535] hover:text-[#f0f0f0]"
                  }`}
                >
                  {t.icon}
                </button>
              );
            })}
          </div>

          {tab === "SOLID" ? (
            /* ── ColorPickerPanel: area + sliders + format controls ── */
            <div className="flex flex-col gap-2">
              {/* Saturation / Value area (hsb, x=saturation y=brightness) */}
              <div
                className="relative h-[140px] w-full cursor-crosshair touch-none overflow-hidden rounded"
                style={{
                  background: `linear-gradient(to top,#000,rgba(0,0,0,0)), linear-gradient(to right,#fff,hsl(${hsv.h},100%,50%))`,
                }}
                {...svDrag}
              >
                <div
                  className="pointer-events-none absolute size-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white shadow-sm"
                  style={{
                    left: `${hsv.s * 100}%`,
                    top: `${(1 - hsv.v) * 100}%`,
                    background: "#" + hex,
                  }}
                />
              </div>

              {/* Hue slider row */}
              <div className="flex items-center gap-2">
                <span className="w-7 shrink-0 text-[10px] font-medium text-[#888888]">
                  Hue
                </span>
                <div
                  className="relative h-3 flex-1 cursor-pointer touch-none select-none rounded-md"
                  style={{ background: HUE_GRADIENT }}
                  {...hueDrag}
                >
                  <div
                    className={thumbCls}
                    style={{
                      left: `${(hsv.h / 360) * 100}%`,
                      background: `hsl(${hsv.h},100%,50%)`,
                    }}
                  />
                </div>
                <NumberField
                  className="w-14 flex-none shrink-0"
                  min={0}
                  max={360}
                  value={Math.round(hsv.h)}
                  onChange={(v) =>
                    setHsv((prev) => ({
                      ...prev,
                      h: clamp(parseFloat(v || "0"), 0, 360),
                    }))
                  }
                />
              </div>

              {/* Alpha slider row (checkerboard track) */}
              <div className="flex items-center gap-2">
                <span className="w-7 shrink-0 text-[10px] font-medium text-[#888888]">
                  Alpha
                </span>
                <div
                  className={`relative h-3 flex-1 cursor-pointer touch-none select-none rounded-md ${CHECKERBOARD_BG}`}
                  {...alphaDrag}
                >
                  <div
                    className="absolute inset-0 overflow-hidden rounded-md"
                    style={{
                      background: `linear-gradient(to right, rgba(${r},${g},${b},0), rgba(${r},${g},${b},1))`,
                    }}
                  />
                  <div
                    className={thumbCls}
                    style={{
                      left: `${alpha * 100}%`,
                      background: `rgba(${r},${g},${b},${alpha})`,
                    }}
                  />
                </div>
                <NumberField
                  className="w-14 flex-none shrink-0"
                  suffix="%"
                  min={0}
                  max={100}
                  value={Math.round(alpha * 100)}
                  onChange={(v) =>
                    setAlpha(clamp(parseFloat(v || "0"), 0, 100) / 100)
                  }
                />
              </div>

              {/* Format select (open-pencil FormatControls) */}
              <PanelSelect
                className="w-[120px]"
                value={format}
                label="Color format"
                dataProperty="color-format"
                options={FORMAT_OPTIONS}
                onChange={(v) => setFormat(v as Format)}
              />

              {/* Channel grid (RGBFields-style 3-cell input grid) */}
              <div className="grid grid-cols-[repeat(3,minmax(0,1fr))] gap-px overflow-hidden rounded border border-[#3a3a3a] bg-[#3a3a3a]">
                {channelText.map((val, i) => (
                  <input
                    key={i}
                    ref={(el) => {
                      channelRefs.current[i] = el;
                    }}
                    type="text"
                    inputMode="numeric"
                    spellCheck={false}
                    value={val}
                    aria-label={CHANNEL_LABELS[format][i]}
                    onChange={(e) => {
                      const raw = e.target.value;
                      setChannelText((prev) =>
                        prev.map((v, idx) => (idx === i ? raw : v)),
                      );
                    }}
                    onBlur={() => commitChannels()}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") commitChannels();
                    }}
                    className="w-full bg-[#1e1e1e] px-2 py-1 text-xs text-[#f0f0f0] outline-none"
                  />
                ))}
              </div>
            </div>
          ) : (
            <div className="py-6 text-center text-[11px] text-[#888888]">
              {tab === "GRADIENT" ? "Gradient" : "Image"} fills aren&apos;t
              supported yet.
            </div>
          )}
        </div>
      </div>
    </>,
    document.body,
  );
}
