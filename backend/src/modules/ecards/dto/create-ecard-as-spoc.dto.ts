import { z } from 'zod';
import { isPairedOrBothAbsent } from '../../../common/validators/paired-fields.validator';
import { createEcardShape } from './create-ecard.dto';
import { hasUniqueComponentTypes } from './ecard-core.dto';

// organisationId is intentionally omitted here: for a SPOC-initiated create,
// the organisation is always the :organisationId route param (verified via
// OrganisationsService.assertIsSpoc), never a body-supplied value that could
// target a different org.
const { organisationId, ...createEcardAsSpocCoreShape } = createEcardShape;
void organisationId;

export const createEcardAsSpocSchema = z
  .object({
    ...createEcardAsSpocCoreShape,
    // References OrganisationMember.id — the target member must already
    // belong to the SPOC's organisation (resolved/verified server-side via
    // OrganisationMembersService.getMemberInOrganisationOrThrow).
    memberId: z.uuid(),
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

export type CreateEcardAsSpocDto = z.infer<typeof createEcardAsSpocSchema>;
