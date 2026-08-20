"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { SearchIcon, PlusIcon, ComponentsIcon } from "./icons/toolbar-icons";

import type { ComponentGroup } from "@/lib/data/types";
import { cn } from "@/lib/utils";

/* ─── Bottom dock: "Insert component" tool + grouped template library ── */

/** Transparent face for the two dock buttons — no fill, no 3D shadow;
 *  only a subtle hover/active tint so the icons + labels stay readable. */
const dockBtn =
  "inline-flex cursor-pointer select-none items-center justify-center gap-2 border-none font-semibold bg-transparent text-[#ededed] hover:bg-white/5 rounded-[8px] px-3 py-1.5 text-[12.5px] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#52525b]";

interface BottomComponentDockProps {
  /** Grouped template components loaded from the document's own template. */
  groups: ComponentGroup[];
  /** Whether inspect mode is active (gates the structural tools). */
  inspectMode: boolean;
  /** Called when a component is chosen — injects it at the bottom of the doc. */
  onAddComponent: (component: { key: string; html: string; css: string }) => void;
  /** Called when the "Add page" button is pressed. */
  onAddPage: () => void;
  /** Current page count (shown on the Add page button). */
  pageCount: number;
}

export function BottomComponentDock({
  groups,
  inspectMode,
  onAddComponent,
  onAddPage,
  pageCount,
}: BottomComponentDockProps) {
  const [open, setOpen] = useState(false);
  const [closing, setClosing] = useState(false);
  const [query, setQuery] = useState("");
  const [activeGroups, setActiveGroups] = useState<string[]>([]);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Close with a quick exit animation, then unmount the popup.
  const closePopup = () => {
    if (!open || closing) return;
    setClosing(true);
    closeTimer.current = setTimeout(() => {
      setOpen(false);
      setClosing(false);
    }, 140);
  };

  const dockRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  // Clear any pending close timer on unmount.
  useEffect(() => {
    return () => {
      if (closeTimer.current) clearTimeout(closeTimer.current);
    };
  }, []);

  // Initialize the active tab to the first available group.
  useEffect(() => {
    if (groups.length > 0 && activeGroups.length === 0) {
      setActiveGroups([groups[0].name]);
    }
  }, [groups, activeGroups.length]);

  // Close the popup when clicking outside the dock.
  useEffect(() => {
    if (!open) return;
    const onPointerDown = (e: PointerEvent) => {
      if (dockRef.current && !dockRef.current.contains(e.target as Node)) {
        closePopup();
      }
    };
    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, [open]);

  // When inspect mode is turned off, close the library so the user can't
  // insert blocks they can't see selected/highlighted.
  useEffect(() => {
    if (!inspectMode) {
      if (closeTimer.current) clearTimeout(closeTimer.current);
      setOpen(false);
      setClosing(false);
    }
  }, [inspectMode]);

  // Focus the search box when the popup opens.
  useEffect(() => {
    if (open) {
      const t = setTimeout(() => searchRef.current?.focus(), 30);
      return () => clearTimeout(t);
    }
    setQuery("");
  }, [open]);

  const q = query.trim().toLowerCase();

  const visibleGroups = useMemo(() => {
    const tabs = activeGroups.length > 0 ? activeGroups : groups.map((g) => g.name);
    return groups
      .filter((g) => tabs.includes(g.name))
      .map((g) => ({
        ...g,
        components: q
          ? g.components.filter(
              (c) =>
                c.name.toLowerCase().includes(q) ||
                (c.description ?? "").toLowerCase().includes(q) ||
                (c.tags ?? []).some((t) => t.toLowerCase().includes(q)),
            )
          : g.components,
      }))
      .filter((g) => g.components.length > 0);
  }, [groups, activeGroups, q]);

  const toggleGroup = (name: string) => {
    setActiveGroups((prev) =>
      prev.includes(name) ? prev.filter((n) => n !== name) : [...prev, name],
    );
  };

  const handleAdd = (component: ComponentGroup["components"][number]) => {
    if (!inspectMode) return;
    onAddComponent({
      key: component.key,
      html: component.html,
      css: component.css ?? "",
    });
    setOpen(false);
  };

  const hasComponents =
    groups.reduce((sum, g) => sum + g.components.length, 0) > 0;

  // The dock is only shown when inspect mode is active.
  if (!inspectMode) return null;

  return (
    <div
      className="fixed bottom-2 left-1/2 -translate-x-1/2 z-20"
      ref={dockRef}
    >
      {/* Component library popup — centered above the dock */}
      {open && hasComponents && (
        <div className="absolute bottom-[calc(100%+14px)] left-1/2 -translate-x-1/2 w-[560px] max-w-[92vw]">
          <div
            className={`bg-[#1c1c1c] border border-[#262626] rounded-xl shadow-[0_16px_48px_rgba(0,0,0,0.55)] overflow-hidden flex flex-col dock-popup ${closing ? "closing" : ""}`}
          >
          {/* Search */}
          <div className="p-3.5 pb-2.5">
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#71717a] pointer-events-none">
                <SearchIcon className="w-4 h-4" />
              </span>
              <input
                ref={searchRef}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search components"
                spellCheck={false}
                autoComplete="off"
                className="w-full h-10 bg-[#161617] border border-[#262626] rounded-lg text-[#e4e4e7] text-[13px] font-sans pl-9 pr-3 outline-none caret-[#aef637] placeholder:text-[#71717a] focus:border-[#aef637]"
              />
            </div>
          </div>

          {/* Group tabs */}
          {groups.length > 1 && (
            <div className="flex flex-wrap gap-1 px-3.5 pb-2.5">
              {groups.map((g) => (
                <button
                  key={g.name}
                  onClick={() => toggleGroup(g.name)}
                  className={`border text-[12px] font-medium px-2.5 py-1.5 rounded-md transition-colors ${
                    activeGroups.includes(g.name)
                      ? "bg-[#2a2a2a] text-white border-transparent"
                      : "bg-transparent text-[#a1a1aa] border-transparent hover:text-[#e4e4e7]"
                  }`}
                >
                  {g.name}
                </button>
              ))}
            </div>
          )}

          {/* Grouped list */}
          <div className="overflow-y-auto h-[320px] flex-none px-3.5 pb-3 pt-1 border-t border-[#262626] custom-scroll">
            {visibleGroups.length === 0 ? (
              <div className="py-7 text-center text-[#71717a] text-[12.5px]">
                No components match “{query}”
              </div>
            ) : (
              visibleGroups.map((group) => (
                <div key={group.name} className="mb-1">
                  <h4 className="text-[11px] font-medium text-[#71717a] my-2.5">
                    {group.name}
                  </h4>
                  <div className="grid grid-cols-2 gap-1.5">
                    {group.components.map((component) => (
                      <button
                        key={component.key}
                        onClick={() => handleAdd(component)}
                        title={component.description || component.name}
                        className="flex items-center gap-2.5 p-2 rounded-lg text-left hover:bg-[#262626] transition-colors"
                      >
                        <span className="w-5 h-5 flex-none grid place-items-center text-[#a1a1aa]">
                          <ComponentsIcon className="w-4 h-4" />
                        </span>
                        <span className="flex-1 text-[13px] text-[#e4e4e7] truncate">
                          {component.name}
                        </span>
                        <span className="w-3.5 h-3.5 flex-none grid place-items-center text-[#71717a]">
                          <PlusIcon className="w-3.5 h-3.5" />
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              ))
            )}
          </div>
          </div>
        </div>
      )}

      {/* Toolbar */}
      <div className="flex items-center gap-1 bg-[#1e1e1e] border border-[#262626] rounded-xl p-1 shadow-[0_10px_30px_rgba(0,0,0,0.5)]">
        <button
          onClick={() => (open ? closePopup() : setOpen(true))}
          disabled={!hasComponents}
          title={
            hasComponents
              ? "Insert component"
              : "No components in this template"
          }
          className={cn(
            dockBtn,
            // Subtle pressed-state cue.
            open && "bg-white/10",
            "disabled:cursor-not-allowed disabled:pointer-events-none disabled:opacity-50",
          )}
        >
          <ComponentsIcon className="w-[19px] h-[19px]" />
          <span className="text-[13px] font-medium">Components</span>
        </button>

        <span className="w-px h-5 bg-[#262626] mx-0.5" />

        <button
          onClick={onAddPage}
          title="Add page"
          className={dockBtn}
        >
          <PlusIcon className="w-[19px] h-[19px]" />
          <span className="text-[13px] font-medium">Add page</span>
          {pageCount > 1 && (
            <span className="text-[10px] text-[#71717a] font-mono ml-0.5">
              {pageCount}
            </span>
          )}
        </button>
      </div>
    </div>
  );
}
