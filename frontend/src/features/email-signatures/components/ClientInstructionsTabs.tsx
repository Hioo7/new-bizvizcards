import { useState } from "react";
import { EMAIL_SIGNATURE_CLIENT_INSTRUCTIONS } from "@features/email-signatures/config/emailSignatureBuilder.config";

export default function ClientInstructionsTabs() {
  const [activeId, setActiveId] = useState(
    EMAIL_SIGNATURE_CLIENT_INSTRUCTIONS[0].id,
  );
  const active = EMAIL_SIGNATURE_CLIENT_INSTRUCTIONS.find(
    (client) => client.id === activeId,
  )!;

  return (
    <div className="flex flex-col gap-3">
      <div
        role="tablist"
        className="tabs tabs-box w-full flex-nowrap overflow-x-auto"
      >
        {EMAIL_SIGNATURE_CLIENT_INSTRUCTIONS.map((client) => (
          <button
            key={client.id}
            type="button"
            role="tab"
            aria-selected={client.id === activeId}
            onClick={() => setActiveId(client.id)}
            className={`tab min-h-11 shrink-0 ${client.id === activeId ? "tab-active" : ""}`}
          >
            {client.label}
          </button>
        ))}
      </div>
      <ol className="flex list-decimal flex-col gap-1.5 pl-5 text-sm text-base-content/70">
        {active.steps.map((step, index) => (
          <li key={index}>{step}</li>
        ))}
      </ol>
    </div>
  );
}
