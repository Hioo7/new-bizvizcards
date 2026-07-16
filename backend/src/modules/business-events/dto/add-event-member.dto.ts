import { z } from 'zod';
import { EventMemberRole } from '../../../generated/prisma/client';

// HOST is deliberately excluded — it's assigned exactly once, automatically,
// at event creation, and is never assignable through this endpoint.
export const ASSIGNABLE_EVENT_MEMBER_ROLES = [
  EventMemberRole.CO_HOST,
  EventMemberRole.VOLUNTEER,
] as const;

export const addEventMemberSchema = z
  .object({
    customerId: z.uuid(),
    role: z.enum(ASSIGNABLE_EVENT_MEMBER_ROLES),
  })
  .strict();

export type AddEventMemberDto = z.infer<typeof addEventMemberSchema>;
