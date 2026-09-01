import type {
  FormPlaceholderOption,
  PlaceholderOption,
} from "@app-types/bulkMessenger";

interface PlaceholderPaletteProps {
  core: PlaceholderOption[];
  formFields: FormPlaceholderOption[];
  isLoading: boolean;
  onInsert: (token: string) => void;
}

function Chip({
  option,
  onInsert,
}: {
  option: PlaceholderOption;
  onInsert: (token: string) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onInsert(option.token)}
      className="rounded-field border border-base-300 bg-base-100 px-2.5 py-1 text-xs font-medium text-base-content hover:border-primary hover:bg-primary/5"
    >
      {option.label}
    </button>
  );
}

export default function PlaceholderPalette({
  core,
  formFields,
  isLoading,
  onInsert,
}: PlaceholderPaletteProps) {
  return (
    <div className="flex flex-col gap-2 rounded-field border border-base-300 bg-base-200 p-3">
      <p className="text-xs font-semibold text-base-content/60">
        Tap to insert a placeholder
      </p>
      {isLoading ? (
        <p className="text-xs text-base-content/50">Loading placeholders…</p>
      ) : (
        <>
          <div className="flex flex-wrap gap-1.5">
            {core.map((option) => (
              <Chip key={option.token} option={option} onInsert={onInsert} />
            ))}
          </div>
          {formFields.length > 0 && (
            <>
              <p className="mt-1 text-xs font-semibold text-base-content/60">
                From the linked form
              </p>
              <div className="flex flex-wrap gap-1.5">
                {formFields.map((option) => (
                  <Chip
                    key={option.token}
                    option={option}
                    onInsert={onInsert}
                  />
                ))}
              </div>
            </>
          )}
        </>
      )}
    </div>
  );
}
