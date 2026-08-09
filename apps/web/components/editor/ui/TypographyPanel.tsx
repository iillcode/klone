"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { FONT_FAMILIES, FONT_WEIGHTS } from "../constants";
import { cssPx } from "../utils/style-utils";
import {
  TypographyCaretIcon,
  TypographyStylesIcon,
  LineHeightIcon,
  LetterSpacingIcon,
  SearchIcon,
  ClearIcon,
  FontSettingsIcon,
  CloseIcon,
  CheckIcon,
} from "../icons/properties-icons";

/* Size presets shown in the size caret menu (matches the reference). */
const SIZE_PRESETS = [8, 10, 12, 14, 16, 18, 20, 24, 32, 40, 48, 64, 96];

/* Friendly display name for a CSS font-family value. */
const familyLabel = (v: string): string => {
  const preset = FONT_FAMILIES.find((f) => f.value === v);
  if (preset) return preset.label;
  if (!v) return "Default";
  return v.replace(/['"]/g, "").split(",")[0].trim() || v;
};

/* Small floating-menu hook: positions a portal below/above the trigger and
   closes on outside click / Escape / scroll / resize. */
function useMenu(triggerRef: React.RefObject<HTMLElement | null>) {
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState<{
    top: number;
    left: number;
    width: number;
  } | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  const update = useCallback(() => {
    const el = triggerRef.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const estH = 224;
    const spaceBelow = window.innerHeight - r.bottom;
    let top = r.bottom + 4;
    if (spaceBelow < estH && r.top > estH + 4) top = r.top - estH - 4;
    // Align the menu's left edge with the trigger's left edge; only clamp to
    // keep it on-screen (the menu is at least as wide as the trigger).
    const left = Math.max(8, Math.min(r.left, window.innerWidth - r.width - 8));
    setPos({ top, left, width: r.width });
  }, []);

  useEffect(() => {
    if (!open) return;
    update();
    const reposition = () => update();
    window.addEventListener("scroll", reposition, true);
    window.addEventListener("resize", reposition);
    const onDown = (e: MouseEvent) => {
      const t = e.target as Node;
      if (triggerRef.current?.contains(t)) return;
      if (menuRef.current?.contains(t)) return;
      setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("scroll", reposition, true);
      window.removeEventListener("resize", reposition);
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open, update, triggerRef]);

  return { open, setOpen, pos, menuRef };
}

export function TypographyPanel({
  styles,
  onApplyStyle,
}: {
  styles: Record<string, string>;
  onApplyStyle: (property: string, value: string) => void;
}) {
  const s = styles;

  /* ── Font family ── */
  const currentFamily = s.fontFamily ?? "";
  const fontLabel = familyLabel(currentFamily);

  const [fontsOpen, setFontsOpen] = useState(false);
  const [fontsPos, setFontsPos] = useState<{
    top: number;
    left: number;
  } | null>(null);
  const [search, setSearch] = useState("");
  const [scope, setScope] = useState<"all" | "recents">("all");
  const [recents, setRecents] = useState<string[]>([]);
  const fontBtnRef = useRef<HTMLButtonElement>(null);
  const fontsRef = useRef<HTMLDivElement>(null);
  const scopeWrapRef = useRef<HTMLDivElement>(null);
  const scopeMenu = useMenu(scopeWrapRef);

  const openFonts = () => {
    const r = fontBtnRef.current?.getBoundingClientRect();
    if (!r) return;
    const W = 252;
    const H = 520;
    let left = r.left - W - 8; // pop out to the left of the sidebar
    if (left < 8) left = Math.min(r.right + 8, window.innerWidth - W - 8);
    if (left + W > window.innerWidth - 8)
      left = Math.max(8, window.innerWidth - W - 8);
    let top = r.top;
    if (top + H > window.innerHeight - 8)
      top = Math.max(8, window.innerHeight - H - 8);
    setSearch("");
    setFontsPos({ left, top });
    setFontsOpen(true);
  };

  // Close fonts popover on outside click / Escape
  useEffect(() => {
    if (!fontsOpen) return;
    const onDown = (e: MouseEvent) => {
      const t = e.target as Node;
      if (fontBtnRef.current?.contains(t) || fontsRef.current?.contains(t))
        return;
      setFontsOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setFontsOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [fontsOpen]);

  const pickFont = (value: string) => {
    onApplyStyle("fontFamily", value);
    setRecents((prev) => [value, ...prev.filter((v) => v !== value)].slice(0, 8));
    setFontsOpen(false);
  };

  const q = search.trim().toLowerCase();
  const allFonts = FONT_FAMILIES.map((f) => f.value);
  const source = scope === "recents" ? recents : allFonts;
  const filtered = source.filter((v) =>
    familyLabel(v).toLowerCase().includes(q),
  );

  /* ── Weight ── */
  const rawWeight = s.fontWeight;
  const weightValue =
    rawWeight === "bold"
      ? "700"
      : rawWeight === "normal" || rawWeight === undefined || rawWeight === ""
        ? "400"
        : rawWeight;
  const weightOptions = FONT_WEIGHTS.some((w) => w.value === weightValue)
    ? FONT_WEIGHTS
    : [{ value: weightValue, label: weightValue }, ...FONT_WEIGHTS];
  const weightLabel =
    weightOptions.find((o) => o.value === weightValue)?.label ?? weightValue;
  const weightWrapRef = useRef<HTMLDivElement>(null);
  const weightMenu = useMenu(weightWrapRef);

  /* ── Size ── */
  const sizeValue = cssPx(s.fontSize) || 18;
  const [sizeLocal, setSizeLocal] = useState(String(sizeValue));
  const sizeWrapRef = useRef<HTMLDivElement>(null);
  const sizeMenu = useMenu(sizeWrapRef);

  useEffect(() => {
    // Intentional prop→local sync (see comment above).
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setSizeLocal(String(sizeValue));
  }, [sizeValue]);

  const commitSize = (v: string) => {
    const n = parseFloat(v);
    if (Number.isNaN(n)) {
      setSizeLocal(String(sizeValue));
      return;
    }
    const clamped = Math.min(500, Math.max(1, n));
    setSizeLocal(String(Math.round(clamped * 10) / 10));
    onApplyStyle("fontSize", clamped + "px");
  };

  /* ── Line height ── */
  const rawLh = s.lineHeight;
  const lhValue =
    !rawLh || rawLh === "normal"
      ? "Auto"
      : String(Math.round(parseFloat(rawLh) * 10) / 10);
  const [lhLocal, setLhLocal] = useState(lhValue);

  useEffect(() => {
    // Intentional prop→local sync (see comment above).
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLhLocal(lhValue);
  }, [lhValue]);

  const commitLh = (v: string) => {
    const t = v.trim();
    if (!t || /auto/i.test(t)) {
      setLhLocal("Auto");
      onApplyStyle("lineHeight", "normal");
      return;
    }
    const n = parseFloat(t);
    if (Number.isNaN(n)) {
      setLhLocal(lhValue);
      return;
    }
    setLhLocal(String(Math.round(n * 10) / 10));
    onApplyStyle("lineHeight", n + "px");
  };

  /* ── Letter spacing ── */
  const rawLs = s.letterSpacing;
  const lsUnit = rawLs && rawLs.endsWith("em") ? "em" : "px";
  const lsValue =
    !rawLs || rawLs === "normal"
      ? "0"
      : lsUnit === "em"
        ? String(Math.round(parseFloat(rawLs) * 100 * 10) / 10)
        : String(Math.round(parseFloat(rawLs) * 100) / 100);
  const [lsLocal, setLsLocal] = useState(lsValue);

  useEffect(() => {
    // Intentional prop→local sync (see comment above).
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLsLocal(lsValue);
  }, [lsValue]);

  const commitLs = (v: string) => {
    const n = parseFloat(v);
    if (Number.isNaN(n)) {
      setLsLocal(lsValue);
      return;
    }
    setLsLocal(String(Math.round(n * 100) / 100));
    onApplyStyle(
      "letterSpacing",
      lsUnit === "em" ? n / 100 + "em" : n + "px",
    );
  };

  /* ── Decoration (underline / strike / uppercase) ── */
  const decoLine = s.textDecorationLine ?? "none";
  const underline = decoLine.includes("underline");
  const strike = decoLine.includes("line-through");
  const upper = (s.textTransform ?? "none") === "uppercase";

  const [decoOpen, setDecoOpen] = useState(false);
  const [decoPos, setDecoPos] = useState<{
    top: number;
    left: number;
  } | null>(null);
  const decoMenuRef = useRef<HTMLDivElement>(null);

  const openDeco = (e: React.MouseEvent) => {
    const r = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const estH = 128;
    let top = r.bottom + 4;
    if (window.innerHeight - r.bottom < estH && r.top > estH + 4)
      top = r.top - estH - 4;
    setDecoPos({ top, left: Math.max(8, Math.min(r.left, window.innerWidth - 176)) });
    setDecoOpen(true);
  };

  useEffect(() => {
    if (!decoOpen) return;
    const onDown = (e: MouseEvent) => {
      const t = e.target as Node;
      if (decoMenuRef.current?.contains(t)) return;
      setDecoOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setDecoOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [decoOpen]);

  const toggleDeco = (key: "underline" | "strike" | "upper") => {
    if (key === "upper") {
      onApplyStyle("textTransform", upper ? "none" : "uppercase");
      return;
    }
    const parts: string[] = [];
    if (key === "underline") {
      if (!underline) parts.push("underline");
      if (strike) parts.push("line-through");
    } else {
      if (underline) parts.push("underline");
      if (!strike) parts.push("line-through");
    }
    onApplyStyle("textDecorationLine", parts.join(" ") || "none");
  };

  return (
    <div className="py-3.5">
      {/* ── Panel head: title + styles button ── */}
      <div className="flex items-center justify-between">
        <span className="text-[13px] font-semibold text-[#ffffff]">
          Typography
        </span>
        <button
          type="button"
          title="Text styles"
          onClick={openDeco}
          className="w-6 h-6 grid place-items-center rounded-[6px] text-[#9b9b9b] hover:bg-[#262626] hover:text-[#eaeaea] transition-colors"
        >
          <TypographyStylesIcon />
        </button>
      </div>

      <div className="mt-3 space-y-3">
        {/* ── Font family ── */}
        <button
          ref={fontBtnRef}
          type="button"
          onClick={() => (fontsOpen ? setFontsOpen(false) : openFonts())}
          className="w-full h-[30px] flex items-center justify-between gap-2 bg-[#1e1e1e] rounded-[6px] px-2 transition-colors hover:bg-[#202020] cursor-pointer"
        >
          <span className="min-w-0 truncate text-[12px] text-[#eaeaea]">
            {fontLabel}
          </span>
          <span className="flex-none flex items-center text-[#9b9b9b]">
            <TypographyCaretIcon />
          </span>
        </button>

        {/* ── Weight + Size ── */}
        <div className="grid grid-cols-2 gap-2">
          {/* Weight — field + caret + menu (matches the reference) */}
          <div ref={weightWrapRef} className="relative h-[30px] min-w-0">
            <button
              type="button"
              title="Font weight"
              onClick={() => weightMenu.setOpen((o) => !o)}
              className={`w-full h-full flex items-center justify-between gap-2 bg-[#1e1e1e] rounded-[6px] px-2 transition-colors hover:bg-[#202020] cursor-pointer ${
                weightMenu.open
                  ? "shadow-[inset_0_0_0_1px_#3b82f6]"
                  : ""
              }`}
            >
              <span className="min-w-0 truncate text-[12px] text-[#eaeaea]">
                {weightLabel}
              </span>
              <span className="flex-none flex items-center text-[#9b9b9b]">
                <TypographyCaretIcon />
              </span>
            </button>
            {weightMenu.open &&
              weightMenu.pos &&
              createPortal(
                <div
                  ref={weightMenu.menuRef}
                  style={{
                    position: "fixed",
                    top: weightMenu.pos.top,
                    left: weightMenu.pos.left,
                    minWidth: weightMenu.pos.width,
                    zIndex: 9999,
                  }}
                  className="p-1 bg-[#1a1a1a] border border-[#262626] rounded-[6px] shadow-[0_8px_24px_rgba(0,0,0,0.5)] max-h-[220px] overflow-y-auto custom-scroll"
                >
                  {weightOptions.map((o) => {
                    const selected = o.value === weightValue;
                    return (
                      <button
                        key={o.value}
                        type="button"
                        onClick={() => {
                          onApplyStyle("fontWeight", o.value);
                          weightMenu.setOpen(false);
                        }}
                        className={`w-full flex items-center gap-1.5 px-2 py-1.5 rounded-[4px] text-[12px] text-left transition-colors ${
                          selected
                            ? "text-white"
                            : "text-[#dddddd] hover:bg-[#202020] hover:text-white"
                        }`}
                      >
                        <span className="truncate">{o.label}</span>
                        {selected && (
                          <span className="ml-auto w-4 shrink-0 flex items-center justify-center">
                            <CheckIcon />
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>,
                document.body,
              )}
          </div>

          {/* Size — absolute input + caret button + menu (matches the reference) */}
          <div ref={sizeWrapRef} className="relative h-[30px] min-w-0">
            <input
              type="text"
              inputMode="numeric"
              value={sizeLocal}
              onChange={(e) => setSizeLocal(e.target.value)}
              onBlur={() => commitSize(sizeLocal)}
              onKeyDown={(e) => {
                if (e.key === "Enter") (e.target as HTMLInputElement).blur();
                if (e.key === "ArrowUp") {
                  e.preventDefault();
                  commitSize(String(sizeValue + 1));
                }
                if (e.key === "ArrowDown") {
                  e.preventDefault();
                  commitSize(String(sizeValue - 1));
                }
              }}
              className={`absolute inset-0 w-full h-full bg-[#1e1e1e] rounded-[6px] pl-2.5 pr-6 text-[12px] text-[#eaeaea] focus:outline-none caret-[#3b82f6] transition-shadow ${
                sizeMenu.open
                  ? "shadow-[inset_0_0_0_1px_#3b82f6]"
                  : "focus:shadow-[inset_0_0_0_1px_#3b82f6]"
              }`}
            />
            <button
              type="button"
              title="Font size presets"
              onClick={() => sizeMenu.setOpen((o) => !o)}
              className="absolute right-1 top-[5px] w-5 h-5 grid place-items-center rounded-[4px] text-[#9b9b9b] hover:text-white transition-colors"
            >
              <TypographyCaretIcon />
            </button>
            {sizeMenu.open &&
              sizeMenu.pos &&
              createPortal(
                <div
                  ref={sizeMenu.menuRef}
                  style={{
                    position: "fixed",
                    top: sizeMenu.pos.top,
                    left: sizeMenu.pos.left,
                    minWidth: sizeMenu.pos.width,
                    zIndex: 9999,
                  }}
                  className="p-1 bg-[#1a1a1a] border border-[#262626] rounded-[6px] shadow-[0_8px_24px_rgba(0,0,0,0.5)] max-h-[220px] overflow-y-auto custom-scroll"
                >
                  {SIZE_PRESETS.map((sz) => {
                    const selected = sz === sizeValue;
                    return (
                      <button
                        key={sz}
                        type="button"
                        onClick={() => {
                          commitSize(String(sz));
                          sizeMenu.setOpen(false);
                        }}
                        className={`w-full flex items-center gap-1.5 px-2 py-1.5 rounded-[4px] text-[12px] text-left transition-colors ${
                          selected
                            ? "text-white"
                            : "text-[#dddddd] hover:bg-[#202020] hover:text-white"
                        }`}
                      >
                        <span>{sz}</span>
                        {selected && (
                          <span className="ml-auto w-4 shrink-0 flex items-center justify-center">
                            <CheckIcon />
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>,
                document.body,
              )}
          </div>
        </div>

        {/* ── Line height / Letter spacing ── */}
        <div className="grid grid-cols-2 gap-2">
          <div>
            <div className="text-[11px] text-[#9b9b9b] mb-1.5 select-none">
              Line height
            </div>
            <div className="flex items-center gap-1.5 h-7 bg-[#1e1e1e] rounded-[6px] px-2 border border-transparent transition-colors focus-within:border-[#3b82f6]">
              <span className="flex-none text-[#9b9b9b] flex items-center">
                <LineHeightIcon />
              </span>
              <input
                type="text"
                value={lhLocal}
                onChange={(e) => setLhLocal(e.target.value)}
                onBlur={() => commitLh(lhLocal)}
                onKeyDown={(e) => {
                  if (e.key === "Enter")
                    (e.target as HTMLInputElement).blur();
                }}
                className="w-full min-w-0 bg-transparent text-[13px] text-[#eaeaea] font-mono text-center focus:outline-none caret-[#3b82f6]"
              />
            </div>
          </div>
          <div>
            <div className="text-[11px] text-[#9b9b9b] mb-1.5 select-none">
              Letter spacing
            </div>
            <div className="flex items-center gap-1.5 h-7 bg-[#1e1e1e] rounded-[6px] px-2 border border-transparent transition-colors focus-within:border-[#3b82f6]">
              <span className="flex-none text-[#9b9b9b] flex items-center">
                <LetterSpacingIcon />
              </span>
              <input
                type="text"
                inputMode="decimal"
                value={lsLocal}
                onChange={(e) => setLsLocal(e.target.value)}
                onBlur={() => commitLs(lsLocal)}
                onKeyDown={(e) => {
                  if (e.key === "Enter")
                    (e.target as HTMLInputElement).blur();
                }}
                className="w-full min-w-0 bg-transparent text-[13px] text-[#eaeaea] font-mono text-center focus:outline-none caret-[#3b82f6]"
              />
              <span className="flex-none text-[11px] text-[#9b9b9b] select-none">
                {lsUnit === "em" ? "%" : "px"}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ── Decoration menu ── */}
      {decoOpen &&
        decoPos &&
        createPortal(
          <div
            ref={decoMenuRef}
            style={{
              position: "fixed",
              top: decoPos.top,
              left: decoPos.left,
              zIndex: 9999,
            }}
            className="py-1 min-w-[150px] bg-[#1a1a1a] border border-[#262626] rounded-[6px] shadow-[0_8px_24px_rgba(0,0,0,0.5)]"
          >
            {(
              [
                ["underline", "Underline"],
                ["strike", "Strikethrough"],
                ["upper", "Uppercase"],
              ] as const
            ).map(([key, label]) => {
              const on =
                key === "underline"
                  ? underline
                  : key === "strike"
                    ? strike
                    : upper;
              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => {
                    toggleDeco(key);
                    setDecoOpen(false);
                  }}
                  className={`w-full flex items-center gap-2 pl-2 pr-2.5 h-8 text-[13px] text-left transition-colors ${
                    on ? "text-white" : "text-[#eaeaea] hover:bg-[#202020]"
                  }`}
                >
                  <span className="w-4 shrink-0 flex items-center justify-center">
                    {on && <CheckIcon />}
                  </span>
                  <span>{label}</span>
                </button>
              );
            })}
          </div>,
          document.body,
        )}

      {/* ── Fonts popover ── */}
      {fontsOpen &&
        fontsPos &&
        createPortal(
          <div
            ref={fontsRef}
            style={{
              position: "fixed",
              top: fontsPos.top,
              left: fontsPos.left,
              width: 252,
              zIndex: 100,
            }}
            className="max-h-[540px] bg-[#161617] border border-[#2a2a2a] rounded-[8px] shadow-[0_10px_30px_rgba(0,0,0,0.55)] p-3 flex flex-col"
          >
            {/* Head */}
            <div className="flex items-center justify-between mb-2.5">
              <span className="text-[12px] font-bold text-white">Fonts</span>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  title="Font settings"
                  className="w-6 h-6 grid place-items-center rounded-[5px] text-[#a3a3a3] hover:bg-[#262626] hover:text-[#e4e4e7] transition-colors"
                >
                  <FontSettingsIcon />
                </button>
                <button
                  type="button"
                  title="Close"
                  onClick={() => setFontsOpen(false)}
                  className="w-6 h-6 grid place-items-center rounded-[5px] text-[#a3a3a3] hover:bg-[#262626] hover:text-[#e4e4e7] transition-colors"
                >
                  <CloseIcon />
                </button>
              </div>
            </div>

            {/* Search */}
            <div className="relative mb-2.5">
              <span className="absolute left-2 top-1/2 -translate-y-1/2 text-[#9b9b9b] pointer-events-none flex items-center">
                <SearchIcon />
              </span>
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search for a font"
                autoFocus
                className="w-full h-[30px] bg-[#1e1e1e] border border-[#262626] rounded-[6px] pl-7 pr-7 text-[12px] text-[#e4e4e7] placeholder:text-[#6f6f6f] focus:outline-none focus:border-[#3b82f6] caret-[#3b82f6]"
              />
              {search && (
                <button
                  type="button"
                  title="Clear"
                  onClick={() => setSearch("")}
                  className="absolute right-1.5 top-1/2 -translate-y-1/2 w-5 h-5 grid place-items-center rounded-full text-[#9b9b9b] hover:text-white hover:bg-[#2a2a2a] transition-colors"
                >
                  <ClearIcon />
                </button>
              )}
            </div>

            {/* Scope — field button + menu (matches the reference) */}
            <div ref={scopeWrapRef} className="relative mb-2.5">
              <button
                type="button"
                onClick={() => scopeMenu.setOpen((o) => !o)}
                className="w-full h-[30px] flex items-center justify-between gap-2 bg-[#1e1e1e] rounded-[6px] px-2 transition-colors hover:bg-[#202020] cursor-pointer"
              >
                <span className="truncate text-[12px] text-[#eaeaea]">
                  {scope === "all" ? "All fonts" : "Recents"}
                </span>
                <span className="flex-none flex items-center text-[#9b9b9b]">
                  <TypographyCaretIcon />
                </span>
              </button>
              {scopeMenu.open &&
                scopeMenu.pos &&
                createPortal(
                  <div
                    ref={scopeMenu.menuRef}
                    style={{
                      position: "fixed",
                      top: scopeMenu.pos.top,
                      left: scopeMenu.pos.left,
                      minWidth: scopeMenu.pos.width,
                      zIndex: 9999,
                    }}
                    className="py-1 bg-[#1a1a1a] border border-[#262626] rounded-[6px] shadow-[0_8px_24px_rgba(0,0,0,0.5)] max-h-[220px] overflow-y-auto custom-scroll"
                  >
                    {(
                      [
                        ["all", "All fonts"],
                        ["recents", "Recents"],
                      ] as const
                    ).map(([v, label]) => (
                      <button
                        key={v}
                        type="button"
                        onClick={() => {
                          setScope(v);
                          scopeMenu.setOpen(false);
                        }}
                        className={`w-full flex items-center gap-1.5 pl-2 pr-2.5 h-8 text-[13px] text-left transition-colors ${
                          scope === v
                            ? "text-white"
                            : "text-[#eaeaea] hover:bg-[#202020]"
                        }`}
                      >
                        <span className="truncate">{label}</span>
                        <span className="ml-auto w-4 shrink-0 flex items-center justify-center">
                          {scope === v && <CheckIcon />}
                        </span>
                      </button>
                    ))}
                  </div>,
                  document.body,
                )}
            </div>

            {/* Font list */}
            <div className="overflow-y-auto custom-scroll flex-1 min-h-0 max-h-[300px]">
              {filtered.length === 0 ? (
                <div className="text-[12px] text-[#6f6f6f] py-3 text-center">
                  No fonts found
                </div>
              ) : (
                filtered.map((v) => {
                  // The iframe reports computed styles, where a quoted
                  // family like `'Trebuchet MS', sans-serif` loses its
                  // quotes - compare by normalized display name instead.
                  const selected =
                    familyLabel(v).toLowerCase() ===
                    familyLabel(currentFamily).toLowerCase();
                  return (
                    <button
                      key={v}
                      type="button"
                      onClick={() => pickFont(v)}
                      className={`w-full flex items-center gap-2 h-[34px] px-2.5 rounded-[6px] text-left transition-colors ${
                        selected
                          ? "bg-[#262626] text-white"
                          : "text-[#e6e6e6] hover:bg-[#1e1e1e]"
                      }`}
                    >
                      <span className="w-3 shrink-0 flex items-center justify-center text-white">
                        {selected && (
                          <svg
                            viewBox="0 0 12 12"
                            width="11"
                            height="11"
                            fill="none"
                          >
                            <path
                              d="M2 6.5L4.5 9 10 3.5"
                              stroke="currentColor"
                              strokeWidth="1.8"
                              strokeLinecap="round"
                            />
                          </svg>
                        )}
                      </span>
                      <span
                        className="min-w-0 truncate text-[14px]"
                        style={{ fontFamily: v }}
                      >
                        {familyLabel(v)}
                      </span>
                    </button>
                  );
                })
              )}
            </div>
          </div>,
          document.body,
        )}
    </div>
  );
}
