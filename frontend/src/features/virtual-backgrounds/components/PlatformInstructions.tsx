import { useState } from "react";
import { VIRTUAL_BACKGROUND_PLATFORM_INSTRUCTIONS } from "@features/virtual-backgrounds/config/platformInstructions";

export default function PlatformInstructions() {
  const [activeId, setActiveId] = useState(
    VIRTUAL_BACKGROUND_PLATFORM_INSTRUCTIONS[0].id,
  );
  const active = VIRTUAL_BACKGROUND_PLATFORM_INSTRUCTIONS.find(
    (platform) => platform.id === activeId,
  )!;

  return (
    <div className="flex flex-col gap-3 rounded-box border border-base-300 p-4">
      <p className="text-xs font-semibold uppercase tracking-wide text-base-content/50">
        How to use your virtual background
      </p>
      <div role="tablist" className="tabs tabs-box w-full flex-nowrap overflow-x-auto">
        {VIRTUAL_BACKGROUND_PLATFORM_INSTRUCTIONS.map((platform) => (
          <button
            key={platform.id}
            type="button"
            role="tab"
            aria-selected={platform.id === activeId}
            onClick={() => setActiveId(platform.id)}
            className={`tab min-h-11 shrink-0 ${platform.id === activeId ? "tab-active" : ""}`}
          >
            {platform.name}
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
