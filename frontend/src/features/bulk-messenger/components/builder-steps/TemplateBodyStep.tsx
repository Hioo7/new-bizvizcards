import { useRef } from "react";
import { AlertCircle, Info } from "lucide-react";
import type {
  FormPlaceholderOption,
  PlaceholderOption,
} from "@app-types/bulkMessenger";
import { BULK_MESSAGE_TEMPLATE_BODY_MAX_LENGTH } from "@features/bulk-messenger/config/bulkMessenger.config";
import {
  findUnknownTokens,
  insertTokenAtCursor,
} from "@features/bulk-messenger/utils/placeholderTokens";
import PlaceholderPalette from "@features/bulk-messenger/components/PlaceholderPalette";

interface TemplateBodyStepProps {
  body: string;
  onChange: (body: string) => void;
  core: PlaceholderOption[];
  formFields: FormPlaceholderOption[];
  availableTokens: Set<string>;
  placeholdersLoading: boolean;
  bodyNeedsReentry: boolean;
}

export default function TemplateBodyStep({
  body,
  onChange,
  core,
  formFields,
  availableTokens,
  placeholdersLoading,
  bodyNeedsReentry,
}: TemplateBodyStepProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const unknownTokens = placeholdersLoading
    ? []
    : findUnknownTokens(body, availableTokens);

  function handleInsert(token: string) {
    const textarea = textareaRef.current;
    const start = textarea?.selectionStart ?? body.length;
    const end = textarea?.selectionEnd ?? body.length;
    const next = insertTokenAtCursor(body, start, end, token);
    onChange(next.value);
    requestAnimationFrame(() => {
      if (!textarea) return;
      textarea.focus();
      textarea.setSelectionRange(next.caret, next.caret);
    });
  }

  return (
    <div className="flex flex-col gap-4">
      {bodyNeedsReentry && (
        <div className="flex items-start gap-2 rounded-field bg-warning/10 px-3 py-2 text-xs text-warning">
          <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" />
          <span>
            The available placeholders changed — re-enter your message below.
          </span>
        </div>
      )}

      <label className="flex flex-col gap-1.5">
        <span className="text-sm font-semibold text-base-content">Message</span>
        <textarea
          ref={textareaRef}
          value={body}
          maxLength={BULK_MESSAGE_TEMPLATE_BODY_MAX_LENGTH}
          rows={6}
          onChange={(event) => onChange(event.target.value)}
          placeholder="Hi {name}, thanks for stopping by our booth!"
          className="w-full rounded-field border border-base-300 bg-base-200 px-3 py-2 text-sm text-base-content focus:border-primary focus:bg-base-100 focus:outline-none"
        />
        <span className="self-end text-xs text-base-content/40">
          {body.length}/{BULK_MESSAGE_TEMPLATE_BODY_MAX_LENGTH}
        </span>
      </label>

      <PlaceholderPalette
        core={core}
        formFields={formFields}
        isLoading={placeholdersLoading}
        onInsert={handleInsert}
      />

      {unknownTokens.length > 0 && (
        <div className="flex items-start gap-2 rounded-field bg-error/10 px-3 py-2 text-xs text-error">
          <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
          <span>
            Unknown placeholder{unknownTokens.length > 1 ? "s" : ""}:{" "}
            {unknownTokens.map((token) => `{${token}}`).join(", ")}
          </span>
        </div>
      )}
    </div>
  );
}
