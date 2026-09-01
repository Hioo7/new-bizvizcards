/**
 * Generates the bizviz theming bridge for the vendored gluestack-ui v3 components,
 * from @bizvizcards/tokens. Runs on `gen:css` (pre-test / pre-storybook).
 *
 * Writes two files:
 *   src/global.css                                  — @tailwind + bizviz `:root` vars (web / Storybook)
 *   src/components/ui/gluestack-ui-provider/config.ts — the `light` scale as nativewind vars() (native)
 *
 * gluestack v3 components style against a numbered scale (--color-primary-0..950,
 * --color-typography-*, --color-background-*, --color-outline-*, --color-error-*, …).
 * We flood that scale with bizviz-derived values so every gluestack primitive
 * renders on-brand without touching the vendored component source.
 */
import { writeFileSync } from "node:fs";
import { colors, radius } from "@bizvizcards/tokens";

const STEPS = [0, 50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950];

function hexToRgb(h) {
  const n = h.replace("#", "");
  const s = n.length === 3 ? [...n].map((c) => c + c).join("") : n;
  return [0, 2, 4].map((i) => parseInt(s.slice(i, i + 2), 16));
}
const rgbStr = (rgb) => rgb.map((n) => Math.round(n)).join(" ");
const lerp = (a, b, t) => a.map((x, i) => x + (b[i] - x) * t);

const WHITE = [255, 255, 255];
const BLACK = [10, 10, 10];

/**
 * A 12-step ramp around `base`. Steps below `pivot` lerp toward white; above,
 * toward `dark` (default near-black). `darkPull` keeps the high steps close to
 * `base` so pressed/hover states stay subtle for brand colors.
 */
function ramp(baseHex, { pivot = 500, dark = BLACK, darkPull = 1 } = {}) {
  const base = hexToRgb(baseHex);
  const out = {};
  for (const s of STEPS) {
    let rgb;
    if (s === pivot) rgb = base;
    else if (s < pivot) rgb = lerp(base, WHITE, ((pivot - s) / pivot) * 0.92);
    else {
      const t = ((s - pivot) / (950 - pivot)) * 0.6 * darkPull;
      rgb = lerp(base, dark, t);
    }
    out[s] = rgbStr(rgb);
  }
  return out;
}

/** Explicit neutral scale from the four bizviz base tokens. */
function neutralRamp(lightHex, midHex, darkHex) {
  const light = hexToRgb(lightHex);
  const mid = hexToRgb(midHex);
  const dk = hexToRgb(darkHex);
  return {
    0: rgbStr(light),
    50: rgbStr(lerp(light, mid, 0.4)),
    100: rgbStr(mid),
    200: rgbStr(lerp(mid, dk, 0.25)),
    300: rgbStr(lerp(mid, dk, 0.45)),
    400: rgbStr(lerp(mid, dk, 0.62)),
    500: rgbStr(lerp(mid, dk, 0.72)),
    600: rgbStr(lerp(mid, dk, 0.82)),
    700: rgbStr(lerp(mid, dk, 0.9)),
    800: rgbStr(lerp(mid, dk, 0.96)),
    900: rgbStr(dk),
    950: rgbStr(dk),
  };
}

const primary = ramp(colors.primary, { pivot: 500, darkPull: 0.45 });
const secondary = ramp(colors.secondary, { pivot: 500, darkPull: 0.55 });
const error = ramp(colors.error, { pivot: 500 });
const success = ramp(colors.success, { pivot: 500 });
const warning = ramp(colors.warning, { pivot: 500 });
const info = ramp(colors.info, { pivot: 500 });
// tertiary: gluestack expects it; bizviz has no 4th brand colour — reuse accent.
const tertiary = ramp(colors.accent, { pivot: 500 });

// typography 0 = on-primary white … 950 = base-content
const typography = neutralRamp(colors["primary-content"], colors["base-300"], colors["base-content"]);
typography[0] = rgbStr(hexToRgb(colors["primary-content"]));
typography[50] = rgbStr(hexToRgb(colors["base-200"]));

// background surfaces
const background = neutralRamp(colors["base-100"], colors["base-200"], colors["base-content"]);
background[0] = rgbStr(hexToRgb(colors["base-100"]));
background[50] = rgbStr(hexToRgb(colors["base-200"]));
background[100] = rgbStr(hexToRgb(colors["base-300"]));

// outline / borders — mostly base-300
const outline = neutralRamp(colors["base-200"], colors["base-300"], colors["base-content"]);
outline[100] = rgbStr(hexToRgb(colors["base-300"]));
outline[200] = rgbStr(hexToRgb(colors["base-300"]));
outline[300] = rgbStr(lerp(hexToRgb(colors["base-300"]), hexToRgb(colors["base-content"]), 0.18));

const tint = (hex, t) => rgbStr(lerp(hexToRgb(hex), WHITE, t));
const backgroundSpecial = {
  error: tint(colors.error, 0.9),
  warning: tint(colors.warning, 0.85),
  success: tint(colors.success, 0.9),
  muted: rgbStr(hexToRgb(colors["base-200"])),
  info: tint(colors.info, 0.88),
};

const indicator = {
  primary: primary[600],
  info: info[500],
  error: error[600],
};

const SCALES = {
  primary, secondary, tertiary, error, success, warning, info,
  typography, outline, background,
};

/** flat list of `--color-<name>-<step>: r g b;` lines */
function scaleLines(indent) {
  const lines = [];
  for (const [name, scale] of Object.entries(SCALES)) {
    lines.push(`${indent}/* ${name} */`);
    for (const s of STEPS) lines.push(`${indent}'--color-${name}-${s}': '${scale[s]}',`);
    lines.push("");
  }
  for (const [k, v] of Object.entries(backgroundSpecial))
    lines.push(`${indent}'--color-background-${k}': '${v}',`);
  for (const [k, v] of Object.entries(indicator))
    lines.push(`${indent}'--color-indicator-${k}': '${v}',`);
  return lines.join("\n");
}

// ── config.ts (native — nativewind vars()) ──────────────────────────────────
const configTs = `'use client';
// GENERATED from @bizvizcards/tokens by scripts/gen-theme.mjs — do not edit.
// Re-run:  npm run gen:css
import { vars } from 'nativewind';

const bizviz = {
${scaleLines("  ")}
  '--radius-selector': '${radius.selector}px',
  '--radius-field': '${radius.field}px',
  '--radius-box': '${radius.box}px',
};

// bizviz is light-only; \`dark\` mirrors \`light\` so the provider stays valid.
export const config = {
  light: vars(bizviz),
  dark: vars(bizviz),
};
`;
writeFileSync(
  new URL("../src/components/ui/gluestack-ui-provider/config.ts", import.meta.url),
  configTs,
);

// ── global.css (web / Storybook — :root) ───────────────────────────────────
const cssVarLines = [];
for (const [name, scale] of Object.entries(SCALES))
  for (const s of STEPS) cssVarLines.push(`    --color-${name}-${s}: ${scale[s]};`);
for (const [k, v] of Object.entries(backgroundSpecial))
  cssVarLines.push(`    --color-background-${k}: ${v};`);
for (const [k, v] of Object.entries(indicator))
  cssVarLines.push(`    --color-indicator-${k}: ${v};`);

const globalCss = `/* GENERATED bizviz vars from @bizvizcards/tokens by scripts/gen-theme.mjs. */
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  :root {
${cssVarLines.join("\n")}
    --radius-selector: ${radius.selector}px;
    --radius-field: ${radius.field}px;
    --radius-box: ${radius.box}px;
  }
}
`;
writeFileSync(new URL("../src/global.css", import.meta.url), globalCss);

console.log("gen-theme: wrote src/global.css + gluestack-ui-provider/config.ts");
