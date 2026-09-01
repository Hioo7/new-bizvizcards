# @bizvizcards/tokens

The single source of truth for the BizVizCards **`bizviz` palette** — consumed by
both `@bizvizcards/ui` (web) and `@bizvizcards/ui-native` (React Native) so the
two stay in visual sync.

```ts
import { colors, radius, fontFamily, cssVariables } from "@bizvizcards/tokens";

colors.primary;        // "#2D2DE0"
radius.field;          // 12  (px)
cssVariables();         // { "--color-primary": "#2D2DE0", "--radius-field": "12px", ... }
```

## Upstream ownership

`frontend/src/index.css` (the live web app's `bizviz` daisyUI theme block) is the
**upstream owner** of the palette. This package is seeded from it. Run the drift
check after changing either:

```bash
npm run check:frontend   # exits 1 if any color here disagrees with frontend/src/index.css
```

## Build

```bash
npm run build   # tsc -> dist/index.js + dist/index.d.ts (single-file ESM; require()-interop works on Node 22.12+)
npm test        # builds, then node --test src/tokens.test.ts (asserts against dist/)
```

All exports live in one `src/index.ts` — the package is small enough that one
file beats a resolution dance across `.ts` subpath imports.
