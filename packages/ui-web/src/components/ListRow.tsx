import type { ReactNode } from "react";
import { cn } from "../utils/cn";

export interface ListRowProps {
  title: string;
  subtitle?: string;
  /** Leading visual — an icon, `Avatar`, or small thumbnail. */
  leading?: ReactNode;
  /** Trailing content — a value, `Badge`, `IconButton`, or left empty. */
  trailing?: ReactNode;
  onClick?: () => void;
  /** Show a chevron on the trailing edge (implies the row navigates). */
  showChevron?: boolean;
}

function Chevron() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-4 w-4 text-base-content/30"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M9 6l6 6-6 6"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/** A single row in a list — tappable when `onClick` is set. */
export function ListRow({
  title,
  subtitle,
  leading,
  trailing,
  onClick,
  showChevron = false,
}: ListRowProps) {
  const className = cn(
    "flex min-h-[3.5rem] w-full items-center gap-3 px-1 py-2 text-left",
    onClick && "transition-colors active:bg-base-200",
  );
  const body = (
    <>
      {leading ? (
        <span className="flex h-10 w-10 shrink-0 items-center justify-center text-base-content/70">
          {leading}
        </span>
      ) : null}
      <span className="flex min-w-0 flex-1 flex-col">
        <span className="truncate text-sm font-medium text-base-content">
          {title}
        </span>
        {subtitle ? (
          <span className="truncate text-xs text-base-content/60">
            {subtitle}
          </span>
        ) : null}
      </span>
      {trailing ? (
        <span className="flex shrink-0 items-center text-sm text-base-content/60">
          {trailing}
        </span>
      ) : null}
      {showChevron ? <Chevron /> : null}
    </>
  );

  if (onClick) {
    return (
      <button type="button" onClick={onClick} className={className}>
        {body}
      </button>
    );
  }
  return <div className={className}>{body}</div>;
}
