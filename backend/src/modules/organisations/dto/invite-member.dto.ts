import { z } from 'zod';
import { OrganisationMemberRole } from '../../../generated/prisma/client';
import {
  ORGANISATION_EMAIL_MAX_LENGTH,
  ORGANISATION_EMAIL_REGEX,
} from '../organisations.constants';

export const inviteMemberSchema = z
  .object({
    email: z
      .string()
      .trim()
      .max(ORGANISATION_EMAIL_MAX_LENGTH)
      .regex(ORGANISATION_EMAIL_REGEX),
    role: z.enum(OrganisationMemberRole).default('MEMBER'),
  })
  .strict();

export type InviteMemberDto = z.infer<typeof inviteMemberSchema>;
