"use client";

import { useEffect, useId, useRef, useState } from "react";
import { createPortal } from "react-dom";
import type { ReactNode } from "react";

/**
 * Minimal, dependency-free dropdown menu used for the card "three-dot" menus.
 * Positions itself over the trigger and closes on outside click / Escape.
 */

interface DropdownMenuProps {
  trigger: ReactNode;
  children: ReactNode;
}

export function DropdownMenu({ trigger, children }: DropdownMenuProps) {
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);
  // The menu is portaled to document.body, so it lives outside wrapRef.
  // Keep a ref to it so the outside-click handler doesn't treat menu
  // interactions as "outside" (which would close the menu before the click
  // on a menu item can fire).
  const menuRef = useRef<HTMLDivElement>(null);
  const menuId = useId();

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      const target = e.target as Node;
      if (
        !wrapRef.current?.contains(target) &&
        !menuRef.current?.contains(target)
      ) {
        setOpen(false);
      }
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const rect = wrapRef.current?.getBoundingClientRect();
  // Prefer opening to the right of the trigger; flip to the left when there
  // isn't enough room (e.g. the trigger sits near the viewport edge).
  const MENU_WIDTH = 180;
  const GAP = 4;
  let horizontal: { left: number } | { right: number };
  if (rect && rect.right + MENU_WIDTH + GAP <= window.innerWidth) {
    horizontal = { left: rect.right + GAP };
  } else if (rect) {
    horizontal = { right: window.innerWidth - (rect.left - GAP) };
  } else {
    horizontal = { left: 0 };
  }
  const menu = open
    ? createPortal(
        <div
          id={menuId}
          ref={menuRef}
          role="menu"
          className="fixed z-50 w-[180px] overflow-hidden rounded-lg border border-[#2d2d2d] bg-[#1f1f1f] shadow-xl shadow-black/40"
          style={{ top: rect ? rect.bottom + 4 : 0, ...horizontal }}
        >
          {children}
        </div>,
        document.body,
      )
    : null;

  return (
    <div ref={wrapRef} className="relative inline-flex">
      <button
        type="button"
        aria-label="Open menu"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={menuId}
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setOpen((v) => !v);
        }}
        className="inline-flex"
      >
        {trigger}
      </button>
      {menu}
    </div>
  );
}

export function DropdownMenuItem({
  children,
  onSelect,
  destructive,
}: {
  children: ReactNode;
  onSelect: () => void;
  destructive?: boolean;
}) {
  return (
    <button
      type="button"
      role="menuitem"
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        onSelect();
      }}
      className={`flex w-full items-center gap-2 px-3 py-2 text-left text-sm transition-colors ${
        destructive
          ? "text-[#f87171] hover:bg-[#3a1d1d]"
          : "text-[#e4e4e7] hover:bg-[#2d2d2d]"
      }`}
    >
      {children}
    </button>
  );
}

export function DropdownMenuTrigger() {
  // Provided for API parity; the trigger is passed as children to DropdownMenu.
  return null;
}

export function DropdownMenuContent() {
  return null;
}
