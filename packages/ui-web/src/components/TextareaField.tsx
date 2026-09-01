import { useId } from "react";
import type { ReactNode, TextareaHTMLAttributes } from "react";
import { cn } from "../utils/cn";

export interface TextareaFieldProps
  extends Omit<TextareaHTMLAttributes<HTMLTextAreaElement>, "className"> {
  label: string;
  icon?: ReactNode;
  error?: string;
  hint?: string;
}

/** Multi-line text input with a static label above the field. Controlled. */
export function TextareaField({
  label,
  icon,
  error,
  hint,
  id,
  rows = 4,
  ...rest
}: TextareaFieldProps) {
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
      <textarea
        id={fieldId}
        rows={rows}
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
      />
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
