import { z } from 'zod';
import {
  OrganisationMemberRole,
  OrganisationMemberStatus,
} from '../../../generated/prisma/client';

export const updateMemberSchema = z
  .object({
    role: z.enum(OrganisationMemberRole).optional(),
    status: z.enum(OrganisationMemberStatus).optional(),
  })
  .strict();

export type UpdateMemberDto = z.infer<typeof updateMemberSchema>;
