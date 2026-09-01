# design-sync notes — @bizvizcards/ui

Repo-specific gotchas for future `/design-sync` runs on this package.

## Build

- Package lives at `packages/ui-web/` (moved from `design-system/` on 2026-09-01,
  when the monorepo gained `packages/tokens` + `packages/ui-native`). Re-copy the
  `.ds-sync/` scripts after any fresh clone (they're gitignored).
- Three-step build: `prebuild` (`scripts/gen-theme-css.mjs` → `theme.generated.css`)
  **then** `tsup` (→ `dist/index.js` + `dist/index.d.ts`) **then** `@tailwindcss/cli`
  (→ `dist/styles.css`). `tsup` has `clean: true`, so it wipes `dist/` — always run
  the full `npm run build`, never `build:js` alone, or the converter's `cssEntry`
  (`dist/styles.css`) goes missing.
- **`theme.css` `@import`s `theme.generated.css`**, produced from
  `@bizvizcards/tokens` (`file:../tokens`) by `scripts/gen-theme-css.mjs` on
  `prebuild`. The generated file carries the `@plugin "daisyui"` + `@plugin
  "daisyui/theme"` blocks. `frontend/src/index.css` is still the *upstream* palette
  owner — the tokens package is seeded from it; `packages/tokens` has a
  `check:frontend` drift check.
- `tsconfig.json` sets `"ignoreDeprecations": "6.0"` — TypeScript 6 errors on
  `baseUrl` (which tsup's dts pass injects) without it.
- `theme.css` `@source "./src"` + `@source "./.design-sync/previews"` — the second
  one is what pulls preview-only utility classes into `dist/styles.css`. If a
  preview renders unstyled after adding new utilities, that glob (or a stale
  `dist/styles.css`) is why.

## Converter

- `docsDir: "docs"` — one `docs/<Name>.md` per component, `category:` frontmatter
  drives the DS-pane group. Adding a component means adding its doc + preview.
- `guidelinesGlob: ["guides/**/*.md"]` — deliberately points at nothing. The
  default (`docs/*.md`) would copy every component doc into `guidelines/`,
  duplicating `.prompt.md`.
- No provider needed: the `bizviz` daisyUI theme is `default: true`, emitted at
  `:root`. `cfg.provider` is intentionally unset.

## Known render warns (triage: benign)

- `[RENDER_BLANK]` on Sheet was fixed by adding `modal-open` to the dialog
  className when `open` (daisyUI's `[open]` alone leaves `.modal` visually
  collapsed for a static screenshot). If it recurs, check that class is still in
  `dist/styles.css`.
- `[GRID_OVERFLOW]` on Button / Badge / Chip — wide multi-item rows; handled with
  `cfg.overrides.<Name>.cardMode = "column"`. Expected, not new.

## Re-sync risks

- **Fresh authored package, not an upstream import.** Every component and preview
  is hand-written here. The palette now comes from `@bizvizcards/tokens`
  (`theme.generated.css`), seeded from `frontend/src/index.css`. On re-sync, run
  `cd ../tokens && npm run check:frontend` — it flags any colour drift from the
  web app.
- `conventions.md` enumerates token classes and daisyUI component classes — if a
  component's class vocabulary changes, re-validate the header against the build.
- lucide-react is a **devDependency** (previews only). Icon props are `ReactNode`;
  the bundle ships no icon set.
- Playwright/Chromium pinned by `~/AppData/Local/ms-playwright` cache (Windows
  path, not `~/.cache`). `playwright` is in devDependencies.
