import { ArrowLeft, CircleCheck } from "lucide-react";
import FormErrorRibbon from "@components/forms/FormErrorRibbon";
import { useBulkMessageSend } from "@features/bulk-messenger/hooks/useBulkMessageSend";
import RecipientRow from "@features/bulk-messenger/components/RecipientRow";

interface SendDetailViewProps {
  sendId: string | undefined;
  onBack: () => void;
}

export default function SendDetailView({ sendId, onBack }: SendDetailViewProps) {
  const { send, isLoading, error, refetch } = useBulkMessageSend(sendId);

  const progressPercent =
    send && send.totalRecipients > 0
      ? (send.messagedCount / send.totalRecipients) * 100
      : 0;

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-1 flex-col">
      <div className="sticky top-0 z-10 flex flex-col gap-2 border-b border-base-300 bg-base-100 px-4 py-3 sm:px-6">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onBack}
            aria-label="Back"
            className="flex min-h-11 min-w-11 items-center justify-center rounded-field text-base-content/60 hover:bg-base-200"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div className="min-w-0 flex-1">
            <h1 className="truncate text-lg font-extrabold text-base-content">
              {send?.templateNameSnapshot ?? "Send"}
            </h1>
            {send && (
              <p className="text-sm text-base-content/60">
                {send.messagedCount} of {send.totalRecipients} messaged •{" "}
                {send.pendingCount} pending
              </p>
            )}
          </div>
        </div>
        {send && (
          <div className="h-1.5 w-full rounded-full bg-base-300">
            <div
              className="h-1.5 rounded-full bg-primary transition-all"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        )}
      </div>

      <div className="flex flex-1 flex-col gap-4 px-4 py-6 sm:px-6">
        {isLoading && (
          <div className="flex justify-center py-10">
            <span className="loading loading-spinner text-primary" />
          </div>
        )}

        {!isLoading && error && (
          <div className="flex flex-col gap-4">
            <FormErrorRibbon message={error} />
            <button
              type="button"
              onClick={onBack}
              className="btn min-h-11 self-start rounded-field border border-base-300 bg-base-100 hover:bg-base-200"
            >
              Back to Bulk Messenger
            </button>
          </div>
        )}

        {send && !isLoading && !error && (
          <>
            {send.pendingCount === 0 && (
              <div className="flex items-center gap-2 rounded-field bg-success/10 px-3 py-2 text-sm text-success">
                <CircleCheck className="h-4 w-4" />
                All recipients messaged.
              </div>
            )}
            <div className="overflow-hidden rounded-box border border-base-300 bg-base-100">
              {send.recipients.map((recipient) => (
                <RecipientRow
                  key={recipient.id}
                  sendId={send.id}
                  recipient={recipient}
                  onMarked={refetch}
                />
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
