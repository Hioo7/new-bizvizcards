/**
 * @bizvizcards/tokens — the single source of truth for the `bizviz` palette,
 * consumed by both @bizvizcards/ui (web) and @bizvizcards/ui-native.
 *
 * Colour values are copied verbatim from the `bizviz` daisyUI theme block in
 * `frontend/src/index.css` — that file stays the upstream owner;
 * `scripts/check-against-frontend.mjs` flags drift.
 */

export const colors = {
  "base-100": "#ffffff",
  "base-200": "#f8fafc",
  "base-300": "#e2e8f0",
  "base-content": "#0f172a",
  "primary": "#2D2DE0",
  "primary-content": "#ffffff",
  "secondary": "#6366f1",
  "secondary-content": "#ffffff",
  "accent": "#60a5fa",
  "accent-content": "#0f172a",
  "neutral": "#111827",
  "neutral-content": "#ffffff",
  "info": "#60a5fa",
  "info-content": "#0f172a",
  "success": "#16a34a",
  "success-content": "#ffffff",
  "warning": "#fbbf24",
  "warning-content": "#78350f",
  "error": "#dc2626",
  "error-content": "#ffffff",
} as const;

export type ColorToken = keyof typeof colors;

/** Corner radii in px. `selector` = toggles/checkboxes, `field` = inputs/chips, `box` = cards/sheets. */
export const radius = { selector: 8, field: 12, box: 16 } as const;

export type RadiusToken = keyof typeof radius;

/** The app ships no custom webfont — it rides the platform UI stack. */
export const fontFamily = {
  sans: 'ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial, "Noto Sans", sans-serif',
} as const;

/** `{ "--color-primary": "#2D2DE0", ..., "--radius-field": "12px", ... }` */
export function cssVariables(): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [k, v] of Object.entries(colors)) out[`--color-${k}`] = v;
  for (const [k, v] of Object.entries(radius)) out[`--radius-${k}`] = `${v}px`;
  return out;
}
