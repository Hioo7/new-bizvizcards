# BizViz UI Native — Design Spec

**Date:** 2026-08-31
**Status:** Approved (design); implementation plan pending
**Author:** brainstorming session

## Context

BizVizCards is building a **React Native** mobile app. A web component library
(`design-system/` → `@bizvizcards/ui`, 23 primitives on Tailwind v4 + daisyUI)
and a Claude Design project ("BizViz Mobile UI") already exist and were built for
the web runtime. React Native cannot use those components — no DOM elements, no
CSS classes, no daisyUI — so the component *implementations* must be rebuilt for
RN. What carries over: the component set, the visual language, the design tokens,
and the behavior spec.

The user likes **gluestack-ui**'s feel and wants the RN library as its own
package with **coverage parity** to the web package (same 23 component names,
same look, same tokens) but **RN-idiomatic prop APIs** (gluestack/community
conventions, not literal web-prop mirroring).

Deliverable: two new packages + a dev/verification harness. **Not** the mobile
app itself.

## Goals

- `@bizvizcards/tokens` — one source of truth for the palette, consumed by both
  the web and native UI packages.
- `@bizvizcards/ui-native` — 23 components matching the web set by name and
  visual result, built on gluestack-ui v2 + NativeWind v4.1, themed from the
  tokens package.
- A harness to develop and visually verify the components: an Expo example app
  and Storybook-on-web.
- Move the existing web package into a shared `packages/` layout.

## Non-goals

- The BizViz mobile app (navigation, screens, auth, data, real camera/scan flow).
- Wiring `@bizvizcards/tokens` into `frontend/` (separate future step).
- Publishing any package to npm (all `file:`-linked, local only).
- Syncing `ui-native` to claude.ai/design (web-React runtime only; `ui-web`
  stays the design-agent surface).
- Dark mode / e-card themes (web-only for now).
- Custom floating-label text fields (dropped — label sits above the field, the
  RN convention).

## Approach

Chosen: **copy-paste gluestack-ui v2 primitives into the package**, build the 23
bizviz components on top.

- gluestack-ui v2 is stable (NativeWind v4.1) and copy-paste — `npx gluestack-ui
  add --all` vendors ~40 primitives into `src/gluestack/`.
- Our components compose those primitives and apply the bizviz look via NativeWind
  classes; tokens flow through one NativeWind config.
- Rejected: (B) hand-building all 23 from RN primitives — re-invents the picker
  sheet, bottom-sheet gestures, checkbox/radio a11y, and discards the gluestack
  feel. (C) the alpha `@gluestack-ui/core` v4 npm package — alpha API churn, wrong
  risk profile for a foundation package; revisit when v4 is stable.

## Section 1 — Repo layout

New `packages/` directory, three standalone packages (own lockfiles, `file:`
links — no workspace, no root `package.json`):

```
packages/
  tokens/     @bizvizcards/tokens    — plain TS token values, zero deps
  ui-web/     @bizvizcards/ui        — MOVED from design-system/ (currently uncommitted → clean mv)
  ui-native/  @bizvizcards/ui-native — new (gluestack v2 + NativeWind + 23 components + harness)
```

- `ui-web` and `ui-native` each declare `"@bizvizcards/tokens": "file:../tokens"`.
- Moving `design-system/` → `packages/ui-web/`: `.design-sync/` (incl. the pinned
  Claude Design `projectId`) and preview/doc files move with it; `.ds-sync/` and
  `ds-bundle/` are gitignored and regenerate. The Claude Design project is remote
  and unaffected. Re-run the design-sync once from the new path to confirm.
- `frontend/`, `backend/`, `card-reader/`, `eventApp/`, `nginx/` stay where they are.

## Section 2 — `@bizvizcards/tokens`

Zero-dependency TS package. Exports framework-agnostic values:

```ts
export const colors = {
  "base-100": "#ffffff", "base-200": "#f8fafc", "base-300": "#e2e8f0",
  "base-content": "#0f172a",
  primary: "#2D2DE0", "primary-content": "#ffffff",
  secondary: "#6366f1", "secondary-content": "#ffffff",
  accent: "#60a5fa", "accent-content": "#0f172a",
  neutral: "#111827", "neutral-content": "#ffffff",
  info: "#60a5fa", "info-content": "#0f172a",
  success: "#16a34a", "success-content": "#ffffff",
  warning: "#fbbf24", "warning-content": "#78350f",
  error: "#dc2626", "error-content": "#ffffff",
} as const;
export const radius = { selector: 8, field: 12, box: 16 } as const;   // px
export const fontFamily = { sans: "ui-sans-serif, system-ui, -apple-system, Roboto, ..." } as const;
```

- `ui-web` build step generates its `@plugin "daisyui/theme"` block from
  `colors`/`radius` (replaces the hand-copied hex in `theme.css`).
- `ui-native` `tailwind.config.js` spreads `colors` into `theme.extend.colors`
  and `radius` into `borderRadius` — so `bg-primary`, `text-base-content`,
  `rounded-field` resolve identically on both platforms.
- `frontend/src/index.css` stays the *upstream* palette owner; the tokens package
  is seeded from it. `tokens/scripts/check-against-frontend.mjs` flags drift; a
  NOTES line documents the relationship.

Contents: `package.json`, `src/{index,colors,radius,typography}.ts`,
`scripts/check-against-frontend.mjs`, `tsconfig.json`, `README.md`. Built with `tsc`.

## Section 3 — `@bizvizcards/ui-native` architecture

```
src/
  gluestack/    ~40 vendored gluestack v2 primitives (npx gluestack-ui add --all);
                edited only where a primitive needs a structural bizviz tweak
  components/   the 23 components — compose gluestack primitives, apply bizviz
                NativeWind classes, expose gluestack/RN-idiomatic props
  hooks/        useToast (wraps gluestack toast), shared hooks
  provider/     GluestackUIProvider re-export as ThemeRoot (bizviz config, mode="light")
  theme/        gluestack config object built from @bizvizcards/tokens
  index.ts      barrel — 23 components + ThemeRoot + useToast + types
```

NativeWind wiring shipped by the package: `tailwind.config.js`
(`presets: [gluestack preset]`, tokens spread into `theme.extend`, `content`
covering `src/`), `global.css` (`@tailwind` directives + gluestack CSS-var block
from tokens), `nativewind-env.d.ts`, plus documented `babel.config.js` /
`metro.config.js` snippets for the consuming app.

Consuming-app usage:
```tsx
import "@bizvizcards/ui-native/global.css";
import { ThemeRoot, Button, ListRow } from "@bizvizcards/ui-native";
<ThemeRoot>…</ThemeRoot>   // = GluestackUIProvider with the bizviz config
```

**Peer dependencies** (app provides): `react`, `react-native`, `nativewind`,
`react-native-reanimated`, `react-native-svg`, `react-native-safe-area-context`,
`@legendapp/motion`, `lucide-react-native`.
**Package deps:** `@bizvizcards/tokens`, `tailwind-variants`, the `@gluestack-ui/*`
utility packages the vendored components import.

**Icons:** same injection pattern as web — `icon` / `leadingIcon` / `trailing`
props are `React.ReactNode`; consumer passes `lucide-react-native` nodes. No icon
set bundled.

## Section 4 — The 23 components

**gluestack-backed** (thin bizviz wrapper over a vendored primitive):

| Component | gluestack v2 primitive |
|---|---|
| Button, IconButton | `Button` (+ `Fab` for the FAB case) |
| TextField, TextareaField, PasswordField | `FormControl` + `Input` / `Textarea` (label above; Password uses `InputSlot` toggle) |
| Select | `Select` (trigger → actionsheet picker) |
| Switch, Checkbox, RadioGroup | `Switch` / `Checkbox` / `RadioGroup` + `Radio` |
| Badge, Avatar, Spinner | `Badge` / `Avatar` / `Spinner` |
| Sheet | `Actionsheet` (native bottom sheet + drag indicator) |
| Toast | `useToast` hook + styled `Toast` render component |
| Card | `Card` (+ `Pressable` wrap for `onPress`, `flush` prop) |
| ThemeRoot | `GluestackUIProvider` pre-configured with the bizviz config |

**Custom** (no gluestack equivalent — `Pressable` / `HStack` / `VStack` / `Icon` +
NativeWind): `SegmentedControl`, `ListRow`, `BottomNav`, `Tabs`, `StatCard`,
`Chip`, `EmptyState`.

**API convention** (RN-idiomatic, per approved design):
- gluestack-backed components expose gluestack props: `action` / `variant` /
  `size`, `isDisabled`, `isInvalid`, `isOpen` + `onClose`, `onValueChange`, and
  compound children where gluestack uses them (`<Button><ButtonText>…`).
- custom components use RN idioms: `onPress` / `onSelect`, `items` / `options`
  arrays, `ReactNode` slots (`leading`, `trailing`, `icon`).
- Same visual result and token usage as web; prop *shapes* differ by platform.
- Per-component `docs/*.md` (RN-flavored) ship like the web package.

## Section 5 — Dev & verification harness

Inside `packages/ui-native/`:

```
example/      Expo app (current Expo SDK, new architecture — exact version pinned
              in the implementation plan); expo-router, one route per component
              group (kitchen-sink gallery); entry wires ThemeRoot + global.css
.storybook/   Storybook for React Native + the react-native-web renderer/addon
              (versions pinned in the plan)
stories/      <Component>.stories.tsx — one per component, mirrors the web preview cards
```

Two ways to view:
1. **Expo example app** — `npm run ios/android/web`. Real runtime, real gestures
   (Actionsheet swipe, Select picker). User runs this for device feel.
2. **Storybook-on-web** — `npm run storybook` serves stories via `react-native-web`
   in a browser. Claude's verification loop: drive a headless browser (Playwright,
   already installed) against the Storybook URL, screenshot each story, eyeball
   for styled/on-brand — same process as the web package.

**Verification gate before handoff:**
- `tsc --noEmit` clean; `eslint` clean across `src/`.
- `react-native-testing-library` + Jest smoke test per component (~23 tests):
  renders, key props take effect.
- Storybook-web builds; all stories screenshotted and confirmed styled + on-brand
  (contact-sheet review).
- `example/` app boots on web (`expo start --web`) with no redbox — proves the
  NativeWind / gluestack / reanimated wiring.
- **Device check (iOS/Android simulator) is the user's** — Claude can't run a
  simulator; deliver a poke-at checklist.

## Section 6 — Risks & mitigations

- **~40 vendored gluestack files are now maintained here.** Don't edit them
  unless forced; keep bizviz styling in the `components/` layer; record any edits
  in NOTES.
- **NativeWind + Reanimated + Expo new-architecture toolchain is fiddly**
  (Metro / Babel / global.css). Mitigation: the `example/` web-boot gate catches
  wiring errors immediately.
- **`react-native-web` ≠ device.** Storybook-web verifies layout/color/styling,
  not native gesture feel. Mitigation: the user's device checklist.
- **Floating-label dropped** — TextField label sits above the field; not
  pixel-identical to the web floating-label. Accepted.
- **`example/` is a full Expo app inside the package** — many config files, large
  gitignored `node_modules`. Acceptable for a component lib.

## Packages delivered

1. `packages/tokens/` — `@bizvizcards/tokens`
2. `packages/ui-web/` — `@bizvizcards/ui` (relocated + retargeted at tokens)
3. `packages/ui-native/` — `@bizvizcards/ui-native` (+ `example/`, `.storybook/`, `stories/`)

The user commits and pushes to `main` themselves once both new packages are
complete (per standing preference — no feature branches, no PRs).
