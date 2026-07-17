import { Layers } from "lucide-react";
import type { LucideIcon } from "lucide-react";

interface MediaThumbnailProps {
  previewUrl: string | null;
  fallbackIcon?: LucideIcon;
  size?: "sm" | "md";
}

const SIZE_CLASSES: Record<"sm" | "md", { wrapper: string; icon: string }> = {
  sm: { wrapper: "h-9 w-9", icon: "h-4 w-4" },
  md: { wrapper: "h-11 w-11", icon: "h-5 w-5" },
};

export default function MediaThumbnail({
  previewUrl,
  fallbackIcon: Icon = Layers,
  size = "sm",
}: MediaThumbnailProps) {
  const sizeClasses = SIZE_CLASSES[size];

  if (previewUrl) {
    return (
      <img
        src={previewUrl}
        alt=""
        className={`shrink-0 rounded-full object-cover ${sizeClasses.wrapper}`}
      />
    );
  }

  return (
    <span
      className={`flex shrink-0 items-center justify-center rounded-full bg-accent/15 text-accent ${sizeClasses.wrapper}`}
    >
      <Icon className={sizeClasses.icon} />
    </span>
  );
}
