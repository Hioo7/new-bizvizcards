import { useState } from "react";
import type { ReactNode } from "react";
import { Pressable, Text } from "react-native";
import {
  FormControl,
  FormControlLabel,
  FormControlLabelText,
  FormControlHelper,
  FormControlHelperText,
  FormControlError,
  FormControlErrorText,
} from "./ui/form-control";
import { Input, InputField, InputSlot } from "./ui/input";
import { cn } from "../utils/cn";

export interface PasswordFieldProps {
  label: string;
  value?: string;
  onChangeText?: (text: string) => void;
  leadingIcon?: ReactNode;
  /** Icon for the "reveal" toggle; falls back to a "Show" text button. */
  revealIcon?: ReactNode;
  /** Icon for the "hide" toggle; falls back to a "Hide" text button. */
  hideIcon?: ReactNode;
  errorText?: string;
  helperText?: string;
  isInvalid?: boolean;
  isDisabled?: boolean;
}

/** Password input with a built-in show/hide toggle. Controlled. */
export function PasswordField({
  label,
  value,
  onChangeText,
  leadingIcon,
  revealIcon,
  hideIcon,
  errorText,
  helperText,
  isInvalid,
  isDisabled,
}: PasswordFieldProps) {
  const invalid = isInvalid ?? Boolean(errorText);
  const [revealed, setRevealed] = useState(false);
  return (
    <FormControl isInvalid={invalid} isDisabled={isDisabled}>
      <FormControlLabel>
        <FormControlLabelText className="text-xs font-semibold text-typography-900">
          {label}
        </FormControlLabelText>
      </FormControlLabel>
      <Input
        className={cn(
          "rounded-field border-outline-100 bg-background-50",
          invalid && "border-error-700",
        )}
      >
        {leadingIcon ? <InputSlot className="pl-3">{leadingIcon}</InputSlot> : null}
        <InputField
          value={value}
          onChangeText={onChangeText}
          secureTextEntry={!revealed}
          autoCapitalize="none"
          autoComplete="password"
        />
        <InputSlot className="pr-2">
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={revealed ? "Hide password" : "Show password"}
            onPress={() => setRevealed((v) => !v)}
            className="h-11 w-11 items-center justify-center"
          >
            {revealed
              ? (hideIcon ?? (
                  <Text className="text-xs font-semibold text-typography-500">
                    Hide
                  </Text>
                ))
              : (revealIcon ?? (
                  <Text className="text-xs font-semibold text-typography-500">
                    Show
                  </Text>
                ))}
          </Pressable>
        </InputSlot>
      </Input>
      {errorText ? (
        <FormControlError>
          <FormControlErrorText>{errorText}</FormControlErrorText>
        </FormControlError>
      ) : helperText ? (
        <FormControlHelper>
          <FormControlHelperText>{helperText}</FormControlHelperText>
        </FormControlHelper>
      ) : null}
    </FormControl>
  );
}
