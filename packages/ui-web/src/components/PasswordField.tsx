import { useId, useState } from "react";
import type { InputHTMLAttributes, ReactNode } from "react";
import { cn } from "../utils/cn";

export interface PasswordFieldProps
  extends Omit<
    InputHTMLAttributes<HTMLInputElement>,
    "className" | "size" | "type"
  > {
  label: string;
  icon?: ReactNode;
  error?: string;
  hint?: string;
  /** Icon for the "reveal" toggle; falls back to a text button when omitted. */
  revealIcon?: ReactNode;
  /** Icon for the "hide" toggle. */
  hideIcon?: ReactNode;
}

/**
 * Password input with a built-in show/hide toggle. Controlled — pass `value`
 * and `onChange`. The reveal state is local.
 */
export function PasswordField({
  label,
  icon,
  error,
  hint,
  revealIcon,
  hideIcon,
  id,
  ...rest
}: PasswordFieldProps) {
  const generatedId = useId();
  const fieldId = id ?? generatedId;
  const describedById = error || hint ? `${fieldId}-desc` : undefined;
  const [revealed, setRevealed] = useState(false);

  return (
    <div>
      <div className="relative">
        <input
          id={fieldId}
          type={revealed ? "text" : "password"}
          placeholder=" "
          aria-invalid={error ? true : undefined}
          aria-describedby={describedById}
          className={cn(
            "peer w-full rounded-field border bg-base-200 pt-5 pb-2.5 pr-12 text-sm text-base-content transition",
            "focus:bg-base-100 focus:outline-none",
            icon ? "pl-10" : "pl-4",
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
        <button
          type="button"
          onClick={() => setRevealed((v) => !v)}
          aria-label={revealed ? "Hide password" : "Show password"}
          className="absolute right-1 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-field text-base-content/50 hover:text-primary"
        >
          {revealed
            ? (hideIcon ?? <span className="text-xs font-semibold">Hide</span>)
            : (revealIcon ?? <span className="text-xs font-semibold">Show</span>)}
        </button>
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
