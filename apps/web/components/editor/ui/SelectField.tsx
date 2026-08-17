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
    // Estimate menu height (option row 24px + padding 4px)
    const estH = options.length * 24 + 4;
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
      <button
        ref={triggerRef}
        type="button"
        role="combobox"
        aria-haspopup="listbox"
        aria-expanded={open}
        title={title}
        onClick={() => (open ? close() : openMenu())}
        onKeyDown={onTriggerKeyDown}
        className={`flex h-6 items-center justify-between rounded border border-transparent bg-[#1e1e1e] px-1.5 text-[11px] text-[#f0f0f0] outline-none transition-colors hover:bg-[#262626] focus:border-[#aef637] focus:bg-[#262626] focus-visible:border-[#aef637] focus-within:border-[#aef637] focus-within:bg-[#262626] cursor-pointer ${
          grow ? "flex-1 min-w-0" : "w-full min-w-0"
        } ${className}`}
      >
        <span
          className="min-w-0 flex-1 truncate text-left"
          style={{ pointerEvents: "none" }}
        >
          {currentLabel}
        </span>
        <span
          className={`ml-1 flex size-3 shrink-0 items-center justify-center text-[#888888] transition-transform ${
            open ? "rotate-180" : ""
          }`}
        >
          <ChevronIcon />
        </span>
      </button>

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
            className="max-h-56 overflow-y-auto scrollbar-none rounded-md bg-[#2a2a2a] p-0.5 text-[11px] shadow-[0_8px_30px_rgba(0,0,0,0.4)]"
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
                  className={`relative flex h-6 w-full cursor-pointer select-none items-center pl-6 pr-2 text-left text-[#f0f0f0] outline-none transition-colors ${
                    active ? "bg-[#353535]" : ""
                  } ${selected ? "font-medium text-white" : ""}`}
                >
                  {selected && (
                    <span className="absolute left-1.5 text-[#aef637]">
                      <CheckIcon />
                    </span>
                  )}
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
