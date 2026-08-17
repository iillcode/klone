"use client";

import { useState, useEffect } from "react";
import { Eye, EyeOff, SquareRoundCorner, Blend } from "lucide-react";
import { NumberField } from "./NumberField";
import { SelectField } from "./SelectField";

const BLEND_OPTIONS = [
  { value: "NORMAL", label: "Normal" },
  { value: "MULTIPLY", label: "Multiply" },
  { value: "SCREEN", label: "Screen" },
  { value: "OVERLAY", label: "Overlay" },
  { value: "DARKEN", label: "Darken" },
  { value: "LIGHTEN", label: "Lighten" },
  { value: "COLOR_DODGE", label: "Color Dodge" },
  { value: "COLOR_BURN", label: "Color Burn" },
  { value: "HARD_LIGHT", label: "Hard Light" },
  { value: "SOFT_LIGHT", label: "Soft Light" },
  { value: "DIFFERENCE", label: "Difference" },
  { value: "EXCLUSION", label: "Exclusion" },
  { value: "HUE", label: "Hue" },
  { value: "SATURATION", label: "Saturation" },
  { value: "COLOR", label: "Color" },
  { value: "LUMINOSITY", label: "Luminosity" },
];

export function AppearanceSection({
  styles,
  onApplyStyle,
}: {
  styles: Record<string, string>;
  onApplyStyle: (property: string, value: string) => void;
}) {
  const [independentCorners, setIndependentCorners] = useState(false);
  const hidden = (styles.visibility ?? "visible") === "hidden";
  const opacity = Math.round(parseFloat(styles.opacity || "1") * 100);
  const radius = parseFloat(styles.borderRadius || "0") || 0;
  const blend = styles.mixBlendMode || "NORMAL";

  useEffect(() => {
    setIndependentCorners(false);
  }, [styles]);

  return (
    <div className="px-3 py-2.5 border-b border-[#3a3a3a]">
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-semibold text-[#f0f0f0]">Appearance</span>
        <div className="flex items-center gap-0.5">
          <button
            type="button"
            title={hidden ? "Show" : "Hide"}
            onClick={() =>
              onApplyStyle("visibility", hidden ? "visible" : "hidden")
            }
            className={`flex size-6 shrink-0 cursor-pointer items-center justify-center rounded border-none bg-transparent p-0 text-[#888888] outline-none transition-colors hover:bg-[#353535] hover:text-[#f0f0f0] ${
              hidden ? "text-[#aef637]" : ""
            }`}
          >
            {hidden ? <EyeOff className="size-3.5" /> : <Eye className="size-3.5" />}
          </button>
        </div>
      </div>

      <div className="mt-3 grid grid-cols-[1fr_minmax(0,84px)] items-center gap-1.5">
        <div>
          <div className="text-[11px] leading-none text-[#888888] mb-1 select-none">
            Blend
          </div>
          <SelectField
            value={blend}
            options={BLEND_OPTIONS}
            onChange={(v) => onApplyStyle("mixBlendMode", v)}
          />
        </div>
        <div>
          <div className="text-[11px] leading-none text-[#888888] mb-1 select-none">
            Opacity
          </div>
          <NumberField
            icon={<Blend className="size-3" />}
            suffix="%"
            min={0}
            max={100}
            value={opacity}
            onChange={(v) =>
              onApplyStyle(
                "opacity",
                String(Math.min(1, Math.max(0, parseFloat(v || "0") / 100))),
              )
            }
          />
        </div>
      </div>

      <div className="mt-1.5 grid grid-cols-[1fr_auto] items-center gap-1.5">
        <div>
          <div className="text-[11px] leading-none text-[#888888] mb-1 select-none">
            Corner radius
          </div>
          <NumberField
            icon={<SquareRoundCorner className="size-3" />}
            min={0}
            value={radius}
            onChange={(v) => onApplyStyle("borderRadius", `${Math.max(0, parseFloat(v || "0"))}px`)}
          />
        </div>
        <div className="flex h-6 items-center justify-end">
          <button
            type="button"
            title="Independent corner radii"
            onClick={() => setIndependentCorners((v) => !v)}
            className={`flex size-6 shrink-0 cursor-pointer items-center justify-center rounded border-none bg-transparent p-0 text-[#888888] outline-none transition-colors hover:bg-[#353535] hover:text-[#f0f0f0] ${
              independentCorners ? "text-[#aef637] border-[#aef637]" : ""
            }`}
          >
            <SquareRoundCorner className="size-3" />
          </button>
        </div>
      </div>

      {independentCorners && (
        <div className="mt-1.5 grid grid-cols-2 items-center gap-1.5">
          {(["topLeft", "topRight", "bottomLeft", "bottomRight"] as const).map(
            (side) => {
              const prop = `border${side
                .replace(/^[a-z]/, (c) => c.toUpperCase())}Radius` as const;
              const v = parseFloat(styles[prop] || "0") || 0;
              return (
                <NumberField
                  key={side}
                  prefix={side === "topLeft" ? "TL" : side === "topRight" ? "TR" : side === "bottomLeft" ? "BL" : "BR"}
                  min={0}
                  value={v}
                  onChange={(val) =>
                    onApplyStyle(prop, `${Math.max(0, parseFloat(val || "0"))}px`)
                  }
                />
              );
            },
          )}
        </div>
      )}
    </div>
  );
}
