import type { ReactNode } from "react";
import { cn } from "../utils/cn";

export interface TabItem {
  key: string;
  label: string;
  icon?: ReactNode;
}

export interface TabsProps {
  items: TabItem[];
  activeKey: string;
  onSelect: (key: string) => void;
  /** Stretch tabs to fill the row. */
  block?: boolean;
}

/** Underlined section navigation within a screen. */
export function Tabs({ items, activeKey, onSelect, block = false }: TabsProps) {
  return (
    <div
      role="tablist"
      className={cn(
        "flex border-b border-base-300",
        block ? "w-full" : "gap-1",
      )}
    >
      {items.map((item) => {
        const active = item.key === activeKey;
        return (
          <button
            key={item.key}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onSelect(item.key)}
            className={cn(
              "flex min-h-11 items-center justify-center gap-1.5 border-b-2 px-3 text-sm font-medium transition-colors",
              block && "flex-1",
              active
                ? "border-primary text-primary"
                : "border-transparent text-base-content/50 hover:text-base-content/70",
            )}
          >
            {item.icon ? (
              <span className="flex h-4 w-4 items-center justify-center">
                {item.icon}
              </span>
            ) : null}
            {item.label}
          </button>
        );
      })}
    </div>
  );
}
