/** @type {import('tailwindcss').Config} */
// Base: the gluestack-ui v3 (main-v3) template config — the numbered colour
// scale maps to the --color-* CSS vars that scripts/gen-theme.mjs fills with
// bizviz-derived values. Plus bizviz conveniences (base-*, DEFAULTs, radii).
const path = require("path");
const { radius } = require("@bizvizcards/tokens");
const here = (p) => path.join(__dirname, p);

const scale = (name) =>
  Object.fromEntries(
    [0, 50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950].map((s) => [
      s,
      `rgb(var(--color-${name}-${s})/<alpha-value>)`,
    ]),
  );

module.exports = {
  darkMode: "class",
  content: [
    here("src/**/*.{js,jsx,ts,tsx}"),
    here("stories/**/*.{js,jsx,ts,tsx}"),
    here(".storybook/**/*.{js,jsx,ts,tsx}"),
    here("example/**/*.{js,jsx,ts,tsx}"),
  ],
  presets: [require("nativewind/preset")],
  important: "html",
  safelist: [
    {
      pattern:
        /(bg|border|text|stroke|fill)-(primary|secondary|tertiary|error|success|warning|info|typography|outline|background|indicator|base)-(0|50|100|200|300|400|500|600|700|800|900|950|content|error|warning|muted|success|info)/,
    },
  ],
  theme: {
    extend: {
      colors: {
        primary: { ...scale("primary"), DEFAULT: "rgb(var(--color-primary-500)/<alpha-value>)" },
        secondary: { ...scale("secondary"), DEFAULT: "rgb(var(--color-secondary-500)/<alpha-value>)" },
        tertiary: scale("tertiary"),
        error: { ...scale("error"), DEFAULT: "rgb(var(--color-error-500)/<alpha-value>)" },
        success: { ...scale("success"), DEFAULT: "rgb(var(--color-success-500)/<alpha-value>)" },
        warning: { ...scale("warning"), DEFAULT: "rgb(var(--color-warning-500)/<alpha-value>)" },
        info: { ...scale("info"), DEFAULT: "rgb(var(--color-info-500)/<alpha-value>)" },
        typography: {
          ...scale("typography"),
          white: "#FFFFFF",
          gray: "#D4D4D4",
          black: "#181718",
        },
        outline: scale("outline"),
        background: {
          ...scale("background"),
          error: "rgb(var(--color-background-error)/<alpha-value>)",
          warning: "rgb(var(--color-background-warning)/<alpha-value>)",
          muted: "rgb(var(--color-background-muted)/<alpha-value>)",
          success: "rgb(var(--color-background-success)/<alpha-value>)",
          info: "rgb(var(--color-background-info)/<alpha-value>)",
        },
        indicator: {
          primary: "rgb(var(--color-indicator-primary)/<alpha-value>)",
          info: "rgb(var(--color-indicator-info)/<alpha-value>)",
          error: "rgb(var(--color-indicator-error)/<alpha-value>)",
        },
        // ── bizviz semantic aliases (used by @bizvizcards/ui-native components) ──
        base: {
          100: "rgb(var(--color-background-0)/<alpha-value>)",
          200: "rgb(var(--color-background-50)/<alpha-value>)",
          300: "rgb(var(--color-background-100)/<alpha-value>)",
          content: "rgb(var(--color-typography-900)/<alpha-value>)",
        },
      },
      borderRadius: {
        selector: `${radius.selector}px`,
        field: `${radius.field}px`,
        box: `${radius.box}px`,
      },
      fontSize: { "2xs": "10px" },
      fontWeight: { extrablack: "950" },
    },
  },
  plugins: [],
};
