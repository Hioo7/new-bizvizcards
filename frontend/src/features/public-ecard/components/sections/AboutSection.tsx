import { useState } from "react";
import { ECARD_ABOUT_TRUNCATE_WORD_COUNT } from "@features/public-ecard/config/ecardPreview.config";
import type { EcardAboutComponent } from "@app-types/ecard";

interface AboutSectionProps {
  component: EcardAboutComponent;
}

export function AboutSection({ component }: AboutSectionProps) {
  const [expanded, setExpanded] = useState(false);

  const bodyText = component.aboutMe || component.description || "";
  const words = bodyText.trim().split(/\s+/).filter(Boolean);
  const isTruncatable = words.length > ECARD_ABOUT_TRUNCATE_WORD_COUNT;
  const displayText =
    isTruncatable && !expanded
      ? `${words.slice(0, ECARD_ABOUT_TRUNCATE_WORD_COUNT).join(" ")}…`
      : bodyText;

  if (!component.profession && !component.shortNote && !bodyText) return null;

  return (
    <div className="px-6 py-6 bg-white border-b">
      <h3 className="font-semibold text-gray-800 mb-3 text-xl">About</h3>
      {component.profession && (
        <p className="text-sm font-medium text-indigo-600 mb-1">
          {component.profession}
        </p>
      )}
      {component.shortNote && (
        <p className="text-sm text-gray-500 italic mb-3">{component.shortNote}</p>
      )}
      {bodyText && (
        <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-wrap break-words">
          {displayText}
          {isTruncatable && (
            <button
              type="button"
              onClick={() => setExpanded((prev) => !prev)}
              className="ml-1 font-semibold text-indigo-600 hover:text-indigo-800"
            >
              {expanded ? "See less" : "See more"}
            </button>
          )}
        </p>
      )}
    </div>
  );
}
