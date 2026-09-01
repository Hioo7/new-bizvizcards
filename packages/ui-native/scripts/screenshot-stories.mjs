/**
 * Screenshot every Storybook story via headless Chromium (Playwright), for the
 * bizviz visual-review pass. Storybook must be running (`npm run storybook`).
 *
 *   node scripts/screenshot-stories.mjs [port] [filterSubstring]
 */
import { chromium } from "playwright";
import { mkdirSync } from "node:fs";

const PORT = process.argv[2] || "7011";
const FILTER = process.argv[3] || "";
const BASE = `http://localhost:${PORT}`;
const OUT = ".review";

const index = await (await fetch(`${BASE}/index.json`)).json();
const stories = Object.values(index.entries).filter(
  (e) => e.type === "story" && (!FILTER || e.id.includes(FILTER)),
);
mkdirSync(OUT, { recursive: true });

const browser = await chromium.launch();
const page = await browser.newPage({
  viewport: { width: 900, height: 700 },
  deviceScaleFactor: 2,
});

let ok = 0;
for (const s of stories) {
  await page.goto(`${BASE}/iframe.html?id=${s.id}&viewMode=story`, {
    waitUntil: "networkidle",
  });
  await page.waitForTimeout(350);
  const root = page.locator("#storybook-root");
  const file = `${OUT}/${s.title.replace(/[\/ ]/g, "_")}__${s.name.replace(/ /g, "")}.png`;
  try {
    await root.screenshot({ path: file });
    ok++;
  } catch (e) {
    console.error(`  ! ${s.id}: ${e.message}`);
  }
}
await browser.close();
console.log(`screenshot: ${ok}/${stories.length} → ${OUT}/`);
