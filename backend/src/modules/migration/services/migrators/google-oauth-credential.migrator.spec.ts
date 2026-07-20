import { applyGoogleOAuthCredential } from './google-oauth-credential.migrator';
import type { PrismaService } from '../../../../common/prisma/prisma.service';

describe('applyGoogleOAuthCredential', () => {
  it('does nothing when the legacy CardUser has no googleId', async () => {
    const create = jest.fn();
    const prisma = {
      customerCredential: { create },
    } as unknown as PrismaService;

    await applyGoogleOAuthCredential(prisma, {
      legacyGoogleId: null,
      customerAccountId: 'account-1',
    });

    expect(create).not.toHaveBeenCalled();
  });

  it('inserts a google-provider credential row keyed by the legacy sub, linked to the migrated account', async () => {
    const create = jest.fn().mockResolvedValue({});
    const prisma = {
      customerCredential: { create },
    } as unknown as PrismaService;

    await applyGoogleOAuthCredential(prisma, {
      legacyGoogleId: 'google-sub-12345',
      customerAccountId: 'account-1',
    });

    expect(create).toHaveBeenCalledWith({
      data: {
        accountId: 'google-sub-12345',
        userId: 'account-1',
        providerId: 'google',
      },
    });
  });
});
