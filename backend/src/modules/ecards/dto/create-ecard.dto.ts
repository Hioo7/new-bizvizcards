import { z } from 'zod';
import { createImageSlotSchema } from '../../../common/validators/image-slot.dto';
import { isPairedOrBothAbsent } from '../../../common/validators/paired-fields.validator';
import { ECARD_MAX_COMPONENTS } from '../ecards.constants';
import { ecardAboutComponentSchema } from './components/about.dto';
import { createEcardGalleryComponentSchema } from './components/gallery.dto';
import { ecardSocialLinksComponentSchema } from './components/social-links.dto';
import { ecardTeamComponentSchema } from './components/team-member-pick.dto';
import { ecardVideoComponentSchema } from './components/video.dto';
import { ecardCoreFields, hasUniqueComponentTypes } from './ecard-core.dto';

const createEcardComponentSchema = z.discriminatedUnion('type', [
  ecardAboutComponentSchema,
  ecardSocialLinksComponentSchema,
  createEcardGalleryComponentSchema,
  ecardVideoComponentSchema,
  ecardTeamComponentSchema,
]);

const createEcardShape = {
  ...ecardCoreFields,
  heroProfilePhoto: createImageSlotSchema.optional(),
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
  });

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
  });

export type CreateEcardDto = z.infer<typeof createEcardSchema>;
export type CreateEcardAsEmployeeDto = z.infer<
  typeof createEcardAsEmployeeSchema
>;
export type EcardComponentInputDto = CreateEcardDto['components'][number];
