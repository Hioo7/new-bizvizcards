import { z } from 'zod';
import { updateImageSlotSchema } from '../../../common/validators/image-slot.dto';
import { isPairedOrBothAbsent } from '../../../common/validators/paired-fields.validator';
import { ECARD_MAX_COMPONENTS } from '../ecards.constants';
import { ecardAboutComponentSchema } from './components/about.dto';
import { updateEcardGalleryComponentSchema } from './components/gallery.dto';
import { ecardSocialLinksComponentSchema } from './components/social-links.dto';
import { ecardTeamComponentSchema } from './components/team-member-pick.dto';
import { ecardVideoComponentSchema } from './components/video.dto';
import { ecardCoreFields, hasUniqueComponentTypes } from './ecard-core.dto';

const updateEcardComponentSchema = z.discriminatedUnion('type', [
  ecardAboutComponentSchema,
  ecardSocialLinksComponentSchema,
  updateEcardGalleryComponentSchema,
  ecardVideoComponentSchema,
  ecardTeamComponentSchema,
]);

// Full-replace PATCH: every save resends the entire desired state (hero
// fields, phone, and the complete ordered components[] array) — the service
// reconciles by diffing against what's currently stored, mirroring
// SmartCardsService.update's handling of its ordered satellite lists.
export const updateEcardSchema = z
  .object({
    ...ecardCoreFields,
    heroProfilePhoto: updateImageSlotSchema.optional(),
    components: z
      .array(updateEcardComponentSchema)
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

export type UpdateEcardDto = z.infer<typeof updateEcardSchema>;
export type UpdateEcardComponentInputDto = UpdateEcardDto['components'][number];
