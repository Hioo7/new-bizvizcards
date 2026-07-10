import { SmartCardTemplateKey } from '../../../generated/prisma/client';
import type { PublicSmartCard } from '../services/smart-cards.service';
import {
  OG_PREVIEW_FALLBACK_TITLE,
  ogPreviewFallbackDescription,
} from '../smart-card-og-preview.constants';

export interface OgPreviewFields {
  title: string;
  description: string;
  imageUrl: string | null;
}

// Shared by every template today because they all share the same
// SmartCardProfile-backed shape (see smart-card.prisma) — but each template
// key still gets its own explicit entry below. A future template with a
// genuinely different data shape (or field names) must add its own
// extractor here; the Record<SmartCardTemplateKey, ...> type makes that
// mandatory — omitting an entry fails to compile rather than silently
// falling back to generic/wrong preview data (the bug this registry exists
// to prevent).
function extractInteriorDesignOgFields(card: PublicSmartCard): OgPreviewFields {
  const title = card.profile?.companyName?.trim() || OG_PREVIEW_FALLBACK_TITLE;
  const description =
    card.profile?.tagline?.trim() ||
    card.profile?.subTagline?.trim() ||
    ogPreviewFallbackDescription(title);
  const imageUrl = card.profile?.logoUrl ?? null;

  return { title, description, imageUrl };
}

export const ogPreviewFieldsRegistry: Record<
  SmartCardTemplateKey,
  (card: PublicSmartCard) => OgPreviewFields
> = {
  [SmartCardTemplateKey.INTERIOR_DESIGN_TEMPLATE]:
    extractInteriorDesignOgFields,
  [SmartCardTemplateKey.INTERIOR_DESIGN_TEMPLATE_2]:
    extractInteriorDesignOgFields,
  [SmartCardTemplateKey.INTERIOR_DESIGN_TEMPLATE_3]:
    extractInteriorDesignOgFields,
};
