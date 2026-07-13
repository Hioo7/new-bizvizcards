import { z } from 'zod';
import {
  ECARD_MAX_TEAM_MEMBERS,
  ECARD_TEXT_SHORT_MAX_LENGTH,
} from '../../ecards.constants';

const teamMemberPickSchema = z
  .object({ organisationMemberId: z.uuid() })
  .strict();

export const ecardTeamComponentSchema = z
  .object({
    type: z.literal('TEAM'),
    title: z.string().trim().max(ECARD_TEXT_SHORT_MAX_LENGTH).optional(),
    members: z
      .array(teamMemberPickSchema)
      .max(ECARD_MAX_TEAM_MEMBERS)
      .default([]),
  })
  .strict();

export type EcardTeamComponentDto = z.infer<typeof ecardTeamComponentSchema>;
