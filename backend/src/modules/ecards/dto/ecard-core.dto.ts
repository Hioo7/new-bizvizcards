import { z } from 'zod';
import {
  URL_SLUG_MAX_LENGTH,
  URL_SLUG_MIN_LENGTH,
  URL_SLUG_REGEX,
} from '../../../common/constants/slug.constants';
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
};

/** Enforces ECardComponent.@@unique([ecardId, type]) at the DTO level too — one instance of each component type per card. */
export function hasUniqueComponentTypes(
  components: readonly { type: string }[],
): boolean {
  return new Set(components.map((c) => c.type)).size === components.length;
}
