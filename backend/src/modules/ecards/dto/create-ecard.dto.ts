import { z } from 'zod';
import { createImageSlotSchema } from '../../../common/validators/image-slot.dto';
import { isPairedOrBothAbsent } from '../../../common/validators/paired-fields.validator';
import { ECARD_MAX_COMPONENTS } from '../ecards.constants';
import { ecardAboutComponentSchema } from './components/about.dto';
import { createEcardBrochureComponentSchema } from './components/brochure.dto';
import { createEcardGalleryComponentSchema } from './components/gallery.dto';
import { ecardSocialLinksComponentSchema } from './components/social-links.dto';
import { ecardTeamComponentSchema } from './components/team-member-pick.dto';
import { ecardVideoComponentSchema } from './components/video.dto';
import { ecardVideoGalleryComponentSchema } from './components/video-gallery.dto';
import { ecardWhatsAppComponentSchema } from './components/whatsapp.dto';
import {
  assertHeroLayoutFieldsConsistent,
  assertHeroOrgBadgeRequiresOrganisation,
  ecardCoreFields,
  hasUniqueComponentTypes,
} from './ecard-core.dto';

const createEcardComponentSchema = z.discriminatedUnion('type', [
  ecardAboutComponentSchema,
  ecardSocialLinksComponentSchema,
  createEcardGalleryComponentSchema,
  ecardVideoComponentSchema,
  ecardVideoGalleryComponentSchema,
  ecardTeamComponentSchema,
  ecardWhatsAppComponentSchema,
  createEcardBrochureComponentSchema,
]);

export const createEcardShape = {
  ...ecardCoreFields,
  heroProfilePhoto: createImageSlotSchema.optional(),
  heroBanner: createImageSlotSchema.optional(),
  components: z
    .array(createEcardComponentSchema)
    .max(ECARD_MAX_COMPONENTS)
    .default([]),
};

export const createEcardSchema = z
  .object(createEcardShape)
  .strict()
  .refine((v) => isPairedOrBothAbsent(v.phoneCountryDialCode, v.phoneNumber), {
    message: 'phoneCountryDialCode and phoneNumber must be provided together',
    path: ['phoneNumber'],
  })
  .refine((v) => hasUniqueComponentTypes(v.components), {
    message: 'Each component type may appear at most once',
    path: ['components'],
  })
  .superRefine(assertHeroLayoutFieldsConsistent)
  .superRefine(assertHeroOrgBadgeRequiresOrganisation);

export const createEcardAsEmployeeSchema = z
  .object({ ...createEcardShape, customerId: z.uuid() })
  .strict()
  .refine((v) => isPairedOrBothAbsent(v.phoneCountryDialCode, v.phoneNumber), {
    message: 'phoneCountryDialCode and phoneNumber must be provided together',
    path: ['phoneNumber'],
  })
  .refine((v) => hasUniqueComponentTypes(v.components), {
    message: 'Each component type may appear at most once',
    path: ['components'],
  })
  .superRefine(assertHeroLayoutFieldsConsistent)
  .superRefine(assertHeroOrgBadgeRequiresOrganisation);

export type CreateEcardDto = z.infer<typeof createEcardSchema>;
export type CreateEcardAsEmployeeDto = z.infer<
  typeof createEcardAsEmployeeSchema
>;
export type EcardComponentInputDto = CreateEcardDto['components'][number];
