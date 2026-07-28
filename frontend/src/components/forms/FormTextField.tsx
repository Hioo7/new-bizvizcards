import type { InputHTMLAttributes } from "react";
import type { UseFormRegisterReturn } from "react-hook-form";
import type { LucideIcon } from "lucide-react";

interface FormTextFieldTrailingAction {
  icon: LucideIcon;
  label: string;
  onClick: () => void;
  isLoading?: boolean;
}

interface FormTextFieldProps
  extends Omit<InputHTMLAttributes<HTMLInputElement>, "id"> {
  id: string;
  label: string;
  icon: LucideIcon;
  error?: string;
  /** Brief attention-drawing pulse (e.g. right after a server validation error surfaces),
   * independent of and in addition to the persistent `error` styling above. */
  highlight?: boolean;
  /** Optional icon button on the trailing edge of the field (e.g. "generate a value"). */
  trailingAction?: FormTextFieldTrailingAction;
  registration: UseFormRegisterReturn;
}

export default function FormTextField({
  id,
  label,
  icon: Icon,
  error,
  highlight = false,
  trailingAction,
  registration,
  ...inputProps
}: FormTextFieldProps) {
  return (
    <div>
      <div className="relative">
        <input
          id={id}
          placeholder=" "
          {...registration}
          {...inputProps}
          className={`peer w-full rounded-field border bg-base-200 pt-5 pb-2.5 pl-10 ${
            trailingAction ? "pr-12" : "pr-4"
          } text-sm text-base-content transition focus:bg-base-100 focus:outline-none ${
            error
              ? "border-error focus:border-error"
              : "border-base-300 focus:border-primary"
          } ${highlight ? "ring-2 ring-error/60 animate-pulse" : ""}`}
        />
        <label
          htmlFor={id}
          className="pointer-events-none absolute left-10 top-1.5 text-[10px] font-semibold text-base-content transition-all duration-200 peer-placeholder-shown:top-3.5 peer-placeholder-shown:text-sm peer-placeholder-shown:font-normal peer-placeholder-shown:text-base-content/40 peer-focus:top-1.5 peer-focus:text-[10px] peer-focus:font-semibold peer-focus:text-primary"
        >
          {label}
        </label>
        <Icon className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-base-content/40" />
        {trailingAction && (
          <button
            type="button"
            onClick={trailingAction.onClick}
            disabled={trailingAction.isLoading}
            aria-label={trailingAction.label}
            title={trailingAction.label}
            className="absolute right-0 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-field text-base-content/50 hover:bg-base-300 hover:text-primary disabled:opacity-50"
          >
            {trailingAction.isLoading ? (
              <span className="loading loading-spinner loading-xs" />
            ) : (
              <trailingAction.icon className="h-4 w-4" />
            )}
          </button>
        )}
      </div>
      {error && <p className="mt-1.5 text-xs text-error">{error}</p>}
    </div>
  );
}
