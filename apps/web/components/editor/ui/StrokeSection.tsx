"use client";

import { useState } from "react";
import { Plus, Minus, LayoutGrid, Eye, EyeOff } from "lucide-react";
import { ColorRow } from "./Fields";
import { NumberField } from "./NumberField";
import { SelectField } from "./SelectField";

const ALIGN_OPTIONS = [
  { value: "CENTER", label: "Center" },
  { value: "INSIDE", label: "Inside" },
  { value: "OUTSIDE", label: "Outside" },
];

export function StrokeSection({
  styles,
  onApplyStyle,
}: {
  styles: Record<string, string>;
  onApplyStyle: (property: string, value: string) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const [hidden, setHidden] = useState(false);
  const [color, setColor] = useState("#000000");
  const [opacity, setOpacity] = useState(1);
  const weight = Math.round(parseFloat(styles.borderWidth || styles.borderTopWidth || "1"));
  const align = styles.strokeAlign || "CENTER";

  return (
    <div className="py-3.5 border-b border-[#3a3a3a]">
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-semibold text-[#f0f0f0]">Stroke</span>
        <div className="flex items-center gap-0.5">
          <button
            type="button"
            title="Add stroke"
            onClick={() => onApplyStyle("borderWidth", "1px")}
            className="flex size-6 shrink-0 cursor-pointer items-center justify-center rounded border-none bg-transparent p-0 text-[#888888] outline-none transition-colors hover:bg-[#353535] hover:text-[#f0f0f0]"
          >
            <Plus className="size-3.5" />
          </button>
        </div>
      </div>

      <div className="mt-3">
        <ColorRow
          label="Color"
          color={color}
          opacity={opacity}
          hidden={hidden}
          onToggleVisibility={() => setHidden((v) => !v)}
          onChange={setColor}
          onOpacityChange={setOpacity}
          onRemove={() => onApplyStyle("borderWidth", "0px")}
        />
      </div>

      <div className="mt-3 grid grid-cols-[1fr_minmax(0,84px)] items-center gap-1.5">
        <div>
          <div className="text-[11px] leading-none text-[#888888] mb-1 select-none">
            Align
          </div>
          <SelectField
            value={align}
            options={ALIGN_OPTIONS}
            onChange={(v) => onApplyStyle("strokeAlign", v)}
          />
        </div>
        <div>
          <div className="text-[11px] leading-none text-[#888888] mb-1 select-none">
            Weight
          </div>
          <NumberField
            prefix="W"
            min={0}
            value={weight || 0}
            onChange={(v) => onApplyStyle("borderWidth", `${Math.max(0, parseFloat(v || "0"))}px`)}
          />
        </div>
      </div>

      <div className="mt-1.5 flex items-center gap-0.5">
        <button
          type="button"
          title="Independent sides"
          onClick={() => setExpanded((v) => !v)}
          className={`flex size-6 shrink-0 cursor-pointer items-center justify-center rounded border-none bg-transparent p-0 text-[#888888] outline-none transition-colors hover:bg-[#353535] hover:text-[#f0f0f0] ${
            expanded ? "text-[#3b82f6] border-[#3b82f6]" : ""
          }`}
        >
          <LayoutGrid className="size-3" />
        </button>
        <button
          type="button"
          title="Dashed"
          onClick={() =>
            onApplyStyle(
              "borderStyle",
              styles.borderStyle === "dashed" ? "solid" : "dashed",
            )
          }
          className={`flex size-6 shrink-0 cursor-pointer items-center justify-center rounded border-none bg-transparent p-0 text-[#888888] outline-none transition-colors hover:bg-[#353535] hover:text-[#f0f0f0] ${
            styles.borderStyle === "dashed" ? "text-[#3b82f6] border-[#3b82f6]" : ""
          }`}
        >
          <Minus className="size-3" />
        </button>
      </div>

      {expanded && (
        <div className="mt-1.5 grid grid-cols-2 items-center gap-1.5">
          {(["Top", "Right", "Bottom", "Left"] as const).map((side) => (
            <NumberField
              key={side}
              prefix={side[0]}
              min={0}
              value={parseFloat(styles[`border${side}Width`] || "0") || 0}
              onChange={(v) =>
                onApplyStyle(
                  `border${side}Width`,
                  `${Math.max(0, parseFloat(v || "0"))}px`,
                )
              }
            />
          ))}
        </div>
      )}
    </div>
  );
}
