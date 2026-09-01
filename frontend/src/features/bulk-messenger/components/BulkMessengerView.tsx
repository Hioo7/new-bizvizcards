import { useState } from "react";
import { ArrowLeft } from "lucide-react";
import {
  BULK_MESSENGER_TABS,
  type BulkMessengerTabId,
} from "@features/bulk-messenger/config/bulkMessenger.config";
import TemplatesTab from "@features/bulk-messenger/components/TemplatesTab";
import SendsTab from "@features/bulk-messenger/components/SendsTab";

interface BulkMessengerViewProps {
  onBack?: () => void;
}

export default function BulkMessengerView({ onBack }: BulkMessengerViewProps) {
  const [activeTab, setActiveTab] = useState<BulkMessengerTabId>("templates");

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-6 px-4 py-8 sm:px-6">
      <div className="flex items-center gap-3">
        {onBack && (
          <button
            type="button"
            onClick={onBack}
            aria-label="Back"
            className="flex min-h-11 min-w-11 items-center justify-center rounded-field text-base-content/60 hover:bg-base-200"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
        )}
        <div className="min-w-0 flex-1">
          <h1 className="truncate text-2xl font-extrabold text-base-content">
            Bulk Messenger
          </h1>
          <p className="text-sm text-base-content/60">
            Send templated WhatsApp messages to your leads, one tap each.
          </p>
        </div>
      </div>

      <div role="tablist" className="tabs tabs-box w-full">
        {BULK_MESSENGER_TABS.map((tab) => (
          <button
            key={tab.id}
            type="button"
            role="tab"
            aria-selected={activeTab === tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`tab min-h-11 flex-1 ${
              activeTab === tab.id ? "tab-active" : ""
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === "templates" ? (
        <TemplatesTab />
      ) : (
        <SendsTab onGoToTemplates={() => setActiveTab("templates")} />
      )}
    </div>
  );
}
