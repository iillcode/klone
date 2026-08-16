"use client";

import { useEffect, useRef, useState } from "react";
import {
  Frame,
  Image,
  Circle,
  Square,
  Users,
  Shapes,
  Type,
} from "lucide-react";
import type { LayerNode } from "../HtmlPreview";

/**
 * Open-pencil / Figma-style layer tree for the live template document.
 *
 * The tree itself is produced by the iframe editor script (editor-iframe.ts):
 * every row maps 1:1 to a live element via a stable session id
 * (`data-klone-id`); page frames arrive as `type: "page"` roots. Selection
 * flows both directions: clicking a row selects the element on the canvas,
 * and canvas selections highlight + auto-reveal the matching row.
 */

const INDENT = 14;

function LayerIcon({ type }: { type: LayerNode["type"] }) {
  const cls = "size-[13px] shrink-0";
  switch (type) {
    case "page":
      return <Frame className={`${cls} text-[#9747ff]`} />;
    case "frame":
      return <Square className={`${cls} text-[#a1a1aa]`} />;
    case "text":
      return <Type className={`${cls} text-[#a1a1aa]`} />;
    case "image":
      return <Image className={`${cls} text-[#a1a1aa]`} />;
    case "rectangle":
      return <Circle className={`${cls} text-[#a1a1aa]`} />;
    case "group":
      return <Users className={`${cls} text-[#a1a1aa]`} />;
    case "other":
      return <Shapes className={`${cls} text-[#71717a]`} />;
    default:
      return <Shapes className={`${cls} text-[#71717a]`} />;
  }
}

function Disclosure({
  expanded,
  onToggle,
}: {
  expanded: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      type="button"
      tabIndex={-1}
      onClick={(e) => {
        // Fold/unfold only - never changes the selection.
        e.stopPropagation();
        onToggle();
      }}
      className="flex size-4 shrink-0 cursor-pointer items-center justify-center rounded text-[#71717a] outline-none transition-colors hover:text-[#e4e4e7]"
      aria-label={expanded ? "Collapse" : "Expand"}
    >
      <svg
        width="8"
        height="8"
        viewBox="0 0 8 8"
        fill="none"
        className={`transition-transform duration-100 ${
          expanded ? "rotate-90" : "rotate-0"
        }`}
      >
        <path d="M2.5 1L5.5 4L2.5 7" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </button>
  );
}

function LayerRow({
  node,
  depth,
  expandedMap,
  onToggle,
  selectedIds,
  onSelect,
  onScrollTo,
}: {
  node: LayerNode;
  depth: number;
  expandedMap: Record<string, boolean>;
  onToggle: (id: string) => void;
  selectedIds: Set<string>;
  onSelect: (id: string, additive: boolean) => void;
  onScrollTo?: (id: string, el: HTMLElement) => void;
}) {
  const isSelected = selectedIds.has(node.id);
  const hasChildren = !!node.children && node.children.length > 0;
  // Page frames and frames default to expanded; everything else collapsed.
  const expanded = expandedMap[node.id] ?? node.type === "page";

  return (
    <div
      ref={(el) => {
        if (el) onScrollTo?.(node.id, el);
      }}
    >
      <div
        role="treeitem"
        aria-selected={isSelected}
        data-node-id={node.id}
        onClick={(e) => onSelect(node.id, e.ctrlKey || e.metaKey)}
        className={`group flex h-[26px] w-full cursor-pointer select-none items-center gap-1 pr-1.5 text-[11px] transition-colors ${
          isSelected
            ? "bg-[#2e2e33] text-[#f4f4f5]"
            : "text-[#a1a1aa] hover:bg-[#1f1f22] hover:text-[#d4d4d8]"
        }`}
        style={{ paddingLeft: `${depth * INDENT + 6}px` }}
      >
        {hasChildren ? (
          <Disclosure expanded={expanded} onToggle={() => onToggle(node.id)} />
        ) : (
          <span className="w-4 shrink-0" />
        )}
        <LayerIcon type={node.type} />
        <span className="min-w-0 flex-1 truncate">{node.name}</span>
      </div>
      {hasChildren &&
        expanded &&
        node.children!.map((child) => (
          <LayerRow
            key={child.id}
            node={child}
            depth={depth + 1}
            expandedMap={expandedMap}
            onToggle={onToggle}
            selectedIds={selectedIds}
            onSelect={onSelect}
            onScrollTo={onScrollTo}
          />
        ))}
    </div>
  );
}

/** First node in `tree` whose id is `id` (depth-first). */
function findNode(nodes: LayerNode[], id: string): LayerNode | null {
  for (const n of nodes) {
    if (n.id === id) return n;
    if (n.children) {
      const hit = findNode(n.children, id);
      if (hit) return hit;
    }
  }
  return null;
}

/** Ids of every ancestor of `id` (empty when missing / already top-level). */
function ancestorIds(nodes: LayerNode[], id: string): string[] {
  const path: string[] = [];
  const walk = (list: LayerNode[]): boolean => {
    for (const n of list) {
      if (n.id === id) return true;
      if (n.children) {
        path.push(n.id);
        if (walk(n.children)) return true;
        path.pop();
      }
    }
    return false;
  };
  walk(nodes);
  return path;
}

interface LayerTreeProps {
  tree: LayerNode[];
  /** Currently selected layer ids (kept in sync with the canvas). */
  selectedIds: string[];
  onSelect: (id: string, additive: boolean) => void;
}

export function LayerTree({ tree, selectedIds, onSelect }: LayerTreeProps) {
  const [expandedMap, setExpandedMap] = useState<Record<string, boolean>>({});
  const rowEls = useRef(new Map<string, HTMLElement>());
  const selected = new Set(selectedIds);
  // The last canvas selection id drives auto-reveal + scroll-into-view.
  const focusId = selectedIds[0] ?? null;
  const didReveal = useRef<string | null>(null);

  const handleToggle = (id: string) => {
    setExpandedMap((prev) => {
      const was = prev[id] ?? findNode(tree, id)?.type === "page";
      return { ...prev, [id]: !was };
    });
  };

  // When the canvas selection changes, expand every ancestor of the
  // selected row and scroll it into view - like opening a layer in Figma.
  useEffect(() => {
    if (!focusId || didReveal.current === focusId) return;
    if (!findNode(tree, focusId)) return;
    didReveal.current = focusId;
    const path = ancestorIds(tree, focusId);
    if (path.length > 0) {
      setExpandedMap((prev) => {
        const next = { ...prev };
        for (const id of path) next[id] = true;
        return next;
      });
    }
    // Rows render the frame after the expand update; defer the scroll.
    const t = requestAnimationFrame(() => {
      rowEls.current.get(focusId)?.scrollIntoView({ block: "nearest" });
    });
    return () => cancelAnimationFrame(t);
  }, [focusId, tree]);

  return (
    <div role="tree" className="h-full w-full overflow-y-auto custom-scroll py-1.5">
      {tree.length === 0 && (
        <div className="px-3 py-4 text-[10.5px] text-[#52525b]">
          No layers in this document yet.
        </div>
      )}
      {tree.map((node) => (
        <LayerRow
          key={node.id}
          node={node}
          depth={0}
          expandedMap={expandedMap}
          onToggle={handleToggle}
          selectedIds={selected}
          onSelect={onSelect}
          onScrollTo={(id, el) => rowEls.current.set(id, el)}
        />
      ))}
    </div>
  );
}
