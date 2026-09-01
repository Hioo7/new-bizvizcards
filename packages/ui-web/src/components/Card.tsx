import type { ReactNode } from "react";
import { cn } from "../utils/cn";

export interface CardProps {
  children: ReactNode;
  /** Renders as a button and adds a press affordance. */
  onClick?: () => void;
  /** Remove the inner padding (for edge-to-edge media or lists). */
  flush?: boolean;
}

/** A surface container — the default frame for grouped content on a screen. */
export function Card({ children, onClick, flush = false }: CardProps) {
  const className = cn(
    "block w-full rounded-box border border-base-300 bg-base-100 text-left shadow-sm",
    !flush && "p-4",
    onClick && "transition-colors active:bg-base-200",
  );

  if (onClick) {
    return (
      <button type="button" onClick={onClick} className={className}>
        {children}
      </button>
    );
  }
  return <div className={className}>{children}</div>;
}
