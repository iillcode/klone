"use client";

import { useState, useRef, useCallback, useEffect, useId } from "react";
import { createPortal } from "react-dom";
import { cn } from "@/lib/utils";
import { ChevronIcon } from "../icons/properties-icons";

/**
 * Compact panel select — faithful React port of open-pencil's `AppSelect`
 * (theme in `src/theme/app-select.ts` + `src/theme/select.ts`):
 *   - trigger: h-6 panel-field (bg #1e1e1e, hover #262626, focus #aef637),
 *     text-[11px], value left-truncated, chevron ml-1 size-3 text-muted
 *   - menu: portal, min-width = trigger width, p-0.5, rounded panel bg
 *     (#2a2a2a), 11px items, h-6 rows, highlight bg (#353535), accent
 *     (#aef637) check indicator at left-1.5
 */
export function PanelSelect({
  value,
  options,
  onChange,
  label,
  className = "",
  dataProperty,
}: {
  value: string;
  options: { value: string; label: string }[];
  onChange: (v: string) => void;
  label?: string;
  className?: string;
  /** Optional data attribute for test/styling parity, e.g. `fill-blend-mode`. */
  dataProperty?: string;
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
  const listboxId = useId();

  const currentLabel = options.find((o) => o.value === value)?.label ?? value;

  const updatePos = useCallback(() => {
    const el = triggerRef.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    // AppSelect viewport padding 4px + rows h-6 (24px each).
    const estH = options.length * 24 + 8;
    const spaceBelow = window.innerHeight - r.bottom;
    let top = r.bottom + 2;
    if (spaceBelow < estH && r.top > estH + 2) top = r.top - estH - 2;
    const left = Math.max(8, Math.min(r.left, window.innerWidth - 200));
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

  // Keep the menu glued to the trigger on scroll/resize while open.
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

  // Close on outside click or Escape.
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
        aria-controls={listboxId}
        aria-label={label}
        onKeyDown={onTriggerKeyDown}
        onClick={() => (open ? close() : openMenu())}
        {...(dataProperty ? { "data-property": dataProperty } : {})}
        className={cn(
          "flex h-6 min-w-0 items-center justify-between rounded border border-transparent bg-[#1e1e1e] px-1.5 text-[11px] text-[#f0f0f0] outline-none transition-colors hover:bg-[#262626] focus:border-[#aef637] focus:bg-[#262626] focus-visible:border-[#aef637] focus-within:border-[#aef637] focus-within:bg-[#262626] disabled:cursor-not-allowed disabled:opacity-60 cursor-pointer",
          className,
        )}
      >
        <span
          className="min-w-0 flex-1 truncate text-left"
          style={{ pointerEvents: "none" }}
        >
          {currentLabel}
        </span>
        <span className="ml-1 flex size-3 shrink-0 items-center justify-center text-[#888888]">
          <ChevronIcon />
        </span>
      </button>

      {open &&
        pos &&
        createPortal(
          <div
            id={listboxId}
            ref={menuRef}
            role="listbox"
            aria-label={label}
            style={{
              position: "fixed",
              top: pos.top,
              left: pos.left,
              minWidth: pos.width,
              zIndex: 9999,
            }}
            className="scrollbar-none max-h-56 overflow-auto rounded-md bg-[#2a2a2a] p-0.5 text-[11px] shadow-[0_8px_30px_rgba(0,0,0,0.4)]"
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
                  className={`relative flex h-6 w-full cursor-pointer items-center pl-6 pr-2 text-left text-[#f0f0f0] outline-none select-none ${
                    active ? "bg-[#353535]" : ""
                  }`}
                >
                  {selected && (
                    <span
                      className="absolute left-1.5 inline-flex items-center justify-center text-[#aef637]"
                      aria-hidden
                    >
                      <svg
                        viewBox="0 0 12 12"
                        width="12"
                        height="12"
                        fill="none"
                      >
                        <path
                          d="M2.5 6.2l2.3 2.3 4.7-5"
                          stroke="currentColor"
                          strokeWidth="1.6"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
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
