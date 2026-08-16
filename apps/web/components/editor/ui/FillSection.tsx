"use client";

import { useEffect, useState } from "react";
import { Plus } from "lucide-react";
import { ColorRow } from "./Fields";
import {
  gradientFirstColor,
  isTransparentColor,
  parseColorAlpha,
  parseRgbToHex,
  withColorAlpha,
} from "../utils/style-utils";

/**
 * Fill section — faithful clone of open-pencil's `FillSection.vue` rendered
 * inside the `PanelSection` shell (themes: `src/theme/panel/section.ts`,
 * `src/theme/panel/item-row.ts`):
 *   - 32px header grid `grid-cols-[minmax(0,1fr)_26px]` with a heading-role
 *     title and a 26px actions column holding the `icon-button` "Add fill"
 *   - per-fill `ColorRow` items (paint field with swatch / hex / opacity,
 *     visibility + remove rail, and a per-fill "Blend mode" select)
 *
 * In open-pencil every node has a `fills[]` list; in Klone's CSS world the
 * element's fill is its background, so the Background row is the primary
 * fill item and the text color is surfaced as a second item.
 */
export function FillSection({
  styles,
  onApplyStyle,
}: {
  styles: Record<string, string>;
  onApplyStyle: (property: string, value: string) => void;
}) {
  // The element's VISIBLE background color. A background-image (gradient /
  // image) paints OVER background-color, so when one is present we surface
  // its first color stop; otherwise fall back to background-color.
  const visibleBg =
    gradientFirstColor(styles.backgroundImage) ?? styles.backgroundColor;
  const bgColor = isTransparentColor(visibleBg)
    ? ""
    : parseRgbToHex(visibleBg);
  const bgOpacity = parseColorAlpha(visibleBg);
  const txtColor = isTransparentColor(styles.color)
    ? ""
    : parseRgbToHex(styles.color);
  const txtOpacity = parseColorAlpha(styles.color);

  // Open-pencil fill visibility state (reset whenever the selection changes).
  const [txtHidden, setTxtHidden] = useState(false);
  const [bgHidden, setBgHidden] = useState(false);
  useEffect(() => {
    // Intentional prop→local sync: a new selection always starts with both
    // fills "visible" in the panel; `styles` identity tracks the selection.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setTxtHidden(false);
    setBgHidden(false);
  }, [styles]);

  // "Add fill" — open-pencil appends its DEFAULT_SHAPE_FILL (#D4D4D4) to the
  // fills list. CSS can only hold one background, so we add the default gray
  // background fill when missing, otherwise add a text fill.
  const addFill = () => {
    if (!bgColor) {
      onApplyStyle("backgroundColor", "#D4D4D4");
    } else if (!txtColor) {
      onApplyStyle("color", "#000000");
    }
  };

  return (
    <section
      aria-label="Fill"
      data-state="open"
      className="border-b border-[#3a3a3a] pb-3 text-[#f0f0f0] data-[disabled]:opacity-60"
    >
      {/* ── Header (open-pencil PanelSection: h-8 grid, 26px actions) ── */}
      <div
        className="grid h-8 min-w-0 grid-cols-[minmax(0,1fr)_26px] items-center gap-1.5"
        data-state="open"
        data-slot="header"
      >
        <div
          className="min-w-0 cursor-default truncate border-0 bg-transparent p-0 text-left text-[11px] font-semibold text-[#f0f0f0]"
          data-state="open"
          data-slot="title"
        >
          <span role="heading" aria-level={3}>
            Fill
          </span>
        </div>
        <div
          className="flex h-7 w-[26px] shrink-0 items-center justify-end gap-0.5"
          data-state="open"
          data-slot="actions"
        >
          <button
            type="button"
            aria-label="Add fill"
            title="Add fill"
            data-slot="icon-button"
            onClick={addFill}
            className="flex size-6 cursor-pointer items-center justify-center rounded border border-transparent bg-transparent text-[#888888] outline-none transition-colors hover:bg-[#353535] hover:text-[#f0f0f0] focus-visible:border-[#3b82f6]"
          >
            <Plus className="size-3.5" />
          </button>
        </div>
      </div>

      {/* ── Fill items (only existing fills render rows, like open-pencil's
           fills[] list; an element without fills shows header + "Add fill") ── */}
      <div className="min-w-0" data-state="open" data-slot="content">
        {bgColor && (
          <ColorRow
            label="Fill"
            index={0}
            color={bgColor}
            opacity={bgOpacity}
            hidden={bgHidden}
            blendMode={styles.backgroundBlendMode || styles.mixBlendMode || "NORMAL"}
            onChange={(c) => {
              const cAlpha = parseColorAlpha(c);
              onApplyStyle(
                "backgroundColor",
                cAlpha < 1 || !bgColor ? c : withColorAlpha(c, bgOpacity),
              );
            }}
            onOpacityChange={(a) => {
              if (!bgColor) return;
              onApplyStyle("backgroundColor", withColorAlpha(bgColor, a));
            }}
            onToggleVisibility={() => setBgHidden((v) => !v)}
            onRemove={() => onApplyStyle("backgroundColor", "transparent")}
            onBlendModeChange={(m) => onApplyStyle("backgroundBlendMode", m)}
          />
        )}
        {txtColor && (
          <ColorRow
            label="Text"
            index={1}
            color={txtColor}
            opacity={txtOpacity}
            hidden={txtHidden}
            blendMode={styles.mixBlendMode || "NORMAL"}
            onChange={(c) => {
              const cAlpha = parseColorAlpha(c);
              onApplyStyle(
                "color",
                cAlpha < 1 || !txtColor ? c : withColorAlpha(c, txtOpacity),
              );
            }}
            onOpacityChange={(a) => {
              if (!txtColor) return;
              onApplyStyle("color", withColorAlpha(txtColor, a));
            }}
            onToggleVisibility={() => setTxtHidden((v) => !v)}
            onRemove={() => onApplyStyle("color", "transparent")}
            onBlendModeChange={(m) => onApplyStyle("mixBlendMode", m)}
          />
        )}
      </div>
    </section>
  );
}
