"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { createPortal } from "react-dom";
import { ChevronIcon, CheckIcon } from "../icons/properties-icons";

/* .dropdown — fully custom dropdown (button + portal menu) styled to match the panel */
export function SelectField({
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

  const currentLabel = options.find((o) => o.value === value)?.label ?? value;

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
        className={`relative h-8 bg-[#1e1e1e] rounded-[6px] transition-colors hover:bg-[#202020] ${
          open ? "bg-[#202020]" : ""
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
            className="py-1 bg-[#1a1a1a] border border-[#3f3f46] rounded-[6px] shadow-[0_8px_24px_rgba(0,0,0,0.5)]"
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
                      ? "bg-[#202020] text-white"
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
