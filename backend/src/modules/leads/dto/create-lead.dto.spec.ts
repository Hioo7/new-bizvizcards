import { LeadSourceType } from '../../../generated/prisma/client';
import { createLeadSchema } from './create-lead.dto';

describe('createLeadSchema', () => {
  it('accepts a minimal payload', () => {
    expect(createLeadSchema.safeParse({ name: 'Jane' }).success).toBe(true);
  });

  it('accepts sourcedBy: CARD_SCANNER', () => {
    const result = createLeadSchema.safeParse({
      name: 'Jane',
      sourcedBy: LeadSourceType.CARD_SCANNER,
    });
    expect(result.success).toBe(true);
  });

  it('rejects any other sourcedBy value', () => {
    for (const value of [
      LeadSourceType.SMART_CARD,
      LeadSourceType.E_CARD,
      LeadSourceType.MANUAL_ENTRY,
      'ADMIN',
    ]) {
      expect(
        createLeadSchema.safeParse({ name: 'Jane', sourcedBy: value }).success,
      ).toBe(false);
    }
  });

  it('rejects unknown keys (strict)', () => {
    expect(createLeadSchema.safeParse({ name: 'Jane', bogus: 1 }).success).toBe(
      false,
    );
  });
});
