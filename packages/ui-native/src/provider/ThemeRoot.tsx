import type { ReactNode } from "react";
import { GluestackUIProvider } from "../components/ui/gluestack-ui-provider";

export interface ThemeRootProps {
  children: ReactNode;
}

/**
 * App-level provider — applies the `bizviz` theme (light). Wrap the app root
 * once. Also required around any isolated subtree that renders BizViz UI
 * (tests, Storybook stories).
 */
export function ThemeRoot({ children }: ThemeRootProps) {
  return <GluestackUIProvider mode="light">{children}</GluestackUIProvider>;
}
