import { useState } from "react";
import { Check, ChevronDown, Clipboard, Code2, Download } from "lucide-react";
import ClientInstructionsTabs from "@features/email-signatures/components/ClientInstructionsTabs";
import {
  copyEmailSignatureRawHtml,
  copyEmailSignatureRichText,
} from "@features/email-signatures/utils/copyEmailSignatureToClipboard";
import { downloadEmailSignatureHtml } from "@features/email-signatures/utils/downloadEmailSignatureHtml";

interface DeliveryPanelProps {
  html: string;
}

type CopyState = "idle" | "copied-rich" | "copied-raw";

export default function DeliveryPanel({ html }: DeliveryPanelProps) {
  const [copyState, setCopyState] = useState<CopyState>("idle");
  const [showInstructions, setShowInstructions] = useState(false);
  const disabled = !html;

  async function handleCopyRich() {
    await copyEmailSignatureRichText(html);
    setCopyState("copied-rich");
    setTimeout(() => setCopyState("idle"), 2000);
  }

  async function handleCopyRaw() {
    await copyEmailSignatureRawHtml(html);
    setCopyState("copied-raw");
    setTimeout(() => setCopyState("idle"), 2000);
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
        <button
          type="button"
          disabled={disabled}
          onClick={() => void handleCopyRich()}
          className="btn min-h-11 gap-2 rounded-field bg-primary text-primary-content hover:bg-primary/90 disabled:opacity-50"
        >
          {copyState === "copied-rich" ? (
            <Check className="h-4 w-4" />
          ) : (
            <Clipboard className="h-4 w-4" />
          )}
          {copyState === "copied-rich" ? "Copied!" : "Copy signature"}
        </button>
        <button
          type="button"
          disabled={disabled}
          onClick={() => void handleCopyRaw()}
          className="btn min-h-11 gap-2 rounded-field border border-base-300 bg-base-100 text-base-content hover:bg-base-200 disabled:opacity-50"
        >
          {copyState === "copied-raw" ? (
            <Check className="h-4 w-4" />
          ) : (
            <Code2 className="h-4 w-4" />
          )}
          {copyState === "copied-raw" ? "Copied!" : "Copy HTML"}
        </button>
        <button
          type="button"
          disabled={disabled}
          onClick={() => downloadEmailSignatureHtml(html)}
          className="btn min-h-11 gap-2 rounded-field border border-base-300 bg-base-100 text-base-content hover:bg-base-200 disabled:opacity-50"
        >
          <Download className="h-4 w-4" />
          Download
        </button>
      </div>

      <button
        type="button"
        onClick={() => setShowInstructions((value) => !value)}
        className="flex min-h-11 items-center justify-between rounded-field border border-base-300 bg-base-200 px-4 text-sm font-medium text-base-content"
      >
        How do I install this in my email client?
        <ChevronDown
          className={`h-4 w-4 transition-transform ${showInstructions ? "rotate-180" : ""}`}
        />
      </button>
      {showInstructions && <ClientInstructionsTabs />}
    </div>
  );
}
