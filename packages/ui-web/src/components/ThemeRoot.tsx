import type { ReactNode } from "react";

export interface ThemeRootProps {
  children: ReactNode;
}

/**
 * Scopes the `bizviz` daisyUI theme to a subtree. The theme is also emitted at
 * `:root` (it is daisyUI's `default`), so this is only needed when embedding
 * BizViz UI inside a surface that already carries a different `data-theme`.
 */
export function ThemeRoot({ children }: ThemeRootProps) {
  return (
    <div data-theme="bizviz" className="bg-base-100 text-base-content">
      {children}
    </div>
  );
}
