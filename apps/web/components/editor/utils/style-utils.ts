/** Convert rgb/rgba string to hex, or return as-is if already hex */
export function parseRgbToHex(color: string): string {
  if (!color || color === "transparent" || color === "rgba(0, 0, 0, 0)")
    return "#000000";
  if (color.startsWith("#")) return color;
  const m = color.match(/(\d+)/g);
  if (m) {
    const r = parseInt(m[0]).toString(16).padStart(2, "0");
    const g = parseInt(m[1]).toString(16).padStart(2, "0");
    const b = parseInt(m[2]).toString(16).padStart(2, "0");
    return "#" + r + g + b;
  }
  return "#000000";
}

/** True when a computed color value is transparent (no visible color). */
export function isTransparentColor(color: string | undefined): boolean {
  return (
    !color ||
    color === "transparent" ||
    color === "rgba(0, 0, 0, 0)" ||
    color === "rgba(0,0,0,0)"
  );
}

/** Parse a CSS px value string to a number */
export function cssPx(val: string): number {
  return parseInt(val) || 0;
}

/** Extract the first color stop of a CSS gradient/image value, or null when
 * there is none (e.g. `none`, `initial`, or a plain `url(...)`). Computed
 * background-image values serialize colors as `rgb(...)`/`rgba(...)` or hex,
 * so matching the first color token surfaces the element's *visible*
 * background color (a background-image paints over background-color). */
export function gradientFirstColor(
  backgroundImage: string | undefined,
): string | null {
  if (
    !backgroundImage ||
    backgroundImage === "none" ||
    backgroundImage === "initial"
  ) {
    return null;
  }
  const m = backgroundImage.match(
    /(#[0-9a-fA-F]{3,8}|rgba?\([^)]*\)|hsla?\([^)]*\))/,
  );
  return m ? m[0] : null;
}

/** Parse a CSS transform to its translate x/y in px. Handles
 * translate(Xpx, Ypx), matrix(...) and matrix3d(...). Returns [0, 0]
 * when there is no translation. */
export function parseTranslate(transform: string): [number, number] {
  if (!transform || transform === "none") return [0, 0];
  const t = transform.match(/translate\((-?[\d.]+)px,\s*(-?[\d.]+)px\)/);
  if (t) return [parseFloat(t[1]) || 0, parseFloat(t[2]) || 0];
  const m =
    transform.match(/matrix3d\(([^)]+)\)/) ||
    transform.match(/matrix\(([^)]+)\)/);
  if (m) {
    const parts = m[1].split(",").map((p) => parseFloat(p));
    if (parts.length >= 6) {
      const is3d = parts.length === 16;
      return [parts[is3d ? 12 : 4] || 0, parts[is3d ? 13 : 5] || 0];
    }
  }
  return [0, 0];
}
