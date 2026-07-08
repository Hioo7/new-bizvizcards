import type { InputHTMLAttributes } from "react";
import type { UseFormRegisterReturn } from "react-hook-form";
import type { LucideIcon } from "lucide-react";

interface FormTextFieldProps
  extends Omit<InputHTMLAttributes<HTMLInputElement>, "id"> {
  id: string;
  label: string;
  icon: LucideIcon;
  error?: string;
  registration: UseFormRegisterReturn;
}

export default function FormTextField({
  id,
  label,
  icon: Icon,
  error,
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
          className={`peer w-full rounded-field border bg-base-200 pt-5 pb-2.5 pl-10 pr-4 text-sm text-base-content transition focus:bg-base-100 focus:outline-none ${
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
        <Icon className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-base-content/40" />
      </div>
      {error && <p className="mt-1.5 text-xs text-error">{error}</p>}
    </div>
  );
}
