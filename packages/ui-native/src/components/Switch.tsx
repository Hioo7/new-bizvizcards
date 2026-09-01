import { View, Text } from "react-native";
import { Switch as GlueSwitch } from "./ui/switch";
import { colors } from "@bizvizcards/tokens";

export interface SwitchProps {
  label: string;
  /** Secondary line under the label. */
  description?: string;
  value?: boolean;
  onValueChange?: (value: boolean) => void;
  isDisabled?: boolean;
}

/** A labelled on/off toggle in a full-width row. Controlled. */
export function Switch({
  label,
  description,
  value,
  onValueChange,
  isDisabled,
}: SwitchProps) {
  return (
    <View className="min-h-[44px] flex-row items-center justify-between gap-4 py-1">
      <View className="flex-1">
        <Text className="text-sm font-medium text-typography-900">{label}</Text>
        {description ? (
          <Text className="text-xs text-typography-500">{description}</Text>
        ) : null}
      </View>
      <GlueSwitch
        value={value}
        onValueChange={onValueChange}
        disabled={isDisabled}
        trackColor={{ true: colors.primary, false: colors["base-300"] }}
        thumbColor={colors["base-100"]}
        ios_backgroundColor={colors["base-300"]}
      />
    </View>
  );
}
