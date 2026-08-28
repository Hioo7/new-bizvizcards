import { useState, useRef, useEffect } from "react";
import {
  ECARD_ABOUT_TRUNCATE_WORD_COUNT,
  ECARD_TICKER_PX_PER_SECOND,
} from "@features/public-ecard/config/ecardPreview.config";
import type { EcardAboutComponent } from "@app-types/ecard";

interface AboutSectionProps {
  component: EcardAboutComponent;
}

const TICKER_REPEAT_COUNT = 6;

export function AboutSection({ component }: AboutSectionProps) {
  const [expanded, setExpanded] = useState(false);
  const groupRef = useRef<HTMLSpanElement>(null);
  const [tickerDuration, setTickerDuration] = useState<number | null>(null);

  useEffect(() => {
    if (!groupRef.current) return;
    const groupWidth = groupRef.current.getBoundingClientRect().width;
    if (groupWidth > 0) {
      setTickerDuration(groupWidth / ECARD_TICKER_PX_PER_SECOND);
    }
  }, [component.description, component.shortNote]);

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
          <p className="mt-2 text-sm font-medium text-primary break-words">
            {component.profession}
          </p>
        )}
        {component.shortNote && (
          <p className="mt-1 text-sm italic text-base-content/70 break-words">
            {component.shortNote}
          </p>
        )}
        {bodyText && (
          <div className="mt-3 text-sm break-words">
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
          <div
            className="flex w-max animate-ticker"
            style={tickerDuration !== null ? { animationDuration: `${tickerDuration}s` } : undefined}
          >
            {[0, 1].map((groupIdx) => (
              <span
                key={groupIdx}
                ref={groupIdx === 0 ? groupRef : undefined}
                aria-hidden={groupIdx === 1}
                className="whitespace-nowrap pr-12 text-sm opacity-70"
              >
                {Array.from({ length: TICKER_REPEAT_COUNT })
                  .map(() => tickerText)
                  .join(" \u2022 ")}
                {" \u2022"}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
