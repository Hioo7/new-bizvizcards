import { useId } from "react";
import type { InputHTMLAttributes } from "react";

export interface CheckboxProps
  extends Omit<
    InputHTMLAttributes<HTMLInputElement>,
    "className" | "type" | "size"
  > {
  label: string;
  description?: string;
}

/** A labelled checkbox. Controlled — pass `checked` and `onChange`. */
export function Checkbox({ label, description, id, ...rest }: CheckboxProps) {
  const generatedId = useId();
  const fieldId = id ?? generatedId;

  return (
    <label
      htmlFor={fieldId}
      className="flex min-h-11 cursor-pointer items-start gap-3 py-1"
    >
      <input
        id={fieldId}
        type="checkbox"
        className="checkbox checkbox-primary mt-0.5"
        {...rest}
      />
      <span className="flex flex-col">
        <span className="text-sm font-medium text-base-content">{label}</span>
        {description ? (
          <span className="text-xs text-base-content/60">{description}</span>
        ) : null}
      </span>
    </label>
  );
}
