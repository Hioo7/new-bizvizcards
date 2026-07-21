import { z } from 'zod';
import { updateImageSlotSchema } from '../../../common/validators/image-slot.dto';
import { isPairedOrBothAbsent } from '../../../common/validators/paired-fields.validator';
import { ecardAboutComponentSchema } from '../../ecards/dto/components/about.dto';
import { updateEcardGalleryComponentSchema } from '../../ecards/dto/components/gallery.dto';
import { ecardSocialLinksComponentSchema } from '../../ecards/dto/components/social-links.dto';
import { ecardTeamComponentSchema } from '../../ecards/dto/components/team-member-pick.dto';
import { hasUniqueComponentTypes } from '../../ecards/dto/ecard-core.dto';
import {
  ECARD_MAX_COMPONENTS,
  ECARD_PHONE_DIAL_CODE_MAX_LENGTH,
  ECARD_PHONE_NUMBER_DIGITS_REGEX,
  ECARD_PHONE_NUMBER_MAX_DIGITS,
  ECARD_PHONE_NUMBER_MIN_DIGITS,
  ECARD_TEXT_SHORT_MAX_LENGTH,
  ECARD_VIDEO_URL_ALLOWED_HOST_PATTERN,
  ECARD_VIDEO_URL_MAX_LENGTH,
} from '../../ecards/ecards.constants';

// ABOUT, SOCIAL_LINKS, GALLERY (update variant), and TEAM are already fully
// optional/defaulted on the customer's own e-card — reused verbatim here.
// Only WHATSAPP (normally a required phone pair), VIDEO (normally a required
// url), and BROCHURE (normally a required pdf) need org-template-specific
// variants with those fields relaxed to optional — a field left unset here
// means "defer to the customer's own e-card", not "invalid".
const organisationEcardTemplateWhatsAppComponentSchema = z
  .object({
    type: z.literal('WHATSAPP'),
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
  })
  .strict();

const organisationEcardTemplateVideoComponentSchema = z
  .object({
    type: z.literal('VIDEO'),
    title: z.string().trim().max(ECARD_TEXT_SHORT_MAX_LENGTH).optional(),
    videoUrl: z
      .string()
      .trim()
      .max(ECARD_VIDEO_URL_MAX_LENGTH)
      .regex(ECARD_VIDEO_URL_ALLOWED_HOST_PATTERN)
      .optional(),
  })
  .strict();

const organisationEcardTemplateBrochureComponentSchema = z
  .object({
    type: z.literal('BROCHURE'),
    pdf: updateImageSlotSchema.optional(),
  })
  .strict();

const organisationEcardTemplateComponentSchema = z.discriminatedUnion('type', [
  ecardAboutComponentSchema,
  ecardSocialLinksComponentSchema,
  updateEcardGalleryComponentSchema,
  organisationEcardTemplateVideoComponentSchema,
  ecardTeamComponentSchema,
  organisationEcardTemplateWhatsAppComponentSchema,
  organisationEcardTemplateBrochureComponentSchema,
]);

// Single schema for both the first-ever save and every subsequent one — an
// organisation has at most one template, always written as a full replace
// (see OrganisationEcardTemplateService), so there's no separate
// create/update split the way individual e-cards have.
export const organisationEcardTemplateSchema = z
  .object({
    heroName: z.string().trim().max(ECARD_TEXT_SHORT_MAX_LENGTH).optional(),
    heroEmail: z.string().trim().email().optional(),
    heroCompanyName: z
      .string()
      .trim()
      .max(ECARD_TEXT_SHORT_MAX_LENGTH)
      .optional(),
    heroProfilePhoto: updateImageSlotSchema.optional(),
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
    components: z
      .array(organisationEcardTemplateComponentSchema)
      .max(ECARD_MAX_COMPONENTS)
      .default([]),
  })
  .strict()
  .refine((v) => isPairedOrBothAbsent(v.phoneCountryDialCode, v.phoneNumber), {
    message: 'phoneCountryDialCode and phoneNumber must be provided together',
    path: ['phoneNumber'],
  })
  .refine((v) => hasUniqueComponentTypes(v.components), {
    message: 'Each component type may appear at most once',
    path: ['components'],
  });

export type OrganisationEcardTemplateDto = z.infer<
  typeof organisationEcardTemplateSchema
>;
export type OrganisationEcardTemplateComponentInputDto =
  OrganisationEcardTemplateDto['components'][number];
