import type { ReactNode } from "react";
import { cn } from "../utils/cn";

export interface BottomNavItem {
  key: string;
  label: string;
  icon: ReactNode;
}

export interface BottomNavProps {
  items: BottomNavItem[];
  activeKey: string;
  onSelect: (key: string) => void;
}

/**
 * The app-shell tab bar. Render it once at the root of the authenticated shell;
 * the consumer is responsible for pinning it (`fixed bottom-0` / safe-area
 * padding) and offsetting page content.
 */
export function BottomNav({ items, activeKey, onSelect }: BottomNavProps) {
  return (
    <nav className="flex h-16 w-full items-stretch border-t border-base-300 bg-base-100">
      {items.map((item) => {
        const active = item.key === activeKey;
        return (
          <button
            key={item.key}
            type="button"
            onClick={() => onSelect(item.key)}
            aria-current={active ? "page" : undefined}
            className={cn(
              "flex flex-1 flex-col items-center justify-center gap-0.5 transition-colors",
              active
                ? "text-primary"
                : "text-base-content/40 hover:text-base-content/60",
            )}
          >
            <span className="flex h-6 w-6 items-center justify-center">
              {item.icon}
            </span>
            <span className="text-[10px] font-medium leading-none">
              {item.label}
            </span>
          </button>
        );
      })}
    </nav>
  );
}
