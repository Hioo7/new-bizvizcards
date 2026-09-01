# @bizvizcards/ui-native

Mobile-first React Native UI primitives for the BizVizCards mobile app — the
native counterpart to `@bizvizcards/ui` (web), sharing the `bizviz` palette via
`@bizvizcards/tokens`.

- **Stack:** React Native (Expo SDK 57), gluestack-ui v2, NativeWind v4.1.
- **Theme:** the `bizviz` palette, generated from `@bizvizcards/tokens` into
  `src/global.css` + `tailwind.config.js`.
- **Icons:** not bundled. Components take icon props (`icon`, `leadingIcon`, …)
  as `ReactNode`; pass `lucide-react-native` nodes from the consumer.

## Consuming app setup

```tsx
import "@bizvizcards/ui-native/global.css";
import { ThemeRoot, Button } from "@bizvizcards/ui-native";

export default function App() {
  return <ThemeRoot>{/* … */}</ThemeRoot>;
}
```

The consuming app also needs the NativeWind Babel/Metro wiring and the peer deps
listed in `package.json` — see `NOTES.md`.

## Not synced to Claude Design

Claude Design renders web React only. `@bizvizcards/ui` (web) is the design-agent
surface; this package is code-only.

## Dev

```bash
npm run storybook       # Storybook-on-web (react-native-web) at :7007
npm run review          # screenshot every story via Playwright -> .review/
npm test                # jest smoke tests
npm run example          # the Expo example app on web
```
