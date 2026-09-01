import { View, Text, Image } from "react-native";
import { cn } from "../utils/cn";

export type AvatarSize = "sm" | "md" | "lg";

export interface AvatarProps {
  /** Person or business name — alt text + initials fallback. */
  name: string;
  /** Photo URL; when absent, initials on a neutral fill are shown. */
  src?: string;
  size?: AvatarSize;
}

const BOX: Record<AvatarSize, string> = {
  sm: "h-8 w-8",
  md: "h-10 w-10",
  lg: "h-14 w-14",
};
const TEXT: Record<AvatarSize, string> = {
  sm: "text-xs",
  md: "text-sm",
  lg: "text-base",
};

function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  const first = parts[0]?.[0] ?? "";
  const last = parts.length > 1 ? (parts[parts.length - 1]?.[0] ?? "") : "";
  return (first + last).toUpperCase();
}

/** Circular user/business avatar with an initials fallback. */
export function Avatar({ name, src, size = "md" }: AvatarProps) {
  if (src) {
    return (
      <Image
        source={{ uri: src }}
        accessibilityLabel={name}
        className={cn("rounded-full", BOX[size])}
      />
    );
  }
  return (
    <View
      accessibilityLabel={name}
      className={cn(
        "items-center justify-center rounded-full bg-primary-600",
        BOX[size],
      )}
    >
      <Text className={cn("font-semibold text-typography-0", TEXT[size])}>
        {initials(name)}
      </Text>
    </View>
  );
}
