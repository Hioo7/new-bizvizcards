import type { ReactNode } from "react";
import { View, Text, Pressable } from "react-native";
import Svg, { Path } from "react-native-svg";
import { colors } from "@bizvizcards/tokens";
import { cn } from "../utils/cn";

export interface ListRowProps {
  title: string;
  subtitle?: string;
  /** Leading visual — an icon, `Avatar`, or small thumbnail. */
  leading?: ReactNode;
  /** Trailing content — a value, `Badge`, `IconButton`, or left empty. */
  trailing?: ReactNode;
  onPress?: () => void;
  /** Show a chevron on the trailing edge (implies the row navigates). */
  showChevron?: boolean;
}

function Chevron() {
  return (
    <Svg width={16} height={16} viewBox="0 0 24 24" fill="none">
      <Path
        d="M9 6l6 6-6 6"
        stroke={colors["base-content"]}
        strokeOpacity={0.3}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

/** A single row in a list — tappable when `onPress` is set. */
export function ListRow({
  title,
  subtitle,
  leading,
  trailing,
  onPress,
  showChevron = false,
}: ListRowProps) {
  const body = (
    <View className="min-h-[56px] flex-row items-center gap-3 px-1 py-2">
      {leading ? (
        <View className="h-10 w-10 items-center justify-center">{leading}</View>
      ) : null}
      <View className="min-w-0 flex-1">
        <Text numberOfLines={1} className="text-sm font-medium text-typography-900">
          {title}
        </Text>
        {subtitle ? (
          <Text numberOfLines={1} className="text-xs text-typography-500">
            {subtitle}
          </Text>
        ) : null}
      </View>
      {trailing ? (
        <View className="flex-row items-center">{trailing}</View>
      ) : null}
      {showChevron ? <Chevron /> : null}
    </View>
  );

  if (onPress) {
    return (
      <Pressable onPress={onPress} className="active:bg-background-50">
        {body}
      </Pressable>
    );
  }
  return body;
}
