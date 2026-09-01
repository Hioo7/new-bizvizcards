import { useId } from "react";
import type { InputHTMLAttributes } from "react";
import { cn } from "../utils/cn";

export interface SwitchProps
  extends Omit<
    InputHTMLAttributes<HTMLInputElement>,
    "className" | "type" | "size"
  > {
  label: string;
  /** Secondary line under the label. */
  description?: string;
}

/** A labelled on/off toggle. Controlled — pass `checked` and `onChange`. */
export function Switch({ label, description, id, ...rest }: SwitchProps) {
  const generatedId = useId();
  const fieldId = id ?? generatedId;

  return (
    <label
      htmlFor={fieldId}
      className={cn(
        "flex min-h-11 cursor-pointer items-center justify-between gap-4 py-1",
      )}
    >
      <span className="flex flex-col">
        <span className="text-sm font-medium text-base-content">{label}</span>
        {description ? (
          <span className="text-xs text-base-content/60">{description}</span>
        ) : null}
      </span>
      <input
        id={fieldId}
        type="checkbox"
        className="toggle toggle-primary"
        {...rest}
      />
    </label>
  );
}
