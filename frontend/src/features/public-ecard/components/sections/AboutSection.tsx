import { useState } from "react";
import { ECARD_ABOUT_TRUNCATE_WORD_COUNT } from "@features/public-ecard/config/ecardPreview.config";
import type { EcardAboutComponent } from "@app-types/ecard";

interface AboutSectionProps {
  component: EcardAboutComponent;
}

const TICKER_REPEAT_COUNT = 6;

export function AboutSection({ component }: AboutSectionProps) {
  const [expanded, setExpanded] = useState(false);

  const bodyText = component.aboutMe || component.description || "";
  const words = bodyText.trim().split(/\s+/).filter(Boolean);
  const isTruncatable = words.length > ECARD_ABOUT_TRUNCATE_WORD_COUNT;
  const displayText =
    isTruncatable && !expanded
      ? `${words.slice(0, ECARD_ABOUT_TRUNCATE_WORD_COUNT).join(" ")}…`
      : bodyText;

  // Matches legacy's ticker source: the header "description" field, falling
  // back to "shortNote" (see eCardBusinessCardTemplateMapper.ts's `intro`).
  const tickerText = component.description || component.shortNote || "";

  if (!component.profession && !component.shortNote && !bodyText) return null;

  return (
    <div>
      <div className="w-full rounded-2xl border border-base-300 bg-base-100 p-4 shadow-xl">
        <h2 className="text-2xl font-bold">About Me</h2>
        {component.profession && (
          <p className="mt-2 text-sm font-medium text-primary">{component.profession}</p>
        )}
        {component.shortNote && (
          <p className="mt-1 text-sm italic text-base-content/70">{component.shortNote}</p>
        )}
        {bodyText && (
          <div className="mt-3 text-sm">
            {displayText}
            {isTruncatable && (
              <button
                type="button"
                onClick={() => setExpanded((prev) => !prev)}
                className="ml-2 cursor-pointer text-xs underline"
              >
                {expanded ? "See less" : "See more..."}
              </button>
            )}
          </div>
        )}
      </div>

      {tickerText && (
        <div className="mt-2 w-full overflow-hidden rounded-2xl border border-base-300 bg-secondary p-2 shadow-xl">
          <div className="flex animate-ticker whitespace-nowrap">
            {Array.from({ length: TICKER_REPEAT_COUNT }).map((_, idx) => (
              <span key={idx} className="px-1 text-sm opacity-70">
                {tickerText}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
