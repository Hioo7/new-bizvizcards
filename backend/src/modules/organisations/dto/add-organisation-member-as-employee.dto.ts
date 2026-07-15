import { z } from 'zod';
import { OrganisationMemberRole } from '../../../generated/prisma/client';
import { ORGANISATION_BULK_ADD_MEMBERS_MAX_PER_REQUEST } from '../organisations.constants';

export const addOrganisationMemberAsEmployeeSchema = z
  .object({
    customerIds: z
      .array(z.uuid())
      .min(1)
      .max(ORGANISATION_BULK_ADD_MEMBERS_MAX_PER_REQUEST),
    role: z.enum(OrganisationMemberRole).default(OrganisationMemberRole.MEMBER),
  })
  .strict();

export type AddOrganisationMemberAsEmployeeDto = z.infer<
  typeof addOrganisationMemberAsEmployeeSchema
>;
