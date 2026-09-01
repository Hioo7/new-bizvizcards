import type { ComponentProps, ReactNode } from "react";
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

type InputFieldProps = ComponentProps<typeof InputField>;

export interface TextFieldProps {
  /** Always present — sits above the field. */
  label: string;
  value?: string;
  onChangeText?: (text: string) => void;
  placeholder?: string;
  /** Leading affordance icon (e.g. an envelope for email). */
  leadingIcon?: ReactNode;
  /** Trailing control inside the field. */
  trailingSlot?: ReactNode;
  /** Persistent validation message; also switches the field to its error style. */
  errorText?: string;
  /** Neutral helper text shown when there is no error. */
  helperText?: string;
  isInvalid?: boolean;
  isDisabled?: boolean;
  keyboardType?: InputFieldProps["keyboardType"];
  autoCapitalize?: InputFieldProps["autoCapitalize"];
  autoComplete?: InputFieldProps["autoComplete"];
}

/** Single-line text input with a label above. Controlled. Validate inline. */
export function TextField({
  label,
  value,
  onChangeText,
  placeholder,
  leadingIcon,
  trailingSlot,
  errorText,
  helperText,
  isInvalid,
  isDisabled,
  keyboardType,
  autoCapitalize,
  autoComplete,
}: TextFieldProps) {
  const invalid = isInvalid ?? Boolean(errorText);
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
          placeholder={placeholder}
          keyboardType={keyboardType}
          autoCapitalize={autoCapitalize}
          autoComplete={autoComplete}
        />
        {trailingSlot ? (
          <InputSlot className="pr-1">{trailingSlot}</InputSlot>
        ) : null}
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
