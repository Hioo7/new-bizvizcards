import { z } from 'zod';
import { HEX_COLOR_REGEX } from '../../../common/constants/color.constants';
import {
  URL_SLUG_MAX_LENGTH,
  URL_SLUG_MIN_LENGTH,
  URL_SLUG_REGEX,
} from '../../../common/constants/slug.constants';
import { ECardHeroLayout } from '../../../generated/prisma/client';
import {
  ECARD_PHONE_DIAL_CODE_MAX_LENGTH,
  ECARD_PHONE_NUMBER_DIGITS_REGEX,
  ECARD_PHONE_NUMBER_MAX_DIGITS,
  ECARD_PHONE_NUMBER_MIN_DIGITS,
  ECARD_TEXT_SHORT_MAX_LENGTH,
} from '../ecards.constants';

export const ecardCoreFields = {
  endpoint: z
    .string()
    .trim()
    .min(URL_SLUG_MIN_LENGTH)
    .max(URL_SLUG_MAX_LENGTH)
    .regex(URL_SLUG_REGEX),
  // Independent per-card identity — no longer derived from the customer's
  // account, since one customer can now own multiple cards.
  heroName: z.string().trim().min(1).max(ECARD_TEXT_SHORT_MAX_LENGTH),
  heroEmail: z.string().trim().email(),
  heroCompanyName: z
    .string()
    .trim()
    .max(ECARD_TEXT_SHORT_MAX_LENGTH)
    .optional(),
  // Which organisation this specific card belongs to (as opposed to the
  // customer's own org membership) — optional; unset means a
  // personal/unaffiliated card. No admin UI sets this yet (org-template
  // feature is future work) but the API is ready for it.
  organisationId: z.uuid().optional(),
  phoneCountryDialCode: z
    .string()
    .trim()
    .min(1)
    .max(ECARD_PHONE_DIAL_CODE_MAX_LENGTH)
    .optional(),
  phoneNumber: z
    .string()
    .trim()
    .regex(ECARD_PHONE_NUMBER_DIGITS_REGEX)
    .min(ECARD_PHONE_NUMBER_MIN_DIGITS)
    .max(ECARD_PHONE_NUMBER_MAX_DIGITS)
    .optional(),
  isExchangeContactEnabled: z.boolean().default(true),
  // Per-card setting — when true, the public page auto-triggers a vCard
  // download for the visitor instead of requiring a manual "Save Contact".
  autoDownloadContact: z.boolean().default(false),
  heroLayout: z.enum(ECardHeroLayout).default('DEFAULT'),
  heroBannerFallbackColor: z.string().trim().regex(HEX_COLOR_REGEX).optional(),
  heroBadgeFallbackColor: z.string().trim().regex(HEX_COLOR_REGEX).optional(),
};

/** Enforces ECardComponent.@@unique([ecardId, type]) at the DTO level too — one instance of each component type per card. */
export function hasUniqueComponentTypes(
  components: readonly { type: string }[],
): boolean {
  return new Set(components.map((c) => c.type)).size === components.length;
}

/** Cross-field requirements for whichever Hero layout is chosen — a banner
 * image/color for BANNER*, a badge color for ORG_BADGE. Shared by every
 * schema that carries ecardCoreFields, including create-ecard-as-spoc.dto.ts
 * (which omits organisationId from its body — see
 * assertHeroOrgBadgeRequiresOrganisation below for that check instead). */
export function assertHeroLayoutFieldsConsistent(
  value: {
    heroLayout: ECardHeroLayout;
    heroBanner?: unknown;
    heroBannerFallbackColor?: string;
    heroBadgeFallbackColor?: string;
  },
  ctx: z.RefinementCtx,
): void {
  const needsBanner =
    value.heroLayout === ECardHeroLayout.BANNER ||
    value.heroLayout === ECardHeroLayout.BANNER_PROFILE;
  if (needsBanner && !value.heroBanner) {
    ctx.addIssue({
      code: 'custom',
      path: ['heroBanner'],
      message: 'A banner image is required for this layout',
    });
  }
  if (needsBanner && !value.heroBannerFallbackColor) {
    ctx.addIssue({
      code: 'custom',
      path: ['heroBannerFallbackColor'],
      message: 'A fallback color is required for this layout',
    });
  }
  if (
    value.heroLayout === ECardHeroLayout.ORG_BADGE &&
    !value.heroBadgeFallbackColor
  ) {
    ctx.addIssue({
      code: 'custom',
      path: ['heroBadgeFallbackColor'],
      message: 'A fallback color is required for this layout',
    });
  }
}

/** ORG_BADGE requires an organisation link — only checked where
 * organisationId is a real body field (create/update). The SPOC-create flow
 * omits organisationId entirely since it's always the route param there, so
 * it doesn't apply this check — the organisation link is already guaranteed
 * by that endpoint's own routing. */
export function assertHeroOrgBadgeRequiresOrganisation(
  value: { heroLayout: ECardHeroLayout; organisationId?: string },
  ctx: z.RefinementCtx,
): void {
  if (value.heroLayout === ECardHeroLayout.ORG_BADGE && !value.organisationId) {
    ctx.addIssue({
      code: 'custom',
      path: ['organisationId'],
      message: 'Link an organisation to use this layout',
    });
  }
}
