import { View, Text } from "react-native";
import {
  RadioGroup as GlueRadioGroup,
  Radio,
  RadioIndicator,
  RadioIcon,
} from "./ui/radio";
import { CircleIcon } from "./ui/icon";

export interface RadioOption {
  label: string;
  value: string;
  description?: string;
  isDisabled?: boolean;
}

export interface RadioGroupProps {
  /** Group heading. */
  label: string;
  options: RadioOption[];
  value: string;
  onChange: (value: string) => void;
}

/** A single-select list of radio options. Controlled. */
export function RadioGroup({ label, options, value, onChange }: RadioGroupProps) {
  return (
    <View>
      <Text className="mb-1.5 text-xs font-semibold text-typography-900">
        {label}
      </Text>
      <GlueRadioGroup value={value} onChange={onChange}>
        <View className="gap-1">
          {options.map((opt) => (
            <Radio
              key={opt.value}
              value={opt.value}
              isDisabled={opt.isDisabled}
              className="min-h-[44px] flex-row items-start gap-3 py-1"
            >
              <RadioIndicator>
                <RadioIcon as={CircleIcon} />
              </RadioIndicator>
              <View className="flex-1">
                <Text className="text-sm font-medium text-typography-900">
                  {opt.label}
                </Text>
                {opt.description ? (
                  <Text className="text-xs text-typography-500">
                    {opt.description}
                  </Text>
                ) : null}
              </View>
            </Radio>
          ))}
        </View>
      </GlueRadioGroup>
    </View>
  );
}
