import { useId } from "react";
import type { ReactNode, SelectHTMLAttributes } from "react";
import { cn } from "../utils/cn";

export interface SelectOption {
  label: string;
  value: string;
  disabled?: boolean;
}

export interface SelectProps
  extends Omit<
    SelectHTMLAttributes<HTMLSelectElement>,
    "className" | "children"
  > {
  label: string;
  icon?: ReactNode;
  error?: string;
  hint?: string;
  options: SelectOption[];
  /** Shown as a disabled first row when the value is empty. */
  placeholder?: string;
}

/** Native select styled to match the text fields. Controlled. */
export function Select({
  label,
  icon,
  error,
  hint,
  options,
  placeholder,
  id,
  value,
  ...rest
}: SelectProps) {
  const generatedId = useId();
  const fieldId = id ?? generatedId;
  const describedById = error || hint ? `${fieldId}-desc` : undefined;

  return (
    <div>
      <label
        htmlFor={fieldId}
        className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold text-base-content"
      >
        {icon ? (
          <span className="flex h-3.5 w-3.5 items-center justify-center text-base-content/50">
            {icon}
          </span>
        ) : null}
        {label}
      </label>
      <select
        id={fieldId}
        value={value}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedById}
        className={cn(
          "w-full rounded-field border bg-base-200 px-4 py-3 text-sm text-base-content transition",
          "focus:bg-base-100 focus:outline-none",
          error
            ? "border-error focus:border-error"
            : "border-base-300 focus:border-primary",
        )}
        {...rest}
      >
        {placeholder ? (
          <option value="" disabled>
            {placeholder}
          </option>
        ) : null}
        {options.map((opt) => (
          <option key={opt.value} value={opt.value} disabled={opt.disabled}>
            {opt.label}
          </option>
        ))}
      </select>
      {error ? (
        <p id={describedById} className="mt-1.5 text-xs text-error">
          {error}
        </p>
      ) : hint ? (
        <p id={describedById} className="mt-1.5 text-xs text-base-content/50">
          {hint}
        </p>
      ) : null}
    </div>
  );
}
