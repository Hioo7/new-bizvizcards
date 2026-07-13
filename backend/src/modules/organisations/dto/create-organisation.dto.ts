import { z } from 'zod';
import { ORGANISATION_NAME_MAX_LENGTH } from '../organisations.constants';

export const createOrganisationSchema = z
  .object({
    name: z.string().trim().min(1).max(ORGANISATION_NAME_MAX_LENGTH),
  })
  .strict();

export type CreateOrganisationDto = z.infer<typeof createOrganisationSchema>;
