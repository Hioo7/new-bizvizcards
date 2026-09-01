import { useId } from "react";

export interface RadioOption {
  label: string;
  value: string;
  description?: string;
  disabled?: boolean;
}

export interface RadioGroupProps {
  /** Group heading. */
  label: string;
  options: RadioOption[];
  value: string;
  onChange: (value: string) => void;
  /** Shared `name` for the underlying inputs; auto-generated when omitted. */
  name?: string;
}

/** A single-select list of radio options. Controlled. */
export function RadioGroup({
  label,
  options,
  value,
  onChange,
  name,
}: RadioGroupProps) {
  const generatedName = useId();
  const groupName = name ?? generatedName;

  return (
    <fieldset>
      <legend className="mb-1.5 text-xs font-semibold text-base-content">
        {label}
      </legend>
      <div className="flex flex-col gap-1">
        {options.map((opt) => (
          <label
            key={opt.value}
            className="flex min-h-11 cursor-pointer items-start gap-3 py-1"
          >
            <input
              type="radio"
              name={groupName}
              value={opt.value}
              checked={value === opt.value}
              disabled={opt.disabled}
              onChange={() => onChange(opt.value)}
              className="radio radio-primary mt-0.5"
            />
            <span className="flex flex-col">
              <span className="text-sm font-medium text-base-content">
                {opt.label}
              </span>
              {opt.description ? (
                <span className="text-xs text-base-content/60">
                  {opt.description}
                </span>
              ) : null}
            </span>
          </label>
        ))}
      </div>
    </fieldset>
  );
}
