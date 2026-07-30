import type { ECardTheme } from "@app-types/ecard";

// Maps the card's own theme value to the daisyUI theme name it activates —
// see the matching @plugin "daisyui/theme" blocks in src/index.css.
export const ECARD_THEME_TO_DAISYUI_THEME: Record<ECardTheme, string> = {
  DEFAULT_DARK: "ecard-legacy",
  LIGHT: "ecard-light",
  NAVY_TEAL: "ecard-navy-teal",
};
