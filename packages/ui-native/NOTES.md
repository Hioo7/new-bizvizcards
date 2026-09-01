# @bizvizcards/ui-native — build notes & gotchas

## Monorepo layout — npm workspace

`packages/package.json` is a workspace root with members `tokens`, `ui-native`,
`ui-native/example` (NOT `ui-web` — web toolchain, stays standalone). One hoisted
`packages/node_modules` → a **single** copy of react / react-native / reanimated /
nativewind, so Metro (ui-native + example) has one clean module graph instead of
three trees with duplicate React.

- Internal deps use `"*"` (workspace-resolved), not `file:` links.
- `packages/.npmrc` has `legacy-peer-deps=true` (gluestack v3's `@react-aria/*`
  peer graph).
- `example/metro.config.js` watches the workspace root and adds the hoisted
  `packages/node_modules` as a resolution root. **Hierarchical lookup stays ON**
  (Metro's default) — `disableHierarchicalLookup = true` was tried and reverted:
  it broke `react-native-reanimated`'s nested `semver@7` (babel pins `semver@6`
  at the hoist root, so reanimated keeps its own copy nested and Metro must be
  allowed to walk up to `react-native-reanimated/node_modules/` to find it). The
  workspace hoist alone guarantees a single react / react-native copy.
- Icons: `stories/_icons.ts` re-exports each lucide icon from its deep path
  (`lucide-react-native/icons/<kebab>`) — the barrel import pulls ~1800 icon
  modules into Metro's dev graph.

## Build performance — the workspace fix (2026-09-01)

Converting the three packages to an npm workspace (single hoisted
`packages/node_modules`) plus the lucide deep-import fix took the Android bundle
from **4507 modules / minutes-to-hung** to:

| | modules | time |
|---|---|---|
| cold (`--clear`) | **1658** | **~11 s** |
| warm (cached) | 1658 | **~0.1 s** |

The old `file:`-link layout gave Metro three module trees with duplicate
react / react-native; the hoist collapses that to one graph. gluestack-ui is
**not** the bottleneck — it was the dependency layout.

## Stack (pinned)

- Expo **SDK 57** (`create-expo-app@latest` default), RN 0.86.3, React 19.2.3.
- gluestack-ui **v3-stable**: `@gluestack-ui/core@3.0.25`, `@gluestack-ui/utils@3.0.21`.
  Component sources vendored from the `main-v3` branch of `gluestack/gluestack-ui`.
- NativeWind **4.2.x** + Tailwind CSS **3.4.x**.
- `@legendapp/motion` (actionsheet/select animations), `@expo/html-elements`
  (actionsheet), `react-native-svg` (icons), `react-native-safe-area-context`.

## Why the components are vendored by hand (not `npx gluestack-ui`)

The gluestack v3 CLI (`gluestack-ui@v3-stable`) uses `@clack/prompts`, which hard-
fails `TTY initialization failed: uv_tty_init returned EBADF` in every non-
interactive shell (plain bash, PowerShell `-NonInteractive`, `winpty`). So the
components were vendored the way the CLI does it internally:

```
git clone --depth 1 --branch main-v3 https://github.com/gluestack/gluestack-ui.git
# copy src/components/ui/<name>/*.tsx  →  packages/ui-native/src/components/ui/<name>/
# (skip docs/ and examples/ subdirs)
```

`scripts/vendor-gluestack.sh` reproduces this. To re-vendor / add a component:
re-run it (or copy the one dir by hand), then `npm run gen:css`.

**Do not edit the vendored `src/components/ui/**` sources for theming** — the
theme comes entirely from the generated files below.

## Theming bridge — `scripts/gen-theme.mjs` (runs on `npm run gen:css`)

gluestack v3 components style against a numbered colour scale
(`--color-primary-0..950`, `--color-typography-*`, `--color-background-*`,
`--color-outline-*`, `--color-{error,success,warning,info}-*`, plus
`--color-background-{error,warning,success,muted,info}` and
`--color-indicator-*`).

`gen-theme.mjs` reads `@bizvizcards/tokens` and floods that whole scale with
bizviz-derived values (a ramp around each brand hex; explicit neutral ramps from
`base-100/200/300/content`). It writes **two** files:

| File | Consumed by | Mechanism |
|---|---|---|
| `src/global.css` | web / Storybook | `:root { --color-*: r g b; }` |
| `src/components/ui/gluestack-ui-provider/config.ts` | native | `vars({...})` on the provider's root `<View>` |

`config.ts` is GENERATED — never hand-edit it. `dark` mirrors `light` (bizviz is
light-only) so the provider stays valid.

## tailwind.config.js

= the gluestack v3 template's numbered-scale → CSS-var colour map, **plus** bizviz
conveniences the `@bizvizcards/ui-native` component wrappers use:
`bg-base-100/200/300`, `text-base-content`, `bg-primary`/`bg-error`/… (`DEFAULT` =
step 500), `rounded-{field,box,selector}`. Content globs are `path.join(__dirname, …)`
absolute so the config works when `require`d from `example/` or `.storybook/`.

`nativewind` + `tailwindcss@3` are **devDependencies of this package** (not just
peers) so `tailwind.config.js`'s `require("nativewind/preset")` resolves when the
config is loaded from a sibling dir.

## Example app wiring (`example/`)

- `example/tailwind.config.js` → `module.exports = require("@bizvizcards/ui-native/tailwind.config")`
  (NativeWind's Metro loader resolves `tailwind.config` from the **project root**).
- `example/babel.config.js` → `babel-preset-expo` + `nativewind/babel` +
  `react-native-worklets/plugin` (reanimated 4 needs the worklets plugin).
- `example/metro.config.js` → `withNativeWind(config, { input: require.resolve("@bizvizcards/ui-native/global.css") })`
  + monorepo `watchFolders` (`../`, `../../tokens`) + `nodeModulesPaths`
  (`example/node_modules`, `../node_modules`).
- `babel-preset-expo` had to be installed explicitly in `example/`
  (`npx expo install babel-preset-expo`) — the blank-typescript template didn't pin it.

## `.npmrc` — `legacy-peer-deps=true`

Required by gluestack v3's `@react-aria/*` peer graph. The gluestack CLI writes
this itself; we set it by hand.

## Testing

Per-component gate during the build is **`npm run typecheck`** (`tsc --noEmit`) —
fast, and it catches wrong prop names / bad imports / type mismatches against the
vendored gluestack sources (which DO typecheck clean once the RN peers are
devDeps). Visual correctness is the **Storybook-on-web** screenshot pass.

`src/**/*.test.tsx` RNTL smoke tests exist but **jest is currently deferred**:
`@react-native/jest-preset@0.87` (what `jest-expo` pulls) references
`react-native/src/setup-env.js`, which RN 0.86.3 removed — a version skew in the
Expo SDK 57 / RN 0.86 window. Re-enable by pinning `@react-native/jest-preset` to
a 0.86-compatible release (or running the tests from `example/`, which has the
full matched toolchain) and restoring `"test": "jest"` + `"pretest": "npm run gen:css"`.

## Visual review — NOT DONE (blocked on this machine's RAM)

`.storybook/` + `stories/*.stories.tsx` (7 files, ~40 stories) are written and
`npm run typecheck` is clean, but **no screenshot pass ever ran**. Every
web-bundler path OOM'd (`JavaScript heap out of memory`) transforming the
`react-native-web` + gluestack-v3 + `@react-aria/*` (16 pkgs) + `@legendapp/motion`
graph on a 16 GB machine with ~5-7 GB free:

- `storybook build` (production) — OOM at ~6.3 GB, `--max-old-space-size` 6656.
- `storybook dev` — OOM (with `typescript.reactDocgen: false`).
- a bare Vite + `vite-plugin-rnw` + `nativewind/babel` harness — esbuild
  pre-bundle succeeded, then the code-transform pass OOM'd at 4 GB heap.

`typescript.reactDocgen: false` is set. This is a RAM ceiling, not a config bug.

**To do the review — pick one:**

1. **Machine with ≥ 10-12 GB actually free:**
   ```bash
   cd packages/ui-native
   npm run storybook            # http://localhost:7011
   npm run review 7011          # Playwright shots every story → .review/
   ```
   Eyeball `.review/*.png`: each must be styled (bizviz `#2D2DE0` primary,
   `rounded-field` inputs), complete, plausible.

2. **The `example/` Expo app on Metro** (more memory-frugal than the web bundlers,
   and it *caches* — one cold run, then fast):
   ```bash
   cd packages/ui-native/example && npx expo start --web   # or --ios / --android
   ```
   `example/App.tsx` currently renders a `ThemeRoot` + a themed box + a gluestack
   Button. Extend it to a kitchen-sink screen importing all 23, or point it at the
   stories.

3. **Verify when wiring into the real mobile app** — that runs on Metro and
   caches normally. The device checklist below covers what web-render can't show.

## Component status

All 23 components written and typecheck-clean against the real gluestack v3 APIs.
**Not yet visually verified** (see above). Split:

- **gluestack-backed** (thin wrapper over a vendored primitive): Button,
  IconButton, TextField, TextareaField, PasswordField, Select, Switch, Checkbox,
  RadioGroup, Sheet (Actionsheet), Toast, Spinner.
- **custom** (`View`/`Text`/`Pressable` + NativeWind): Badge, Avatar, Card,
  ListRow, BottomNav, Tabs, StatCard, Chip, EmptyState, SegmentedControl.
  (Badge/Avatar/Card/Spinner ended up custom or near-custom because the gluestack
  primitive fought the bizviz design — e.g. gluestack Badge forces uppercase and
  only 5 tones.)
- `ThemeRoot` = `GluestackUIProvider mode="light"`. `useToast` = imperative hook
  rendering the styled `Toast`.

## Device checklist (for the user, on a simulator)

- Sheet: swipe-to-dismiss, backdrop tap, keyboard avoidance with a focused field.
- Select: picker actionsheet opens / scrolls / selects.
- TextField / PasswordField: keyboard type, `secureTextEntry` toggle, return key.
- Switch / Checkbox / Radio: native tap feel; Switch track colour = bizviz blue.
- Toast: top placement respects the notch / safe area.
- BottomNav: bottom safe-area inset on a notched device.
- Long `ListRow` list scroll performance.

## Re-sync risks

- **Vendored, not linked.** `src/components/ui/**` is a point-in-time copy of
  `main-v3`. It won't get upstream fixes automatically — re-run
  `scripts/vendor-gluestack.sh` to refresh, then re-check the theme bridge
  (gluestack could add a new `--color-*` step the generator doesn't fill).
- `@bizvizcards/tokens` is the palette owner here; `frontend/src/index.css` is
  the palette owner overall. `cd ../tokens && npm run check:frontend`.
- The theme ramp is an approximation of a full Radix-style scale from one hex.
  If a gluestack component looks off at some step, tune `ramp()` in
  `scripts/gen-theme.mjs`.
