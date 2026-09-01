import type { ReactNode } from "react";
import { useToast as useGluestackToast } from "../components/ui/toast";
import { Toast } from "../components/Toast";

export type BizToastAction = "info" | "success" | "warning" | "error";

export interface BizToastOptions {
  action?: BizToastAction;
  message: string;
  icon?: ReactNode;
  /** Auto-dismiss after this many ms. Default 3200. */
  durationMs?: number;
}

/**
 * Imperative toast:
 *
 *   const toast = useToast();
 *   toast.show({ action: "success", message: "Lead saved" });
 *
 * Renders the styled BizViz `Toast` component, top placement. Must be called
 * from inside `ThemeRoot`.
 */
export function useToast() {
  const gluestack = useGluestackToast();
  return {
    show(opts: BizToastOptions) {
      gluestack.show({
        placement: "top",
        duration: opts.durationMs ?? 3200,
        render: () => (
          <Toast action={opts.action ?? "info"} icon={opts.icon}>
            {opts.message}
          </Toast>
        ),
      });
    },
  };
}
