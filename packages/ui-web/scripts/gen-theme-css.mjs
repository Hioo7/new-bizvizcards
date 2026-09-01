// GENERATES theme.generated.css — the `bizviz` daisyUI theme block, built from
// @bizvizcards/tokens so the palette has one source of truth. Runs on `prebuild`.
import { writeFileSync } from "node:fs";
import { colors, radius } from "@bizvizcards/tokens";

const lines = [
  "/* GENERATED from @bizvizcards/tokens by scripts/gen-theme-css.mjs — do not edit. */",
  '@plugin "daisyui" {',
  "  themes: false;",
  "}",
  "",
  '@plugin "daisyui/theme" {',
  '  name: "bizviz";',
  "  default: true;",
  "  color-scheme: light;",
  "",
];
for (const [k, v] of Object.entries(colors)) lines.push(`  --color-${k}: ${v};`);
lines.push("");
lines.push(`  --radius-selector: ${radius.selector / 16}rem;`);
lines.push(`  --radius-field: ${radius.field / 16}rem;`);
lines.push(`  --radius-box: ${radius.box / 16}rem;`);
lines.push(
  "  --size-selector: 0.25rem;",
  "  --size-field: 0.25rem;",
  "  --border: 1px;",
  "  --depth: 1;",
  "  --noise: 0;",
);
lines.push("}", "");

writeFileSync(new URL("../theme.generated.css", import.meta.url), lines.join("\n"));
console.log("wrote theme.generated.css");
