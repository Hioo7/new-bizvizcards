import { z } from 'zod';
import { ORGANISATION_NAME_MAX_LENGTH } from '../organisations.constants';

export const createOrganisationAsEmployeeSchema = z
  .object({
    // The customer who becomes the founding SPOC — chosen by the employee,
    // there is no customer session here to derive it from.
    customerId: z.uuid(),
    name: z.string().trim().min(1).max(ORGANISATION_NAME_MAX_LENGTH),
  })
  .strict();

export type CreateOrganisationAsEmployeeDto = z.infer<
  typeof createOrganisationAsEmployeeSchema
>;
