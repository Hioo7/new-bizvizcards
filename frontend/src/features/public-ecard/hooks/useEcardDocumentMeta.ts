import { useEffect } from "react";
import type { Ecard } from "@app-types/ecard";

const DESCRIPTION_META_SELECTOR = 'meta[name="description"]';
const FALLBACK_DESCRIPTION = "View this digital business card.";

/** Sets the browser tab title/description for a loaded public e-card — a
 * real-user UX touch, independent of any server-rendered Open Graph tags. */
export function useEcardDocumentMeta(card: Ecard | null): void {
  useEffect(() => {
    if (!card) return;

    const title = card.hero.companyName
      ? `${card.hero.name} — ${card.hero.companyName}`
      : card.hero.name;
    const about = card.components.find((component) => component.type === "ABOUT");
    const description =
      (about?.type === "ABOUT" && (about.shortNote || about.description)) ||
      FALLBACK_DESCRIPTION;

    const previousTitle = document.title;
    document.title = title;

    let descriptionTag = document.querySelector(DESCRIPTION_META_SELECTOR);
    const createdDescriptionTag = !descriptionTag;
    if (!descriptionTag) {
      descriptionTag = document.createElement("meta");
      descriptionTag.setAttribute("name", "description");
      document.head.appendChild(descriptionTag);
    }
    const previousDescription = descriptionTag.getAttribute("content");
    descriptionTag.setAttribute("content", description);

    return () => {
      document.title = previousTitle;
      if (createdDescriptionTag) {
        descriptionTag?.remove();
      } else if (previousDescription !== null) {
        descriptionTag?.setAttribute("content", previousDescription);
      }
    };
  }, [card]);
}
