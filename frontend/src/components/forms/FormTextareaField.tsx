import type { TextareaHTMLAttributes } from "react";
import type { UseFormRegisterReturn } from "react-hook-form";

interface FormTextareaFieldProps
  extends Omit<TextareaHTMLAttributes<HTMLTextAreaElement>, "id"> {
  id: string;
  label: string;
  error?: string;
  registration: UseFormRegisterReturn;
}

export default function FormTextareaField({
  id,
  label,
  error,
  registration,
  rows = 3,
  ...textareaProps
}: FormTextareaFieldProps) {
  return (
    <div>
      <label
        htmlFor={id}
        className="mb-1.5 block text-xs font-semibold text-base-content/70"
      >
        {label}
      </label>
      <textarea
        id={id}
        rows={rows}
        {...registration}
        {...textareaProps}
        className={`w-full resize-none rounded-field border bg-base-200 px-3 py-2.5 text-sm text-base-content transition focus:bg-base-100 focus:outline-none ${
          error
            ? "border-error focus:border-error"
            : "border-base-300 focus:border-primary"
        }`}
      />
      {error && <p className="mt-1.5 text-xs text-error">{error}</p>}
    </div>
  );
}
