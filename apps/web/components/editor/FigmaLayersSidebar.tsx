"use client";

import { useState } from "react";
import {
  GridClosedIcon,
  GridOpenIcon,
  SearchIcon,
  FilterIcon,
  FrameIcon,
  RectIcon,
  TextIcon,
  GroupIcon,
  ImageIcon,
} from "./icons/layers-icons";

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
