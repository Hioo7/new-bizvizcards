import { useState, type InputHTMLAttributes, type ReactNode } from "react";
import type { UseFormRegisterReturn } from "react-hook-form";
import { Eye, EyeOff, Lock } from "lucide-react";

interface PasswordFieldProps
  extends Omit<InputHTMLAttributes<HTMLInputElement>, "id" | "type"> {
  id: string;
  label: string;
  error?: string;
  registration: UseFormRegisterReturn;
  belowField?: ReactNode;
}

export default function PasswordField({
  id,
  label,
  error,
  registration,
  belowField,
  ...inputProps
}: PasswordFieldProps) {
  const [showPassword, setShowPassword] = useState(false);

  return (
    <div>
      <div className="relative">
        <input
          id={id}
          type={showPassword ? "text" : "password"}
          placeholder=" "
          {...registration}
          {...inputProps}
          className={`peer w-full rounded-field border bg-base-200 pt-5 pb-2.5 pl-10 pr-11 text-sm text-base-content transition focus:bg-base-100 focus:outline-none ${
            error
              ? "border-error focus:border-error"
              : "border-base-300 focus:border-primary"
          }`}
        />
        <label
          htmlFor={id}
          className="pointer-events-none absolute left-10 top-1.5 text-[10px] font-semibold text-base-content transition-all duration-200 peer-placeholder-shown:top-3.5 peer-placeholder-shown:text-sm peer-placeholder-shown:font-normal peer-placeholder-shown:text-base-content/40 peer-focus:top-1.5 peer-focus:text-[10px] peer-focus:font-semibold peer-focus:text-primary"
        >
          {label}
        </label>
        <Lock className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-base-content/40" />
        <button
          type="button"
          onClick={() => setShowPassword((shown) => !shown)}
          className="absolute right-3 top-1/2 min-h-[2.75rem] min-w-[2.75rem] -translate-y-1/2 p-1 text-base-content/40 transition-colors hover:text-base-content/70"
          aria-label={showPassword ? "Hide password" : "Show password"}
        >
          {showPassword ? (
            <EyeOff className="mx-auto h-4 w-4" />
          ) : (
            <Eye className="mx-auto h-4 w-4" />
          )}
        </button>
      </div>
      {error && <p className="mt-1.5 text-xs text-error">{error}</p>}
      {belowField}
    </div>
  );
}
