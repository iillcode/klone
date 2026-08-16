"use client";

import { useEffect, useRef, useState } from "react";
import {
  Frame,
  Image as ImageIcon,
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
 *
 * Rows are also drag sources: dragging a row onto another row repositions
 * the element on the LIVE canvas (insert before, nest inside, or insert
 * after), exactly like Figma's layer reordering. The move is applied
 * through the iframe's reorder-layer handler, so it is one undoable step.
 */

const INDENT = 14;

/** Relative drop position within a target row. */
type DropPosition = "before" | "inner" | "after";

interface DropTarget {
  id: string;
  position: DropPosition;
}

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
      return <ImageIcon className={`${cls} text-[#a1a1aa]`} />;
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
  isExpanded,
  onToggle,
  selectedIds,
  onSelect,
  onScrollTo,
  draggingId,
  dropTarget,
  onDragStart,
  onDragEnd,
  onRowDragOver,
  onDrop,
}: {
  node: LayerNode;
  depth: number;
  /** Resolves the row's open/closed state (manual toggle > selection > default). */
  isExpanded: (node: LayerNode) => boolean;
  onToggle: (id: string) => void;
  selectedIds: Set<string>;
  onSelect: (id: string, additive: boolean) => void;
  onScrollTo?: (id: string, el: HTMLElement) => void;
  /** Id of the row currently being dragged (null when idle). */
  draggingId: string | null;
  /** Current drop indicator location (null when none). */
  dropTarget: DropTarget | null;
  onDragStart: (id: string) => void;
  onDragEnd: () => void;
  onRowDragOver: (e: React.DragEvent, id: string) => void;
  onDrop: (e: React.DragEvent) => void;
}) {
  const isSelected = selectedIds.has(node.id);
  const hasChildren = !!node.children && node.children.length > 0;
  const expanded = isExpanded(node);
  const isDragging = draggingId === node.id;
  const dropPos =
    dropTarget && dropTarget.id === node.id ? dropTarget.position : null;

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
        draggable={node.type !== "page"}
        onDragStart={(e) => {
          e.dataTransfer.effectAllowed = "move";
          e.dataTransfer.setData(
            "application/x-klone-layer",
            JSON.stringify({ id: node.id }),
          );
          onDragStart(node.id);
        }}
        onDragEnd={onDragEnd}
        onDragOver={(e) => onRowDragOver(e, node.id)}
        onDrop={(e) => onDrop(e)}
        onClick={(e) => onSelect(node.id, e.ctrlKey || e.metaKey)}
        className={`group relative flex h-[26px] w-full select-none items-center gap-1 pr-1.5 text-[11px] transition-colors ${
          node.type === "page" ? "cursor-default" : "cursor-pointer"
        } ${
          isSelected
            ? "bg-[#2e2e33] text-[#f4f4f5]"
            : "text-[#a1a1aa] hover:bg-[#1f1f22] hover:text-[#d4d4d8]"
        } ${isDragging ? "opacity-40" : ""} ${
          // "nest" target: Figma-style tint on the whole row.
          dropPos === "inner" ? "bg-[#8b5cf6]/20" : ""
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
        {/* Insertion indicators (lines above / below the row). */}
        {dropPos === "before" && (
          <div className="pointer-events-none absolute top-0 right-1 left-1 h-[2px] rounded-full bg-[#8b5cf6]" />
        )}
        {dropPos === "after" && (
          <div className="pointer-events-none absolute right-1 bottom-0 left-1 h-[2px] rounded-full bg-[#8b5cf6]" />
        )}
      </div>
      {hasChildren &&
        expanded &&
        node.children!.map((child) => (
          <LayerRow
            key={child.id}
            node={child}
            depth={depth + 1}
            isExpanded={isExpanded}
            onToggle={onToggle}
            selectedIds={selectedIds}
            onSelect={onSelect}
            onScrollTo={onScrollTo}
            draggingId={draggingId}
            dropTarget={dropTarget}
            onDragStart={onDragStart}
            onDragEnd={onDragEnd}
            onRowDragOver={onRowDragOver}
            onDrop={onDrop}
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

/** True when `ancestorId` is `id` itself or an ancestor of `id`. */
function isSelfOrDescendant(
  nodes: LayerNode[],
  id: string,
  ancestorId: string,
): boolean {
  if (id === ancestorId) return true;
  for (const n of nodes) {
    if (n.id === ancestorId) {
      return !!findNode(n.children ?? [], id);
    }
    if (n.children && isSelfOrDescendant(n.children, id, ancestorId)) {
      return true;
    }
  }
  return false;
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
  /** Drag & drop reorder: move `id` relative to `targetId`. */
  onReorder?: (
    id: string,
    targetId: string,
    position: "before" | "after" | "inner",
  ) => void;
}

export function LayerTree({
  tree,
  selectedIds,
  onSelect,
  onReorder,
}: LayerTreeProps) {
  const [expandedMap, setExpandedMap] = useState<Record<string, boolean>>({});
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [dropTarget, setDropTarget] = useState<DropTarget | null>(null);
  const rowEls = useRef(new Map<string, HTMLElement>());
  const selected = new Set(selectedIds);
  // The last canvas selection id drives auto-reveal + scroll-into-view.
  const focusId = selectedIds[0] ?? null;
  const didReveal = useRef<string | null>(null);

  // Ancestors of the focused layer are force-expanded (derived, not state -
  // the user's manual fold decisions in expandedMap still override them).
  const derivedExpanded: Record<string, boolean> = {};
  if (focusId) {
    for (const id of ancestorIds(tree, focusId)) derivedExpanded[id] = true;
  }
  const isExpanded = (node: LayerNode): boolean => {
    const manual = expandedMap[node.id];
    if (typeof manual === "boolean") return manual;
    if (derivedExpanded[node.id]) return true;
    return node.type === "page";
  };

  const handleToggle = (id: string) => {
    const node = findNode(tree, id);
    setExpandedMap((prev) => ({
      ...prev,
      [id]: !(node ? isExpanded(node) : true),
    }));
  };

  // When the canvas selection changes, scroll the revealed row into view
  // (expansion itself is derived above - it renders with the new selection).
  useEffect(() => {
    if (!focusId || didReveal.current === focusId) return;
    if (!findNode(tree, focusId)) return;
    didReveal.current = focusId;
    // Rows render the frame after the selection update; defer the scroll.
    const t = requestAnimationFrame(() => {
      rowEls.current.get(focusId)?.scrollIntoView({ block: "nearest" });
    });
    return () => cancelAnimationFrame(t);
  }, [focusId, tree]);

  // ── Drag & drop ──
  // The drop zone depends on where the pointer sits inside the hovered row
  // (Figma behaviour): top quarter = insert before, bottom quarter = insert
  // after, middle half = nest as the last child of the target. Page rows
  // only accept nesting (drop INTO the page), never before/after.
  const computeDropPosition = (
    e: React.DragEvent,
    target: LayerNode,
  ): DropPosition | null => {
    const isPage = target.type === "page";
    if (isPage) return "inner";
    const rect = e.currentTarget.getBoundingClientRect();
    const y = e.clientY - rect.top;
    const h = rect.height;
    if (y < h / 4) return "before";
    if (y > (3 * h) / 4) return "after";
    return "inner";
  };

  const isValidDrop = (targetId: string): boolean => {
    if (!draggingId || draggingId === targetId) return false;
    // Never move a layer into its own subtree - its children would ride
    // along, so nesting into/beside a descendant is the same forbidden
    // move (the iframe rejects it too; this only drives the UI state).
    if (isSelfOrDescendant(tree, targetId, draggingId)) return false;
    return true;
  };

  const handleRowDragOver = (e: React.DragEvent, targetId: string) => {
    if (!draggingId || draggingId === targetId) return;
    const target = findNode(tree, targetId);
    if (!target) return;
    const position = computeDropPosition(e, target);
    if (!position || !isValidDrop(targetId)) {
      // Consume the event but flag the drop as not allowed - keeps the
      // indicator clean without a browser drop-cursor flicker.
      e.preventDefault();
      e.dataTransfer.dropEffect = "none";
      setDropTarget(null);
      return;
    }
    e.preventDefault();
    e.stopPropagation();
    e.dataTransfer.dropEffect = "move";
    setDropTarget((prev) =>
      prev && prev.id === targetId && prev.position === position
        ? prev
        : { id: targetId, position },
    );
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const target = dropTarget;
    const src = draggingId;
    setDropTarget(null);
    setDraggingId(null);
    if (!src || !target || src === target.id) return;
    if (!isValidDrop(target.id)) return;
    onReorder?.(src, target.id, target.position);
  };

  const handleDragEnd = () => {
    setDraggingId(null);
    setDropTarget(null);
  };

  return (
    <div
      role="tree"
      className="h-full w-full overflow-y-auto custom-scroll py-1.5"
      onDragEnd={handleDragEnd}
    >
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
          isExpanded={isExpanded}
          onToggle={handleToggle}
          selectedIds={selected}
          onSelect={onSelect}
          onScrollTo={(id, el) => rowEls.current.set(id, el)}
          draggingId={draggingId}
          dropTarget={dropTarget}
          onDragStart={setDraggingId}
          onDragEnd={handleDragEnd}
          onRowDragOver={handleRowDragOver}
          onDrop={handleDrop}
        />
      ))}
    </div>
  );
}
