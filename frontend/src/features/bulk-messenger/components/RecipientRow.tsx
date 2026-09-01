import { useState } from "react";
import { Check, MessageCircle } from "lucide-react";
import type { BulkMessageRecipient } from "@app-types/bulkMessenger";
import {
  buildWaMeUrl,
  extractPhoneDigits,
} from "@features/bulk-messenger/utils/waMe";
import { markBulkMessageRecipientMessaged } from "@services/bulkMessengerService";

interface RecipientRowProps {
  sendId: string;
  recipient: BulkMessageRecipient;
  onMarked: () => void;
}

export default function RecipientRow({
  sendId,
  recipient,
  onMarked,
}: RecipientRowProps) {
  const [optimisticMessaged, setOptimisticMessaged] = useState(false);
  const messaged = optimisticMessaged || recipient.status === "MESSAGED";

  function handleMessage() {
    const digits = extractPhoneDigits(
      recipient.countryDialCodeSnapshot,
      recipient.phoneNumberSnapshot,
    );
    window.open(
      buildWaMeUrl(digits, recipient.resolvedMessage),
      "_blank",
      "noopener,noreferrer",
    );
    setOptimisticMessaged(true);
    void markBulkMessageRecipientMessaged(sendId, recipient.id)
      .then(onMarked)
      .catch(() => setOptimisticMessaged(false));
  }

  const subtitle =
    recipient.recipientEmailSnapshot ??
    `${recipient.countryDialCodeSnapshot} ${recipient.phoneNumberSnapshot}`;

  return (
    <div
      className={`flex items-center gap-3 border-b border-base-300 px-4 py-3 last:border-b-0 ${
        messaged ? "opacity-60" : ""
      }`}
    >
      <span className="min-w-0 flex-1">
        <span className="block truncate text-sm font-medium text-base-content">
          {recipient.recipientNameSnapshot}
        </span>
        <span className="block truncate text-xs text-base-content/50">
          {subtitle}
        </span>
      </span>
      {messaged ? (
        <span className="flex shrink-0 items-center gap-1 rounded-full bg-success/10 px-2.5 py-1 text-xs font-medium text-success">
          <Check className="h-3.5 w-3.5" />
          Messaged
        </span>
      ) : (
        <button
          type="button"
          onClick={handleMessage}
          aria-label={`Message ${recipient.recipientNameSnapshot} on WhatsApp`}
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-success text-success-content hover:bg-success/90"
        >
          <MessageCircle className="h-5 w-5" />
        </button>
      )}
    </div>
  );
}
