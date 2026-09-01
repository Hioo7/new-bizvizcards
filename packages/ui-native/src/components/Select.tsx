import type { ReactNode } from "react";
import {
  FormControl,
  FormControlLabel,
  FormControlLabelText,
  FormControlError,
  FormControlErrorText,
} from "./ui/form-control";
import {
  Select as GlueSelect,
  SelectTrigger,
  SelectInput,
  SelectIcon,
  SelectPortal,
  SelectBackdrop,
  SelectContent,
  SelectDragIndicator,
  SelectDragIndicatorWrapper,
  SelectItem,
} from "./ui/select";
import { ChevronDownIcon } from "./ui/icon";
import { cn } from "../utils/cn";

export interface SelectOption {
  label: string;
  value: string;
  isDisabled?: boolean;
}

export interface SelectProps {
  label: string;
  options: SelectOption[];
  selectedValue?: string;
  onValueChange?: (value: string) => void;
  placeholder?: string;
  leadingIcon?: ReactNode;
  errorText?: string;
  isInvalid?: boolean;
  isDisabled?: boolean;
}

/** Native-feel picker (opens an actionsheet). Controlled. */
export function Select({
  label,
  options,
  selectedValue,
  onValueChange,
  placeholder = "Select…",
  errorText,
  isInvalid,
  isDisabled,
}: SelectProps) {
  const invalid = isInvalid ?? Boolean(errorText);
  return (
    <FormControl isInvalid={invalid} isDisabled={isDisabled}>
      <FormControlLabel>
        <FormControlLabelText className="text-xs font-semibold text-typography-900">
          {label}
        </FormControlLabelText>
      </FormControlLabel>
      <GlueSelect
        selectedValue={selectedValue}
        onValueChange={onValueChange}
        isDisabled={isDisabled}
      >
        <SelectTrigger
          className={cn(
            "rounded-field border-outline-100 bg-background-50",
            invalid && "border-error-700",
          )}
        >
          <SelectInput placeholder={placeholder} />
          <SelectIcon className="mr-3" as={ChevronDownIcon} />
        </SelectTrigger>
        <SelectPortal>
          <SelectBackdrop />
          <SelectContent className="bg-background-0">
            <SelectDragIndicatorWrapper>
              <SelectDragIndicator />
            </SelectDragIndicatorWrapper>
            {options.map((opt) => (
              <SelectItem
                key={opt.value}
                label={opt.label}
                value={opt.value}
                isDisabled={opt.isDisabled}
              />
            ))}
          </SelectContent>
        </SelectPortal>
      </GlueSelect>
      {errorText ? (
        <FormControlError>
          <FormControlErrorText>{errorText}</FormControlErrorText>
        </FormControlError>
      ) : null}
    </FormControl>
  );
}
