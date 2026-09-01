import { View, Text } from "react-native";
import {
  Checkbox as GlueCheckbox,
  CheckboxIndicator,
  CheckboxIcon,
} from "./ui/checkbox";
import { CheckIcon } from "./ui/icon";

export interface CheckboxProps {
  label: string;
  description?: string;
  value: string;
  isChecked?: boolean;
  onChange?: (checked: boolean) => void;
  isDisabled?: boolean;
}

/** A labelled checkbox. Controlled — pass `isChecked` and `onChange`. */
export function Checkbox({
  label,
  description,
  value,
  isChecked,
  onChange,
  isDisabled,
}: CheckboxProps) {
  return (
    <GlueCheckbox
      value={value}
      isChecked={isChecked}
      onChange={onChange}
      isDisabled={isDisabled}
      className="min-h-[44px] flex-row items-start gap-3 py-1"
    >
      <CheckboxIndicator>
        <CheckboxIcon as={CheckIcon} />
      </CheckboxIndicator>
      <View className="flex-1">
        <Text className="text-sm font-medium text-typography-900">{label}</Text>
        {description ? (
          <Text className="text-xs text-typography-500">{description}</Text>
        ) : null}
      </View>
    </GlueCheckbox>
  );
}
