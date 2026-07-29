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

/** Parse a CSS px value string to a number */
export function cssPx(val: string): number {
  return parseInt(val) || 0;
}
