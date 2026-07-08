# Frontend Development Rules

These rules govern all frontend development in this folder. They apply to every feature, refactor, and fix — read this before writing any frontend code. This app's **primary target is mobile** — every rule below is in service of that, with desktop/web treated as a responsive adaptation of the mobile experience, not the other way around.

## Stack

- **Framework:** React 19, built with Vite
- **Language:** TypeScript
- **Styling:** Tailwind CSS v4 (CSS-first config, no `tailwind.config.js` — see [Theming](#theming--colors))
- **Component classes:** daisyUI v5 (Tailwind plugin)

## Before building any UI

**Always invoke the `frontend-design` skill first**, before writing markup or choosing a layout, whenever there is a real design decision to make (new UI, reshaping existing UI, choosing an aesthetic direction). Plan the layout, hierarchy, and visual approach there before implementing.

Exception: when the user has handed you an **exact existing layout/design to replicate** (see [Design fidelity](#design-fidelity-exact-replication-vs-creative-freedom)), there's no design decision left to make — skip straight to faithful implementation.

**Plan every relevant state up front, not just the happy path.** For any component, layout, or page whose data can be loading, empty, or fail to load — plan out the **loading state**, **error state**, **success state**, and **empty state** as part of the same design pass, before implementing. Don't design only the populated/successful view and bolt the others on afterward. Not every component needs all four (a purely presentational component with no data dependency doesn't), but anything that fetches, submits, or lists data does.

## Mobile-native & responsive

- Every interactive surface should feel like a native mobile app first. The clearest example: dialogs/menus that would be a native bottom sheet on mobile should behave like one — use daisyUI's responsive modal pattern:
  ```html
  <dialog class="modal modal-bottom sm:modal-middle">
  ```
  This gives a bottom sheet on small screens and a centered modal on larger ones, from one component — this is the default pattern for any modal/dialog/sheet unless there's a specific reason to deviate.
- Everything must stay fully responsive and usable on web/desktop, but layout, spacing, and interaction patterns are chosen for mobile first, then adapted upward.
- Touch targets (buttons, icon buttons, tappable rows) must be comfortably tappable on mobile: minimum ~44×44px (2.75rem) hit area, per standard mobile touch-target guidance. Err larger for primary actions.
- **Modals/dialogs must never grow unbounded to fit dynamic content.** When a modal renders a runtime-determined amount of data — a count that isn't known until render, e.g. a list of users returned from an API — the modal itself keeps a fixed max size, both horizontally and vertically; it must never expand indefinitely as more items render. The inner region rendering that list gets a fixed size and becomes internally scrollable once its content exceeds the available space, instead of pushing the modal's own bounds outward.

## Minimal friction, visually guiding UI

- UI flows must require the minimum number of actions to complete. Don't add steps, confirmations, or intermediate screens that aren't earning their place.
- Prefer icons over text labels wherever the icon alone clearly conveys intent — this applies to buttons too (an icon-only button is preferred over an icon+text or text-only button when the icon is unambiguous).
- Use text labels (alone or alongside an icon) only when intent can't be conveyed by an icon alone.
- Toasts and error/status messages are the one place to default to **icon + label together** — clarity matters more than minimalism when something has gone wrong or needs the user's attention.

## Forms

- **Self-validating**: validate inline as the user fills the form, don't wait for submit to surface every error.
- **Multi-stage for anything non-trivial**: never build one long single-page form. Split into stages, each covering only the fields relevant to that stage, structured to keep the field count per stage as low as reasonably possible.
- Each stage must validate its own fields and block advancing to the next stage until it passes.
- **No default browser focus ring.** The native blue focus glow is not acceptable — every focusable field needs a deliberate custom focus style (defined via the theme, see below), designed as part of the UI, not left as the browser default.
- **Field labeling**: every field needs either an icon that unambiguously conveys its purpose (e.g. an envelope icon for email), or a text label (above or beside the field) if it can't be conveyed by icon alone. Placeholder text is never a substitute for a label/icon — it disappears the moment the user types.
- **Modal/dialog titles get an icon** alongside the title text for visual guidance, same reasoning as above.
- Buttons follow the same touch-target sizing as [Mobile-native & responsive](#mobile-native--responsive) above.

## Theming & colors

Tailwind v4 + daisyUI v5 use CSS-first configuration — there is no `tailwind.config.js`. Theme is defined directly in `src/index.css`:

```css
@import "tailwindcss";
@plugin "daisyui";
@plugin "daisyui/theme" {
  name: "mytheme";
  default: true;
  --color-primary: oklch(55% 0.3 240);
  --color-primary-content: oklch(98% 0.01 240);
  /* ...base-100/200/300, secondary, accent, neutral, info, success, warning, error, etc. */
}
```

- **All color must come from these theme variables** (daisyUI semantic classes like `bg-primary`, `text-base-content`, `btn-error`, etc.) — never hardcode a hex/rgb/oklch color directly in a component.
- Only the colors defined in the theme may be used. If a UI genuinely needs a color the theme doesn't have, **stop and get explicit permission from the user** before adding it to the theme — don't add ad-hoc colors to work around a gap.
- **If the user hasn't specified an approach for a given piece of UI, ask whether to build it with daisyUI's component classes or with raw Tailwind utility classes.** daisyUI covers common components well, but some custom UI can't be achieved with it — don't assume; ask.

## Design fidelity: exact replication vs. creative freedom

Two distinct modes, and the difference matters:

- **Given an exact layout/design to replicate**: match it exactly — same layout, same spacing, no creative changes. Verify the result actually matches using the Playwright browser tools (navigate to the running dev server, take a snapshot/screenshot, compare against what was specified) before considering the work done.
- **Given creative freedom** (no exact design specified): design the UI yourself (via `frontend-design`), but stay strictly within the defined theme colors — see [Theming](#theming--colors).

## No hardcoded values

- No magic strings, numbers, limits, keys, or other fixed values inline in components/hooks/services. Any such value goes in a **constants file inside a `config/` folder**.
- `config/` can exist at two levels:
  - `src/config/` — constants shared across features.
  - `features/<feature-name>/config/` — constants specific to that one feature.
- Before adding a new constant, check the relevant `config/` folder(s) for one that already fits rather than redefining an equivalent value elsewhere.
- This is about fixed values that are part of the code itself (a route path, a validation limit, a storage key, a default page size, etc.) — not runtime/environment configuration.

## Code organization & file responsibility

- **One component per file.** A component file exports exactly one component. If a file starts accumulating a second component — even a small one — split it into its own file. Never bundle multiple components together in one file.
- **Services group by domain, not by function.** A service file holds all the operations for one cohesive domain/resource (e.g. `customerService.ts` holds every customer-related API call). Keep one domain's operations together in one file; don't split a single domain across multiple files, and don't merge unrelated domains into one file for convenience.
- **Same principle for hooks, context, and utils.** Each file holds one hook (or a small cluster of tightly-related hooks), one context plus its accompanying hook, or one group of clearly-related helper functions. A file should have a single, nameable reason to exist — if you can't describe what a file is for in one sentence, it's time to split it.
- **Follow standard React best practices**: small, composable, reusable components; prefer composition (combining smaller pieces) over one large component/hook/service handling many concerns; single responsibility at the component/hook/function level, not just the file level.
- **DRY**: if the same logic or markup shows up more than once, extract it into a shared hook, component, or util rather than duplicating it — but only extract once a real duplication exists, not preemptively for a single use case.
- This is the same principle behind the folder structure below and the `index.ts` barrel exports — many small, focused files, not a few large ones.

## Folder structure

Feature-driven, since this project has many features. Two layers:

```
src/
  components/      # shared components used across features
  hooks/           # shared hooks
  services/        # shared API/service clients
  context/         # shared React context providers
  types/           # shared TypeScript types
  utils/           # shared utilities
  pages/           # route-level page components
  layouts/         # shared layout shells (app shell, auth layout, etc.) that wrap pages/routes
  config/          # shared constants (see "No hardcoded values")
  features/
    <feature-name>/
      components/
      hooks/
      layouts/
      utils/
      config/      # constants specific to this feature
      index.ts     # barrel export — the feature's public API for everything outside it
```

Rules:
- Top-level folders (`components/`, `hooks/`, `services/`, `context/`, `types/`, `utils/`, `pages/`, `layouts/`, `config/`) hold **shared** content used across multiple features.
- Each `features/<feature-name>/` folder is self-contained and gets its own `hooks/`, `components/`, `layouts/`, `utils/`, `config/` etc. as needed — don't create subfolders that end up empty.
- A feature's `index.ts` is the only thing other code should import from — it re-exports whatever that feature wants to expose. Code outside a feature should never reach into `features/<feature-name>/components/...` directly; go through the barrel.
- Only promote something out of a feature into a shared top-level folder once a second feature actually needs it — don't pre-emptively share.
- Freedom to create grouping subfolders inside any of these folders (shared or feature-level) once it has enough related files to warrant it — e.g. `components/forms/`, `components/buttons/`, `hooks/auth/`. Group by what the files are related to, not just by file type. This nests as deep as makes sense; there's no fixed limit, just keep each subfolder's contents genuinely related to each other.

## Path aliases

Configured in `tsconfig.app.json` (`compilerOptions.paths`) and mirrored in `vite.config.ts` (`resolve.alias`) — both must stay in sync, since TypeScript and Vite resolve module paths independently:

| Alias | Resolves to |
|---|---|
| `@/*` | `src/*` |
| `@components/*` | `src/components/*` |
| `@hooks/*` | `src/hooks/*` |
| `@services/*` | `src/services/*` |
| `@context/*` | `src/context/*` |
| `@app-types/*` | `src/types/*` |
| `@utils/*` | `src/utils/*` |
| `@pages/*` | `src/pages/*` |
| `@layouts/*` | `src/layouts/*` |
| `@config/*` | `src/config/*` |
| `@features/*` | `src/features/*` |
| `@assets/*` | `src/assets/*` |

(`@app-types` rather than `@types` — avoids any visual confusion with the `@types/*` DefinitelyTyped npm scope, e.g. `@types/react`.)

Importing `@features/<feature-name>` resolves to that feature's `index.ts` automatically (standard directory-index resolution) — that's the intended way to consume a feature from anywhere else in the app.

## Type safety

- `any` and `unknown` are not allowed unless the user explicitly grants permission for that specific case. Prefer precise types, generics, and properly typed/inferred values over loose typing.
- The codebase must stay fully typed — no untyped escape hatches to work around a typing problem instead of solving it.

## Definition of done

After any change — adding, removing, or modifying a feature or anything else — a frontend change is complete only when **both `npm run lint` and `npm run build` pass with zero errors and zero warnings** (build runs `tsc -b` then `vite build`, so this also catches type errors). A warning is not acceptable to leave in place — treat it the same as an error and fix it before considering the work done.

**Fix the underlying issue — don't suppress the linter to make it go away.** Do not add `eslint-disable` comments (inline, block, or file-level) to bypass a lint error/warning, and do not weaken or remove rules in `eslint.config.js` to make one disappear. A lint failure means something about the code needs to change — find and fix that, not the check that caught it. The only exception is if the user explicitly tells you to suppress a specific rule for a specific, justified reason — even then, use the narrowest possible scope (a single inline disable for one line, not file-level or config-level), and add a comment explaining why.
