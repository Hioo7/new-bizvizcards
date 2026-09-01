// Reads frontend/src/index.css, extracts the `bizviz` daisyUI theme block's
// --color-* declarations, and asserts they equal @bizvizcards/tokens colors.
// Exit 1 on any mismatch. Run after changing either side.
import { readFileSync } from "node:fs";
import { colors } from "../dist/index.js";

const cssPath = new URL("../../../frontend/src/index.css", import.meta.url);
const css = readFileSync(cssPath, "utf8");

// Grab from `name: "bizviz";` to the next closing brace at column 0.
const block = css.match(/name:\s*"bizviz";[\s\S]*?\n}/)?.[0] ?? "";
if (!block) {
  console.error("could not find the bizviz theme block in frontend/src/index.css");
  process.exit(1);
}

const found = Object.fromEntries(
  [...block.matchAll(/--color-([\w-]+):\s*(#[0-9a-fA-F]{3,8})/g)].map((m) => [
    m[1],
    m[2].toLowerCase(),
  ]),
);

let bad = 0;
for (const [k, v] of Object.entries(colors)) {
  if (found[k] === undefined) {
    console.warn(`note: ${k} not present in frontend/src/index.css (tokens-only)`);
    continue;
  }
  if (found[k] !== v.toLowerCase()) {
    console.error(`drift: ${k}  tokens=${v}  frontend=${found[k]}`);
    bad++;
  }
}

if (bad) {
  console.error(`\n${bad} token(s) drifted from frontend/src/index.css`);
  process.exit(1);
}
console.log("in sync");
