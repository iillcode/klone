"use client";

import { useState } from "react";
import { Plus, Minus, LayoutGrid } from "lucide-react";
import { ColorRow } from "./Fields";
import { NumberField } from "./NumberField";
import { SelectField } from "./SelectField";
import {
  isTransparentColor,
  parseColorAlpha,
  parseRgbToHex,
  withColorAlpha,
} from "../utils/style-utils";

const ALIGN_OPTIONS = [
  { value: "CENTER", label: "Center" },
  { value: "INSIDE", label: "Inside" },
  { value: "OUTSIDE", label: "Outside" },
];

/**
 * Stroke section — maps the design stroke onto CSS borders. Everything is
 * DERIVED from the element's computed styles (the selection snapshot carries
 * borderColor / borderStyle / per-side widths) and every control writes back
 * through onApplyStyle so changes actually reach the canvas element.
 * Adding a stroke sets border-width; the iframe forces border-style to
 * `solid` in the same message (the CSS initial `none` would otherwise keep a
 * width-only border invisible on template elements).
 */
export function StrokeSection({
  styles,
  onApplyStyle,
}: {
  styles: Record<string, string>;
  onApplyStyle: (property: string, value: string) => void;
}) {
  const [expanded, setExpanded] = useState(false);

  // Weight prefers the just-applied echo (styles.borderWidth) over the
  // selection-time snapshot (borderTopWidth), so the field updates live.
  const weight = Math.round(
    parseFloat(styles.borderWidth || styles.borderTopWidth || "0"),
  );
  const hasStroke = weight > 0;
  const borderStyleVal = styles.borderStyle || "none";
  // "Hidden" = a stroke exists (width > 0) but its style was toggled off.
  const hidden = hasStroke && borderStyleVal === "none";
  const rawColor = styles.borderColor;
  const color = isTransparentColor(rawColor)
    ? "#000000"
    : parseRgbToHex(rawColor);
  const opacity = isTransparentColor(rawColor) ? 1 : parseColorAlpha(rawColor);
  const align = styles.strokeAlign || "CENTER";

  return (
    <div className="px-3 py-2.5 border-b border-[#3a3a3a]">
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

      {/* Controls only appear when the element actually HAS a stroke;
          without one the section shows just the header + add button. */}
      {hasStroke && (
        <>
          <div className="mt-3">
            <ColorRow
              label="Color"
              color={color}
              opacity={opacity}
              hidden={hidden}
              onToggleVisibility={() =>
                onApplyStyle("borderStyle", hidden ? "solid" : "none")
              }
              onChange={(c) => {
                // Picker may return a color with alpha — keep it so the swatch
                // and the element stay in sync.
                const a = parseColorAlpha(c);
                onApplyStyle("borderColor", a < 1 ? withColorAlpha(c, a) : c);
              }}
              onOpacityChange={(a) =>
                onApplyStyle("borderColor", withColorAlpha(color, a))
              }
              // Remove button zeros the stroke width — the element loses
              // its border and this section collapses back to header + add.
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
                expanded ? "text-[#aef637] border-[#aef637]" : ""
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
                styles.borderStyle === "dashed" ? "text-[#aef637] border-[#aef637]" : ""
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
        </>
      )}
    </div>
  );
}
