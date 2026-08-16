"use client";

import { useState } from "react";
import { Plus, Trash2, Eye, EyeOff, Blend } from "lucide-react";
import { NumberField } from "./NumberField";
import { SelectField } from "./SelectField";

const EFFECT_OPTIONS = [
  { value: "DROP_SHADOW", label: "Drop shadow" },
  { value: "INNER_SHADOW", label: "Inner shadow" },
  { value: "LAYER_BLUR", label: "Layer blur" },
  { value: "BACKGROUND_BLUR", label: "Background blur" },
];

const BLEND_OPTIONS = [
  { value: "NORMAL", label: "Normal" },
  { value: "MULTIPLY", label: "Multiply" },
  { value: "SCREEN", label: "Screen" },
  { value: "OVERLAY", label: "Overlay" },
];

/** Open-pencil Effects section clone (single editable shadow). */
export function EffectsSection({
  styles,
  onApplyStyle,
}: {
  styles: Record<string, string>;
  onApplyStyle: (property: string, value: string) => void;
}) {
  const [hasEffect, setHasEffect] = useState(false);
  const [type, setType] = useState("DROP_SHADOW");
  const [hidden, setHidden] = useState(false);
  const [expanded, setExpanded] = useState(true);

  const shadow = styles.boxShadow;
  const parts = shadow?.match(/(-?\d+(\.\d+)?)px/g) ?? [];
  const x = parts[0] ? parseFloat(parts[0]) : 0;
  const y = parts[1] ? parseFloat(parts[1]) : 0;
  const blur = parts[2] ? parseFloat(parts[2]) : 0;
  const spread = parts[3] ? parseFloat(parts[3]) : 0;

  const applyShadow = (nx: number, ny: number, nb: number, ns: number) => {
    onApplyStyle(
      "boxShadow",
      `${nx}px ${ny}px ${nb}px ${ns}px rgba(0,0,0,0.25)`,
    );
    setHasEffect(true);
  };

  return (
    <div className="px-3 py-2.5 border-b border-[#3a3a3a]">
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-semibold text-[#f0f0f0]">Effects</span>
        <div className="flex items-center gap-0.5">
          <button
            type="button"
            title="Add effect"
            onClick={() => {
              setHasEffect(true);
              applyShadow(0, 2, 4, 0);
            }}
            className="flex size-6 shrink-0 cursor-pointer items-center justify-center rounded border-none bg-transparent p-0 text-[#888888] outline-none transition-colors hover:bg-[#353535] hover:text-[#f0f0f0]"
          >
            <Plus className="size-3.5" />
          </button>
        </div>
      </div>

      {hasEffect && (
        <div className="mt-3">
          <div className="flex min-w-0 items-center gap-1.5">
            <button
              type="button"
              title={expanded ? "Collapse" : "Expand"}
              onClick={() => setExpanded((v) => !v)}
              className="flex size-5 shrink-0 cursor-pointer items-center justify-center overflow-hidden rounded border border-[#3a3a3a] bg-[#1e1e1e] p-0"
            >
              {type === "LAYER_BLUR" || type === "BACKGROUND_BLUR" ? (
                <Blend className="size-3 text-[#888888]" />
              ) : (
                <span
                  className="size-full border-0"
                  style={{ backgroundColor: "rgba(0,0,0,0.25)" }}
                />
              )}
            </button>
            <div className="min-w-0 flex-1">
              <SelectField
                value={type}
                options={EFFECT_OPTIONS}
                onChange={setType}
              />
            </div>
            <button
              type="button"
              title={hidden ? "Show" : "Hide"}
              onClick={() => setHidden((v) => !v)}
              className={`flex size-6 shrink-0 cursor-pointer items-center justify-center rounded border-none bg-transparent p-0 text-[#888888] outline-none transition-colors hover:bg-[#353535] hover:text-[#f0f0f0] ${
                hidden ? "text-[#3b82f6]" : ""
              }`}
            >
              {hidden ? <EyeOff className="size-3.5" /> : <Eye className="size-3.5" />}
            </button>
            <button
              type="button"
              title="Remove"
              onClick={() => {
                setHasEffect(false);
                onApplyStyle("boxShadow", "none");
              }}
              className="flex size-6 shrink-0 cursor-pointer items-center justify-center rounded border-none bg-transparent p-0 text-[#888888] outline-none transition-colors hover:bg-[#353535] hover:text-[#f0f0f0]"
            >
              <Trash2 className="size-3.5" />
            </button>
          </div>

          {expanded && (
            <div className="mt-1.5 flex flex-col gap-1.5 py-1.5" data-slot="effect-settings">
              {type !== "LAYER_BLUR" && type !== "BACKGROUND_BLUR" && (
                <div className="text-[11px] leading-none text-[#888888] mb-0.5 select-none">
                  Blend
                </div>
              )}
              {type !== "LAYER_BLUR" && type !== "BACKGROUND_BLUR" && (
                <SelectField
                  value="NORMAL"
                  options={BLEND_OPTIONS}
                  onChange={() => {}}
                />
              )}
              <div className="grid grid-cols-2 items-center gap-1.5">
                <NumberField
                  prefix="X"
                  value={x}
                  onChange={(v) => applyShadow(parseFloat(v || "0"), y, blur, spread)}
                />
                <NumberField
                  prefix="Y"
                  value={y}
                  onChange={(v) => applyShadow(x, parseFloat(v || "0"), blur, spread)}
                />
              </div>
              <div className="grid grid-cols-2 items-center gap-1.5">
                <NumberField
                  prefix="B"
                  min={0}
                  value={blur}
                  onChange={(v) => applyShadow(x, y, Math.max(0, parseFloat(v || "0")), spread)}
                />
                <NumberField
                  prefix="S"
                  value={spread}
                  onChange={(v) => applyShadow(x, y, blur, parseFloat(v || "0"))}
                />
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
