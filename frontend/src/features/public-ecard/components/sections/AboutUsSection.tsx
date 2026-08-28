import { useState } from "react";
import { ECARD_ABOUT_TRUNCATE_WORD_COUNT } from "@features/public-ecard/config/ecardPreview.config";
import type { EcardAboutUsComponent } from "@app-types/ecard";

interface AboutUsSectionProps {
  component: EcardAboutUsComponent;
}

export function AboutUsSection({ component }: AboutUsSectionProps) {
  const [expanded, setExpanded] = useState(false);

  const bodyText = component.content ?? "";
  const words = bodyText.trim().split(/\s+/).filter(Boolean);
  const isTruncatable = words.length > ECARD_ABOUT_TRUNCATE_WORD_COUNT;
  const displayText =
    isTruncatable && !expanded
      ? `${words.slice(0, ECARD_ABOUT_TRUNCATE_WORD_COUNT).join(" ")}…`
      : bodyText;

  if (!component.tagline && !bodyText) return null;

  return (
    <div className="w-full rounded-2xl border border-base-300 bg-base-100 p-4 shadow-xl">
      <h2 className="text-2xl font-bold">About Us</h2>
      {component.tagline && (
        <p className="mt-2 text-sm italic text-base-content/70 break-words">
          {component.tagline}
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
  );
}
