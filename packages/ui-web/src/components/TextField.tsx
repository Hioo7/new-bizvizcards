import { useId } from "react";
import type { InputHTMLAttributes, ReactNode } from "react";
import { cn } from "../utils/cn";

export interface TextFieldProps
  extends Omit<InputHTMLAttributes<HTMLInputElement>, "className" | "size"> {
  /** Always present — the floating label doubles as the placeholder. */
  label: string;
  /** Leading affordance icon (e.g. an envelope for email). */
  icon?: ReactNode;
  /** Persistent validation message; also switches the field to its error style. */
  error?: string;
  /** Neutral helper text shown when there is no error. */
  hint?: string;
  /** Trailing control inside the field (e.g. a "generate" icon button). */
  trailingSlot?: ReactNode;
}

/**
 * Single-line text input with a floating label. Controlled — pass `value` and
 * `onChange`. Validate inline (set `error` as the user types), not only on submit.
 */
export function TextField({
  label,
  icon,
  error,
  hint,
  trailingSlot,
  id,
  ...rest
}: TextFieldProps) {
  const generatedId = useId();
  const fieldId = id ?? generatedId;
  const describedById = error || hint ? `${fieldId}-desc` : undefined;

  return (
    <div>
      <div className="relative">
        <input
          id={fieldId}
          placeholder=" "
          aria-invalid={error ? true : undefined}
          aria-describedby={describedById}
          className={cn(
            "peer w-full rounded-field border bg-base-200 pt-5 pb-2.5 text-sm text-base-content transition",
            "focus:bg-base-100 focus:outline-none",
            icon ? "pl-10" : "pl-4",
            trailingSlot ? "pr-12" : "pr-4",
            error
              ? "border-error focus:border-error"
              : "border-base-300 focus:border-primary",
          )}
          {...rest}
        />
        <label
          htmlFor={fieldId}
          className={cn(
            "pointer-events-none absolute top-1.5 text-[10px] font-semibold text-base-content transition-all duration-200",
            icon ? "left-10" : "left-4",
            "peer-placeholder-shown:top-3.5 peer-placeholder-shown:text-sm peer-placeholder-shown:font-normal peer-placeholder-shown:text-base-content/40",
            "peer-focus:top-1.5 peer-focus:text-[10px] peer-focus:font-semibold peer-focus:text-primary",
          )}
        >
          {label}
        </label>
        {icon ? (
          <span className="pointer-events-none absolute left-3.5 top-1/2 flex h-4 w-4 -translate-y-1/2 items-center justify-center text-base-content/40">
            {icon}
          </span>
        ) : null}
        {trailingSlot ? (
          <span className="absolute right-1 top-1/2 -translate-y-1/2">
            {trailingSlot}
          </span>
        ) : null}
      </div>
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
