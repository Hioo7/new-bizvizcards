# @bizvizcards/ui

Mobile-first UI primitives for the BizVizCards apps — the shared design
foundation the web app and the mobile app build on.

- **Stack:** React 19, Tailwind CSS v4, daisyUI v5.
- **Theme:** the `bizviz` daisyUI theme, kept in sync with the web app's
  `frontend/src/index.css`.
- **Icons:** not bundled. Components take icon props (`icon`, `leadingIcon`, …)
  as `ReactNode`; pass `lucide-react` nodes from the consumer.

## Install

```bash
npm install @bizvizcards/ui
```

```tsx
import "@bizvizcards/ui/styles.css";
import { Button } from "@bizvizcards/ui";
```

## Build

```bash
npm run build      # tsup → dist/index.js + dist/index.d.ts, then Tailwind → dist/styles.css
```

## Sync to Claude Design

This package is imported into Claude Design via the `/design-sync` skill —
see `.design-sync/` (config, preview cards, conventions).
