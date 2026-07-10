import type { PublicSmartCard, SmartCardTemplateKey } from "@app-types/smartCard";
import {
  SMART_CARD_PREVIEW_FALLBACK_TITLE,
  smartCardPreviewFallbackDescription,
} from "@features/public-smart-card/config/previewMeta.config";

export interface SmartCardPreviewMeta {
  title: string;
  description: string;
}

// Mirrors the backend's per-template Open Graph registry
// (backend/src/modules/smart-cards/templates/og-preview-registry.ts): every
// template gets its own explicit extractor, even if several currently share
// one, so a future template with a genuinely different data shape can't
// silently fall through to generic/wrong text.
function extractInteriorDesignPreviewMeta(
  card: PublicSmartCard,
): SmartCardPreviewMeta {
  const title = card.profile?.companyName?.trim() || SMART_CARD_PREVIEW_FALLBACK_TITLE;
  const description =
    card.profile?.tagline?.trim() ||
    card.profile?.subTagline?.trim() ||
    smartCardPreviewFallbackDescription(title);

  return { title, description };
}

const previewMetaRegistry: Record<
  SmartCardTemplateKey,
  (card: PublicSmartCard) => SmartCardPreviewMeta
> = {
  INTERIOR_DESIGN_TEMPLATE: extractInteriorDesignPreviewMeta,
  INTERIOR_DESIGN_TEMPLATE_2: extractInteriorDesignPreviewMeta,
};

export function getSmartCardPreviewMeta(
  card: PublicSmartCard,
): SmartCardPreviewMeta {
  return previewMetaRegistry[card.templateKey](card);
}
