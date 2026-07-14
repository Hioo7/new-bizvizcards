/** Converts a "#rrggbb" hex color into Apple Wallet's expected
 * "rgb(r, g, b)" string form. */
export function hexToRgbString(hex: string): string {
  const normalized = hex.replace('#', '');
  const r = parseInt(normalized.slice(0, 2), 16);
  const g = parseInt(normalized.slice(2, 4), 16);
  const b = parseInt(normalized.slice(4, 6), 16);
  return `rgb(${r}, ${g}, ${b})`;
}
