import { ChevronRight, Send, Trash2 } from "lucide-react";
import type { BulkMessageSendSummary } from "@app-types/bulkMessenger";

interface SendRowProps {
  send: BulkMessageSendSummary;
  onOpen: () => void;
  onDelete: () => void;
}

export default function SendRow({ send, onOpen, onDelete }: SendRowProps) {
  return (
    <div className="flex items-center gap-3 border-b border-base-300 px-4 py-3 last:border-b-0">
      <button
        type="button"
        onClick={onOpen}
        className="flex min-w-0 flex-1 items-center gap-3 text-left"
      >
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-secondary/15 text-secondary">
          <Send className="h-4 w-4" />
        </span>
        <span className="min-w-0">
          <span className="block truncate text-sm font-medium text-base-content">
            {send.templateNameSnapshot}
          </span>
          <span className="block truncate text-xs text-base-content/50">
            {send.messagedCount}/{send.totalRecipients} messaged •{" "}
            {new Date(send.createdAt).toLocaleDateString()}
          </span>
        </span>
        <ChevronRight className="h-4 w-4 shrink-0 text-base-content/30" />
      </button>
      <button
        type="button"
        onClick={onDelete}
        aria-label="Delete send"
        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-error hover:bg-error/10"
      >
        <Trash2 className="h-4 w-4" />
      </button>
    </div>
  );
}
