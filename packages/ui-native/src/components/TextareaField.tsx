import {
  FormControl,
  FormControlLabel,
  FormControlLabelText,
  FormControlHelper,
  FormControlHelperText,
  FormControlError,
  FormControlErrorText,
} from "./ui/form-control";
import { Textarea, TextareaInput } from "./ui/textarea";
import { cn } from "../utils/cn";

export interface TextareaFieldProps {
  label: string;
  value?: string;
  onChangeText?: (text: string) => void;
  placeholder?: string;
  errorText?: string;
  helperText?: string;
  isInvalid?: boolean;
  isDisabled?: boolean;
  numberOfLines?: number;
}

/** Multi-line text input with a label above. Controlled. */
export function TextareaField({
  label,
  value,
  onChangeText,
  placeholder,
  errorText,
  helperText,
  isInvalid,
  isDisabled,
  numberOfLines = 4,
}: TextareaFieldProps) {
  const invalid = isInvalid ?? Boolean(errorText);
  return (
    <FormControl isInvalid={invalid} isDisabled={isDisabled}>
      <FormControlLabel>
        <FormControlLabelText className="text-xs font-semibold text-typography-900">
          {label}
        </FormControlLabelText>
      </FormControlLabel>
      <Textarea
        className={cn(
          "rounded-field border-outline-100 bg-background-50",
          invalid && "border-error-700",
        )}
      >
        <TextareaInput
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          numberOfLines={numberOfLines}
        />
      </Textarea>
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
