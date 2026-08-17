"use client";

import { useState } from "react";
import {
  LayoutPanelTop,
  Move,
  Rows3,
  Columns3,
  LayoutGrid,
  MoveHorizontal,
  WrapText,
  Lock,
} from "lucide-react";
import { NumberField } from "./NumberField";

/** Open-pencil Layout section clone. */
export function LayoutSection({
  styles,
  onApplyStyle,
  container = false,
  text = false,
}: {
  styles: Record<string, string>;
  onApplyStyle: (property: string, value: string) => void;
  container?: boolean;
  text?: boolean;
}) {
  const [autoLayout, setAutoLayout] = useState(false);
  const [flow, setFlow] = useState<"none" | "h" | "v" | "grid">("none");
  const [resizing, setResizing] = useState<"hug" | "fill" | "fixed">("fixed");

  const width = parseFloat(styles.width || "0") || 0;
  const height = parseFloat(styles.height || "0") || 0;
  const minW = parseFloat(styles.minWidth || "0") || 0;
  const minH = parseFloat(styles.minHeight || "0") || 0;

  const segItem =
    "flex size-6 cursor-pointer items-center justify-center rounded border-none bg-transparent text-[#888888] outline-none transition-colors hover:bg-[#262626] hover:text-[#f0f0f0]";
  const segActive = "bg-[#2e2e2e] text-[#f0f0f0]";

  return (
    <div className="px-3 py-2.5 border-b border-[#3a3a3a]">
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-semibold text-[#f0f0f0]">
          {autoLayout ? "Auto layout" : "Layout"}
        </span>
        <button
          type="button"
          title="Add auto layout"
          onClick={() => setAutoLayout((v) => !v)}
          className={`flex size-6 shrink-0 cursor-pointer items-center justify-center rounded border-none bg-transparent p-0 text-[#888888] outline-none transition-colors hover:bg-[#353535] hover:text-[#f0f0f0] ${
            autoLayout ? "text-[#aef637] border-[#aef637]" : ""
          }`}
        >
          <LayoutPanelTop className="size-3.5" />
        </button>
      </div>

      {autoLayout && (
        <div className="mt-3 flex items-center gap-0.5" role="toolbar" aria-label="Flow">
          <button
            type="button"
            title="None"
            onClick={() => setFlow("none")}
            className={`${segItem} ${flow === "none" ? segActive : ""}`}
          >
            <Move className="size-3.5" />
          </button>
          <button
            type="button"
            title="Horizontal"
            onClick={() => setFlow("h")}
            className={`${segItem} ${flow === "h" ? segActive : ""}`}
          >
            <Rows3 className="size-3.5" />
          </button>
          <button
            type="button"
            title="Vertical"
            onClick={() => setFlow("v")}
            className={`${segItem} ${flow === "v" ? segActive : ""}`}
          >
            <Columns3 className="size-3.5" />
          </button>
          <button
            type="button"
            title="Grid"
            onClick={() => setFlow("grid")}
            className={`${segItem} ${flow === "grid" ? segActive : ""}`}
          >
            <LayoutGrid className="size-3.5" />
          </button>
        </div>
      )}

      <div className="mt-3 text-[11px] leading-none text-[#888888] mb-1 select-none">
        Dimensions
      </div>
      <div className="grid grid-cols-2 items-center gap-1.5">
        <NumberField
          prefix="W"
          min={1}
          value={width}
          onChange={(v) => onApplyStyle("width", `${Math.max(1, parseFloat(v || "0"))}px`)}
        />
        <NumberField
          prefix="H"
          min={1}
          value={height}
          onChange={(v) => onApplyStyle("height", `${Math.max(1, parseFloat(v || "0"))}px`)}
        />
      </div>

      {container && (
        <>
          <div className="mt-1.5 text-[11px] leading-none text-[#888888] mb-1 select-none">
            Constraints
          </div>
          <div className="grid grid-cols-2 items-center gap-1.5">
            <NumberField
              prefix="Min W"
              min={0}
              value={minW}
              onChange={(v) => onApplyStyle("minWidth", `${Math.max(0, parseFloat(v || "0"))}px`)}
            />
            <NumberField
              prefix="Min H"
              min={0}
              value={minH}
              onChange={(v) => onApplyStyle("minHeight", `${Math.max(0, parseFloat(v || "0"))}px`)}
            />
          </div>
        </>
      )}

      {text && (
        <>
          <div className="mt-1.5 text-[11px] leading-none text-[#888888] mb-1 select-none">
            Resizing
          </div>
          <div className="flex items-center gap-0.5" role="toolbar" aria-label="Resizing">
            <button
              type="button"
              title="Hug contents"
              onClick={() => setResizing("hug")}
              className={`${segItem} ${resizing === "hug" ? segActive : ""}`}
            >
              <MoveHorizontal className="size-3.5" />
            </button>
            <button
              type="button"
              title="Fill container"
              onClick={() => setResizing("fill")}
              className={`${segItem} ${resizing === "fill" ? segActive : ""}`}
            >
              <WrapText className="size-3.5" />
            </button>
            <button
              type="button"
              title="Fixed"
              onClick={() => setResizing("fixed")}
              className={`${segItem} ${resizing === "fixed" ? segActive : ""}`}
            >
              <Lock className="size-3.5" />
            </button>
          </div>
        </>
      )}
    </div>
  );
}
