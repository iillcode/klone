"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

/* ─────────────────────────────────────────────────────────────────────────────
   Custom color editor popover.
   React + Tailwind conversion of the standalone "Custom Color Editor" HTML,
   preserving the visual design exactly (colors, sizes, spacing, radii):
     • Header with Custom / Libraries tabs + add / close actions
     • Fill-type tools row (solid, pattern, grid, image, video, style, droplet,
       color wheel) — active state only, no behavior
     • Saturation/Value square with draggable handle
     • Hue slider, eyedropper + alpha slider
     • Value fields with Hex / RGB / HSL mode switcher
     • "On this page" swatch grid (24 preset swatches, + add-current)
   Rendered via portal so it can float above the editor sidebar.
───────────────────────────────────────────────────────────────────────────── */

type Mode = "hex" | "rgb" | "hsl";
type HSV = { h: number; s: number; v: number };

const clamp = (v: number, min: number, max: number) =>
  Math.min(max, Math.max(min, v));

/* ── Color math (ported verbatim from the reference) ── */
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

/* ── Static gradients & data ── */
const HUE_GRADIENT =
  "linear-gradient(to right,#f00 0%,#ff0 17%,#0f0 33%,#0ff 50%,#00f 67%,#f0f 83%,#f00 100%)";

const INITIAL_SWATCHES = [
  "#ffffff", "#1c1c1c", "#a678c8", "#3f9bd8", "#1ba39a", "#ffffff", "#f25c05", "#141414", "#ffffff",
  "#3f4347", "#12282c", "#efb52c", "#f2a01e", "#f59d84", "#f04a4a", "#ffffff", "#c9a9e4", "#9a4106",
  "#23c2ae", "#ad5518", "#333333", "#2b2b2b", "#2ba3e8", "#000000",
];

const TOOLS = [
  {
    title: "Solid",
    icon: (
      <svg width="15" height="15" viewBox="0 0 16 16">
        <rect x="2.6" y="2.6" width="10.8" height="10.8" rx="2.6" fill="none" stroke="currentColor" strokeWidth="1.7" />
      </svg>
    ),
  },
  {
    title: "Pattern",
    icon: (
      <svg width="15" height="15" viewBox="0 0 16 16" fill="currentColor">
        <circle cx="4" cy="4" r="1.4" />
        <circle cx="8" cy="4" r="1.4" />
        <circle cx="12" cy="4" r="1.4" />
        <circle cx="4" cy="8" r="1.4" />
        <circle cx="8" cy="8" r="1.4" />
        <circle cx="12" cy="8" r="1.4" />
        <circle cx="4" cy="12" r="1.4" />
        <circle cx="8" cy="12" r="1.4" />
        <circle cx="12" cy="12" r="1.4" />
      </svg>
    ),
  },
  {
    title: "Grid",
    icon: (
      <svg width="15" height="15" viewBox="0 0 16 16" fill="currentColor">
        <rect x="2" y="2" width="5.2" height="5.2" rx="1" />
        <rect x="8.8" y="2" width="5.2" height="5.2" rx="1" />
        <rect x="2" y="8.8" width="5.2" height="5.2" rx="1" />
        <rect x="8.8" y="8.8" width="5.2" height="5.2" rx="1" />
      </svg>
    ),
  },
  {
    title: "Image",
    icon: (
      <svg width="15" height="15" viewBox="0 0 16 16">
        <rect x="2" y="3" width="12" height="10" rx="2" fill="none" stroke="currentColor" strokeWidth="1.4" />
        <circle cx="5.6" cy="6.4" r="1.2" fill="currentColor" />
        <path d="M4 11l3-3 2 2 3-3" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    title: "Video",
    icon: (
      <svg width="15" height="15" viewBox="0 0 16 16">
        <rect x="2" y="3" width="12" height="10" rx="2" fill="none" stroke="currentColor" strokeWidth="1.4" />
        <path d="M6.8 6v4l3.6-2z" fill="currentColor" />
      </svg>
    ),
  },
  {
    title: "Style",
    icon: (
      <svg width="15" height="15" viewBox="0 0 16 16">
        <path d="M3 4.5h10M3 8h10M3 11.5h6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    title: "Droplet",
    icon: (
      <svg width="15" height="15" viewBox="0 0 16 16">
        <path
          d="M8 2.2S4 6.6 4 9.4a4 4 0 008 0C12 6.6 8 2.2 8 2.2z"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
        />
      </svg>
    ),
  },
  {
    title: "Color wheel",
    icon: (
      <svg width="15" height="15" viewBox="0 0 16 16">
        <circle cx="8" cy="8" r="5.6" fill="none" stroke="currentColor" strokeWidth="1.4" />
        <path
          d="M8 2.4a5.6 5.6 0 010 11.2 2.8 2.8 0 010-5.6 2.8 2.8 0 000-5.6z"
          fill="currentColor"
        />
      </svg>
    ),
  },
];

/* ── Shared button class strings (themed to the Klone design system) ── */
const iconBtnCls =
  "bg-transparent border-none text-[#a3a3a3] w-[26px] h-[26px] rounded-[5px] cursor-pointer grid place-items-center hover:bg-[#262626] hover:text-[#e4e4e7]";
const fieldInputCls =
  "min-w-0 bg-[#1e1e1e] border border-[#262626] rounded-[6px] text-[#e4e4e7] text-xs px-1.5 py-[6px] text-center outline-none focus:border-[#3b82f6]";
const sliderHandleCls =
  "absolute w-[13px] h-[13px] rounded-full border-[2.5px] border-white bg-black -translate-x-1/2 -translate-y-1/2 top-1/2 shadow-[0_0_0_1px_rgba(0,0,0,0.45)] pointer-events-none";

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
  const [mode, setMode] = useState<Mode>("hex");
  const [tab, setTab] = useState<"custom" | "libraries">("custom");
  const [toolIdx, setToolIdx] = useState(0);
  const [menuOpen, setMenuOpen] = useState(false);
  const [swatches, setSwatches] = useState<string[]>(INITIAL_SWATCHES);
  const [fieldValues, setFieldValues] = useState<string[]>(() => {
    const [r, g, b] = hsvToRgb(init.hsv.h, init.hsv.s, init.hsv.v);
    return [rgbToHex(r, g, b)];
  });
  const [alphaText, setAlphaText] = useState(String(Math.round(init.alpha * 100)));

  const fieldRefs = useRef<(HTMLInputElement | null)[]>([]);
  const alphaRef = useRef<HTMLInputElement>(null);
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

  /* Sync value fields with the model unless the field is being typed in */
  useEffect(() => {
    const [rr, gg, bb] = hsvToRgb(hsv.h, hsv.s, hsv.v);
    let vals: string[];
    if (mode === "hex") vals = [rgbToHex(rr, gg, bb)];
    else if (mode === "rgb") vals = [String(rr), String(gg), String(bb)];
    else {
      const { h, s, l } = rgbToHsl(rr, gg, bb, hsv.h);
      vals = [
        String(Math.round(h)),
        String(Math.round(s * 100)),
        String(Math.round(l * 100)),
      ];
    }
    setFieldValues((prev) =>
      vals.map((v, i) =>
        fieldRefs.current[i] === document.activeElement ? prev[i] ?? v : v,
      ),
    );
  }, [hsv, mode]);

  /* Sync alpha text unless focused */
  useEffect(() => {
    if (alphaRef.current !== document.activeElement) {
      setAlphaText(String(Math.round(alpha * 100)));
    }
  }, [alpha]);

  /* Close on Escape */
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  /* Close the mode menu when clicking anywhere */
  useEffect(() => {
    const close = () => setMenuOpen(false);
    document.addEventListener("click", close);
    return () => document.removeEventListener("click", close);
  }, []);

  const applyRgb = (rgb: [number, number, number]) => {
    const res = rgbToHsv(rgb[0], rgb[1], rgb[2]);
    setHsv((prev) => ({ h: res.h ?? prev.h, s: res.s, v: res.v }));
  };

  const svDrag = useDrag((x, y) =>
    setHsv((prev) => ({ ...prev, s: x, v: 1 - y })),
  );
  const hueDrag = useDrag((x) => setHsv((prev) => ({ ...prev, h: x * 360 })));
  const alphaDrag = useDrag((x) => setAlpha(x));

  const commitHexFrom = (el: HTMLInputElement) => {
    const raw = el.value.trim().replace("#", "");
    if (/^[0-9a-f]{3}$|^[0-9a-f]{6}$/i.test(raw)) {
      applyRgb(hexToRgb(raw));
      // Normalize the display to the parsed value
      setFieldValues((prev) => [raw.toLowerCase()]);
    } else {
      // Invalid input: revert to the current model color
      const [rr, gg, bb] = hsvToRgb(hsv.h, hsv.s, hsv.v);
      setFieldValues((prev) => [rgbToHex(rr, gg, bb)]);
    }
  };

  const onRgbFieldInput = () => {
    const vals = fieldValues.map((v) => parseInt(v, 10));
    if (vals.every((v) => !Number.isNaN(v))) {
      if (mode === "rgb") {
        applyRgb(vals.map((v) => clamp(v, 0, 255)) as [number, number, number]);
      } else {
        applyRgb(
          hslToRgb(
            clamp(vals[0], 0, 360),
            clamp(vals[1], 0, 100) / 100,
            clamp(vals[2], 0, 100) / 100,
          ),
        );
      }
    }
  };

  const handleEyeDrop = async () => {
    const ED = (
      window as unknown as {
        EyeDropper?: new () => { open(): Promise<{ sRGBHex: string }> };
      }
    ).EyeDropper;
    if (!ED) return;
    try {
      const { sRGBHex } = await new ED().open();
      applyRgb(hexToRgb(sRGBHex.slice(1)));
    } catch {
      /* user cancelled */
    }
  };

  const addCurrentSwatch = () => {
    setSwatches((prev) => [...prev, "#" + hex]);
  };

  const modeLabels: Record<Mode, string> = { hex: "Hex", rgb: "RGB", hsl: "HSL" };

  return createPortal(
    <>
      {/* Backdrop: click anywhere outside to close */}
      <div className="fixed inset-0 z-[100]" onClick={onClose} />

      <div
        className="fixed z-[101]"
        style={{ left: position.left, top: position.top }}
      >
        <div
          className="w-[272px] h-max bg-[#161617] border border-[#2a2a2a] rounded-[8px] shadow-[0_10px_30px_rgba(0,0,0,0.55)] text-[#e4e4e7] select-none pb-3"
          style={{
            fontFamily:
              'Inter, -apple-system, "Segoe UI", Roboto, sans-serif',
          }}
        >
          {/* ── Header ── */}
          <div className="flex items-center justify-between px-3 py-2 border-b border-[#262626]">
            <div className="flex gap-1">
              {(["custom", "libraries"] as const).map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setTab(t)}
                  className={`border-none text-xs font-semibold px-2.5 py-[5px] rounded-[5px] cursor-pointer ${
                    tab === t
                      ? "bg-[#2a2a2a] text-white"
                      : "bg-transparent text-[#6f6f6f] hover:text-[#a3a3a3]"
                  }`}
                >
                  {t === "custom" ? "Custom" : "Libraries"}
                </button>
              ))}
            </div>
            <div className="flex gap-0.5">
              <button
                type="button"
                className={iconBtnCls}
                title="Add current color to swatches"
                onClick={addCurrentSwatch}
              >
                <svg width="14" height="14" viewBox="0 0 14 14">
                  <path
                    d="M7 2v10M2 7h10"
                    stroke="currentColor"
                    strokeWidth="1.6"
                    strokeLinecap="round"
                  />
                </svg>
              </button>
              <button
                type="button"
                className={iconBtnCls}
                title="Close"
                onClick={onClose}
              >
                <svg width="13" height="13" viewBox="0 0 14 14">
                  <path
                    d="M3 3l8 8M11 3l-8 8"
                    stroke="currentColor"
                    strokeWidth="1.6"
                    strokeLinecap="round"
                  />
                </svg>
              </button>
            </div>
          </div>

          {tab === "custom" ? (
            <>
              {/* ── Fill-type tools ── */}
              <div className="flex justify-between px-4 pt-2.5 pb-0.5">
                {TOOLS.map((tool, i) => (
                  <button
                    key={tool.title}
                    type="button"
                    title={tool.title}
                    onClick={() => setToolIdx(i)}
                    className={`w-[26px] h-6 border-none rounded-[6px] grid place-items-center cursor-pointer ${
                      toolIdx === i
                        ? "text-white bg-[#2a2a2a] shadow-[inset_0_0_0_1.5px_#52525b]"
                        : "bg-transparent text-[#8f8f8f] hover:text-[#e4e4e7]"
                    }`}
                  >
                    {tool.icon}
                  </button>
                ))}
              </div>

              {/* ── Saturation / Value square ── */}
              <div
                className="relative h-[170px] mx-4 mt-2 rounded-[4px] cursor-crosshair touch-none"
                style={{
                  background: `linear-gradient(to top,#000,rgba(0,0,0,0)), linear-gradient(to right,#fff,hsl(${hsv.h},100%,50%))`,
                }}
                {...svDrag}
              >
                <div
                  className="absolute w-[15px] h-[15px] rounded-full border-[2.5px] border-white bg-black -translate-x-1/2 -translate-y-1/2 shadow-[0_0_0_1px_rgba(0,0,0,0.45)] pointer-events-none"
                  style={{
                    left: `${hsv.s * 100}%`,
                    top: `${(1 - hsv.v) * 100}%`,
                    background: "#" + hex,
                  }}
                />
              </div>

              {/* ── Hue ── */}
              <div
                className="relative h-[12px] rounded-full mx-4 mt-2.5 cursor-pointer touch-none"
                style={{ background: HUE_GRADIENT }}
                {...hueDrag}
              >
                <div
                  className={sliderHandleCls}
                  style={{
                    left: `${(hsv.h / 360) * 100}%`,
                    background: `hsl(${hsv.h},100%,50%)`,
                  }}
                />
              </div>

              {/* ── Eyedropper + Alpha ── */}
              <div className="flex items-center gap-2 mx-4 mt-2.5">
                <button
                  type="button"
                  className={iconBtnCls + " flex-none"}
                  title="Pick color from screen"
                  onClick={handleEyeDrop}
                >
                  <svg width="15" height="15" viewBox="0 0 16 16">
                    <path
                      d="M9.3 4.7l2 2-5.6 5.6-2.4.8.8-2.4zM10.7 3.3l1.1-1.1a1.5 1.5 0 012.1 2.1l-1.1 1.1z"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.4"
                      strokeLinejoin="round"
                    />
                  </svg>
                </button>
                <div
                  className="relative flex-1 h-[12px] rounded-full cursor-pointer touch-none"
                  style={{
                    background: `linear-gradient(to right, rgba(${r},${g},${b},0), rgba(${r},${g},${b},1)), repeating-conic-gradient(#7a7a7a 0% 25%, #4a4a4a 0% 50%) 0 0 / 8px 8px`,
                  }}
                  {...alphaDrag}
                >
                  <div
                    className={sliderHandleCls}
                    style={{
                      left: `${alpha * 100}%`,
                      background: `rgba(${r},${g},${b},${alpha})`,
                    }}
                  />
                </div>
              </div>

              {/* ── Values ── */}
              <div className="flex items-center gap-2 mx-4 mt-2.5">
                <div className="relative flex items-center gap-[5px]">
                  <button
                    type="button"
                    className="flex items-center gap-[5px] px-2 py-[6px] border border-[#2a2a2a] rounded-[6px] bg-transparent text-[#e4e4e7] text-xs cursor-pointer hover:border-[#3d3d3d]"
                    onClick={(e) => {
                      e.stopPropagation();
                      setMenuOpen((o) => !o);
                    }}
                  >
                    <span>{modeLabels[mode]}</span>
                    <svg width="10" height="6" viewBox="0 0 10 6">
                      <path
                        d="M1 1l4 4 4-4"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                      />
                    </svg>
                  </button>
                  {menuOpen && (
                    <div className="absolute top-[calc(100%+4px)] left-0 z-20 min-w-[72px] bg-[#1a1a1a] border border-[#262626] rounded-[6px] overflow-hidden flex flex-col">
                      {(["hex", "rgb", "hsl"] as const).map((m) => (
                        <button
                          key={m}
                          type="button"
                          onClick={() => {
                            setMode(m);
                            setMenuOpen(false);
                          }}
                          className="bg-transparent border-none text-[#e4e4e7] text-xs text-left px-2.5 py-1.5 cursor-pointer hover:bg-[#262626] hover:text-white"
                        >
                          {modeLabels[m]}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                <div className="flex-1 flex gap-1.5 min-w-0">
                  {fieldValues.map((val, i) => (
                    <input
                      key={i}
                      ref={(el) => {
                        fieldRefs.current[i] = el;
                      }}
                      type="text"
                      spellCheck={false}
                      value={val}
                      onChange={(e) => {
                        const raw = e.target.value;
                        setFieldValues((prev) =>
                          prev.map((v, idx) => (idx === i ? raw : v)),
                        );
                        if (mode !== "hex") onRgbFieldInput();
                      }}
                      onBlur={(e) => {
                        if (mode === "hex") commitHexFrom(e.target);
                      }}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && mode === "hex")
                          commitHexFrom(e.target as HTMLInputElement);
                      }}
                      className={"w-full " + fieldInputCls}
                    />
                  ))}
                </div>

                <div className="flex items-center gap-1">
                  <input
                    ref={alphaRef}
                    type="text"
                    inputMode="numeric"
                    value={alphaText}
                    onChange={(e) => {
                      const raw = e.target.value;
                      setAlphaText(raw);
                      const v = parseInt(raw, 10);
                      if (!Number.isNaN(v)) setAlpha(clamp(v, 0, 100) / 100);
                    }}
                    className={"w-[42px] " + fieldInputCls}
                  />
                  <span className="text-[#6f6f6f] text-xs">%</span>
                </div>
              </div>

              {/* ── Swatches ── */}
              <div className="mx-4 mt-3">
                <button
                  type="button"
                  className="w-full flex justify-between items-center px-2.5 py-1.5 bg-transparent border border-[#2a2a2a] rounded-[6px] text-[#e4e4e7] text-xs font-semibold cursor-pointer hover:border-[#3d3d3d]"
                >
                  On this page
                  <svg width="10" height="6" viewBox="0 0 10 6">
                    <path
                      d="M1 1l4 4 4-4"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                    />
                  </svg>
                </button>
                <div className="grid grid-cols-9 gap-[5px] mt-2.5">
                  {swatches.map((c, i) => (
                    <button
                      key={i}
                      type="button"
                      title={"#" + c.replace("#", "")}
                      onClick={() => applyRgb(hexToRgb(c))}
                      className="aspect-square border-none rounded-[5px] cursor-pointer shadow-[inset_0_0_0_1px_rgba(255,255,255,0.09)] transition-transform duration-100 hover:scale-[1.12]"
                      style={{ background: c }}
                    />
                  ))}
                </div>
              </div>
            </>
          ) : (
            <div className="py-8 px-4 text-center text-[#71717a] text-xs">
              <p>No libraries connected.</p>
              <p className="mt-1.5 text-[#6f6f6f]">
                Styles shared to this file will show up here.
              </p>
            </div>
          )}
        </div>
      </div>
    </>,
    document.body,
  );
}
