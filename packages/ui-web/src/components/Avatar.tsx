import { cn } from "../utils/cn";

export type AvatarSize = "sm" | "md" | "lg";

export interface AvatarProps {
  /** Person or business name — used for the alt text and the initials fallback. */
  name: string;
  /** Photo URL; when absent, initials on a neutral fill are shown. */
  src?: string;
  size?: AvatarSize;
}

const SIZE_CLASS: Record<AvatarSize, string> = {
  sm: "w-8 text-xs",
  md: "w-10 text-sm",
  lg: "w-14 text-base",
};

function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  const first = parts[0]?.[0] ?? "";
  const last = parts.length > 1 ? (parts[parts.length - 1]?.[0] ?? "") : "";
  return (first + last).toUpperCase();
}

/** A circular user/business avatar with an initials fallback. */
export function Avatar({ name, src, size = "md" }: AvatarProps) {
  if (src) {
    return (
      <div className="avatar">
        <div className={cn("rounded-full", SIZE_CLASS[size])}>
          <img src={src} alt={name} />
        </div>
      </div>
    );
  }
  return (
    <div className="avatar avatar-placeholder">
      <div
        className={cn(
          "rounded-full bg-neutral text-neutral-content",
          SIZE_CLASS[size],
        )}
      >
        <span className="font-semibold">{initials(name)}</span>
      </div>
    </div>
  );
}
