"use client";

import { useState, type SVGProps } from "react";

/* ─── Icons ─── */

/* Grid icon – closed state (outlined) */
function GridClosedIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      className="w-3 h-3 shrink-0"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={1.6}
      {...props}
    >
      <rect x="4" y="4" width="7" height="7" rx="1" />
      <rect x="13" y="4" width="7" height="7" rx="1" />
      <rect x="4" y="13" width="7" height="7" rx="1" />
      <rect x="13" y="13" width="7" height="7" rx="1" />
    </svg>
  );
}

/* Grid icon – open state (filled) */
function GridOpenIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      className="w-3 h-3 shrink-0"
      fill="currentColor"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={1.6}
      {...props}
    >
      <rect x="4" y="4" width="7" height="7" rx="1" />
      <rect x="13" y="4" width="7" height="7" rx="1" />
      <rect x="4" y="13" width="7" height="7" rx="1" />
      <rect x="13" y="13" width="7" height="7" rx="1" />
    </svg>
  );
}

function SearchIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      className="w-3.5 h-3.5"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2}
      {...props}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z"
      />
    </svg>
  );
}

function FilterIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      className="w-3.5 h-3.5"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={1.8}
      {...props}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M12 3c2.755 0 5.455.232 8.083.678.533.09.917.556.917 1.096v1.044a2.25 2.25 0 01-.659 1.591l-5.432 5.432a2.25 2.25 0 00-.659 1.591v2.927a2.25 2.25 0 01-1.244 2.013L9.75 21v-6.568a2.25 2.25 0 00-.659-1.591L3.659 7.409A2.25 2.25 0 013 5.818V4.774c0-.54.384-1.006.917-1.096A48.32 48.32 0 0112 3z"
      />
    </svg>
  );
}

/* ─── Layer type icons ─── */

function FrameIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className ?? "w-3.5 h-3.5"}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={1.6}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M3.75 3.75v4.5m0-4.5h4.5m-4.5 0L9 9M3.75 20.25v-4.5m0 4.5h4.5m-4.5 0L9 15M20.25 3.75h-4.5m4.5 0v4.5m0-4.5L15 9m5.25 11.25h-4.5m4.5 0v-4.5m0 4.5L15 15"
      />
    </svg>
  );
}

function RectIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className ?? "w-3.5 h-3.5"}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={1.6}
    >
      <rect x="3" y="3" width="18" height="18" rx="2" />
    </svg>
  );
}

function TextIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className ?? "w-3.5 h-3.5"}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M7.5 8.25h9m-9 3H12m-9.75 1.51c0 1.6 1.123 2.994 2.707 3.227 1.129.166 2.27.293 3.423.379.35.026.67.21.865.501L12 21l2.755-4.133a1.14 1.14 0 01.865-.501 48.172 48.172 0 003.423-.379c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0012 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018z"
      />
    </svg>
  );
}

function GroupIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className ?? "w-3.5 h-3.5"}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={1.6}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z"
      />
    </svg>
  );
}

function ImageIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className ?? "w-3.5 h-3.5"}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={1.6}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909M3.75 21h16.5a1.5 1.5 0 001.5-1.5V5.25a1.5 1.5 0 00-1.5-1.5H3.75a1.5 1.5 0 00-1.5 1.5v14.25a1.5 1.5 0 001.5 1.5z"
      />
    </svg>
  );
}

function getLayerIcon(type: LayerItem["type"]) {
  switch (type) {
    case "frame":
      return <FrameIcon className="w-3.5 h-3.5 text-[#a1a1aa]" />;
    case "rectangle":
      return <RectIcon className="w-3.5 h-3.5 text-[#a1a1aa]" />;
    case "text":
      return <TextIcon className="w-3.5 h-3.5 text-[#a1a1aa]" />;
    case "group":
      return <GroupIcon className="w-3.5 h-3.5 text-[#a1a1aa]" />;
    case "image":
      return <ImageIcon className="w-3.5 h-3.5 text-[#a1a1aa]" />;
    default:
      return <RectIcon className="w-3.5 h-3.5 text-[#52525b]" />;
  }
}

/* ─── Layer tree item ─── */

interface LayerItem {
  id: string;
  name: string;
  type:
    | "frame"
    | "rectangle"
    | "text"
    | "group"
    | "image"
    | "ellipse"
    | "line"
    | "other";
  children?: LayerItem[];
  expanded?: boolean;
}

function LayerRow({
  item,
  depth,
  selectedId,
  onSelect,
}: {
  item: LayerItem;
  depth: number;
  selectedId: string | null;
  onSelect: (id: string) => void;
}) {
  const [expanded, setExpanded] = useState(item.expanded ?? false);
  const hasChildren = item.children && item.children.length > 0;
  const isSelected = selectedId === item.id;

  return (
    <div>
      <div
        onClick={() => {
          onSelect(item.id);
          if (hasChildren) setExpanded(!expanded);
        }}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            onSelect(item.id);
            if (hasChildren) setExpanded(!expanded);
          }
        }}
        className={`flex items-center w-full h-[26px] text-[11px] hover:bg-[#27272a] transition-colors group cursor-pointer ${
          isSelected ? "bg-[#2d2d30] text-white" : "text-[#a1a1aa]"
        }`}
        style={{ paddingLeft: `${depth * 14 + 8}px` }}
      >
        {/* Layer type icon */}
        <span className="w-5 h-5 flex items-center justify-center shrink-0 ml-0.5">
          {getLayerIcon(item.type)}
        </span>

        {/* Layer name */}
        <span className="truncate ml-1.5 font-mono text-[11px]">
          {item.name}
        </span>
      </div>

      {/* Children */}
      {hasChildren && expanded && (
        <div>
          {item.children!.map((child) => (
            <LayerRow
              key={child.id}
              item={child}
              depth={depth + 1}
              selectedId={selectedId}
              onSelect={onSelect}
            />
          ))}
        </div>
      )}
    </div>
  );
}

/* ─── Default layer tree data ─── */

const DEFAULT_LAYERS: LayerItem[] = [
  {
    id: "desktop-1",
    name: "Desktop - 1",
    type: "frame",
    expanded: true,
    children: [
      { id: "rect-35", name: "Rectangle 35", type: "rectangle" },
      { id: "rect-34", name: "Rectangle 34", type: "rectangle" },
      { id: "rect-33", name: "Rectangle 33", type: "rectangle" },
      { id: "group-2", name: "Group 2", type: "group" },
      { id: "text-sync", name: "Changes found please sync", type: "text" },
      { id: "repeat", name: "repeat", type: "other" },
      { id: "sync", name: "Sync", type: "text" },
      { id: "rect-13", name: "Rectangle 13", type: "rectangle" },
      { id: "rect-30", name: "Rectangle 30", type: "rectangle" },
      { id: "rect-9", name: "Rectangle 9", type: "rectangle" },
      { id: "arrow", name: "arrow-left-short", type: "other" },
      { id: "rect-2", name: "Rectangle 2", type: "rectangle" },
      { id: "editor-tree-1", name: "Editor tree", type: "text" },
      { id: "editor-tree-2", name: "Editor tree", type: "text" },
      { id: "rect-1", name: "Rectangle 1", type: "rectangle" },
    ],
  },
  {
    id: "desktop-2",
    name: "Desktop - 2",
    type: "frame",
    children: [
      { id: "rect-2-1", name: "Rectangle 1", type: "rectangle" },
      { id: "rect-2-2", name: "Rectangle 2", type: "rectangle" },
    ],
  },
  {
    id: "desktop-3",
    name: "Desktop - 3",
    type: "frame",
    children: [{ id: "rect-3-1", name: "Rectangle 1", type: "rectangle" }],
  },
];

/* ─── Main sidebar component ─── */

interface FigmaLayersSidebarProps {
  selectedLayerId?: string | null;
  onSelectLayer?: (id: string) => void;
  layers?: LayerItem[];
}

export function FigmaLayersSidebar({
  selectedLayerId,
  onSelectLayer,
  layers = DEFAULT_LAYERS,
}: FigmaLayersSidebarProps) {
  const [selectedId, setSelectedId] = useState<string | null>(
    selectedLayerId ?? null,
  );
  const [layersExpanded, setLayersExpanded] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  const handleSelect = (id: string) => {
    setSelectedId(id);
    onSelectLayer?.(id);
  };

  return (
    <div className="w-60 shrink-0 h-full flex flex-col bg-[#1e1e1e] border-r border-[#2d2d2d] select-none overflow-hidden">
      {/* ── Layers section ── */}
      <div className="flex-1 flex flex-col min-h-0">
        <div className="shrink-0 flex items-center justify-between w-full px-3 h-8 text-[11px] font-semibold text-[#a1a1aa]">
          <div
            role="button"
            tabIndex={0}
            onClick={() => setLayersExpanded(!layersExpanded)}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ")
                setLayersExpanded(!layersExpanded);
            }}
            className="flex items-center gap-1.5 cursor-pointer hover:text-[#d4d4d8] transition-colors"
          >
            {layersExpanded ? (
              <GridOpenIcon className="w-3 h-3" />
            ) : (
              <GridClosedIcon className="w-3 h-3" />
            )}
            <span>Layers</span>
          </div>
          <button className="w-5 h-5 flex items-center justify-center rounded hover:bg-[#3f3f46] text-[#71717a] hover:text-[#a1a1aa]">
            <FilterIcon className="w-3 h-3" />
          </button>
        </div>

        {layersExpanded && (
          <div className="flex-1 overflow-y-auto custom-scroll">
            {/* Search bar */}
            <div className="px-2 pb-1.5">
              <div className="flex items-center h-7 px-2 rounded bg-[#2d2d30] border border-[#3f3f46] focus-within:border-[#52525b] transition-colors">
                <SearchIcon className="w-3 h-3 text-[#71717a] shrink-0" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search layers..."
                  className="flex-1 ml-1.5 bg-transparent text-[11px] text-[#e4e4e7] placeholder:text-[#52525b] outline-none"
                />
              </div>
            </div>

            {/* Layer tree */}
            <div className="pb-2">
              {layers.map((item) => (
                <LayerRow
                  key={item.id}
                  item={item}
                  depth={0}
                  selectedId={selectedId}
                  onSelect={handleSelect}
                />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
