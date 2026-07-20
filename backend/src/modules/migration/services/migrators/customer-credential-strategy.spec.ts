import { applyCustomerCredentialStrategy } from './customer-credential-strategy';
import type { PrismaService } from '../../../../common/prisma/prisma.service';

describe('applyCustomerCredentialStrategy', () => {
  it('does nothing when the legacy CardUser has no password', async () => {
    const create = jest.fn();
    const prisma = {
      customerCredential: { create },
    } as unknown as PrismaService;

    await applyCustomerCredentialStrategy(prisma, {
      legacyPasswordHash: null,
      customerAccountId: 'account-1',
    });

    expect(create).not.toHaveBeenCalled();
  });

  it('inserts a credential row with the legacy bcrypt hash copied verbatim, no rehashing', async () => {
    const create = jest.fn().mockResolvedValue({});
    const prisma = {
      customerCredential: { create },
    } as unknown as PrismaService;
    const legacyHash = '$2a$10$abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQ';

    await applyCustomerCredentialStrategy(prisma, {
      legacyPasswordHash: legacyHash,
      customerAccountId: 'account-1',
    });

    expect(create).toHaveBeenCalledWith({
      data: {
        accountId: 'account-1',
        userId: 'account-1',
        providerId: 'credential',
        password: legacyHash,
      },
    });
  });

  it('never produces colliding rows across two calls for different accounts', async () => {
    const create = jest.fn().mockResolvedValue({});
    const prisma = {
      customerCredential: { create },
    } as unknown as PrismaService;

    await applyCustomerCredentialStrategy(prisma, {
      legacyPasswordHash: '$2a$10$hash-one',
      customerAccountId: 'account-1',
    });
    await applyCustomerCredentialStrategy(prisma, {
      legacyPasswordHash: '$2a$10$hash-two',
      customerAccountId: 'account-2',
    });

    expect(create).toHaveBeenNthCalledWith(1, {
      data: {
        accountId: 'account-1',
        userId: 'account-1',
        providerId: 'credential',
        password: '$2a$10$hash-one',
      },
    });
    expect(create).toHaveBeenNthCalledWith(2, {
      data: {
        accountId: 'account-2',
        userId: 'account-2',
        providerId: 'credential',
        password: '$2a$10$hash-two',
      },
    });
  });
});
