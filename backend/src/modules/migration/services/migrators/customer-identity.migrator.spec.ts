import { CustomerIdentityMigrator } from './customer-identity.migrator';
import type { PrismaService } from '../../../../common/prisma/prisma.service';
import type { LegacyPrismaService } from '../../../../common/legacy-db/legacy-prisma.service';
import type { LegacyIdMapperService } from '../legacy-id-mapper.service';

function legacyCardUser(
  overrides?: Partial<{
    id: string;
    name: string;
    email: string;
    password: string | null;
    googleId: string | null;
  }>,
) {
  return {
    id: 'legacy-card-user-1',
    name: 'Jane Customer',
    email: 'jane@example.com',
    password: '$2a$10$legacybcrypthash',
    googleId: null,
    defaultLeadFolderId: null,
    ...overrides,
  };
}

function createMigrator(overrides: {
  findMany?: () => Promise<unknown[]>;
  findExisting?: () => Promise<unknown>;
  fallbackPlan?: { id: string } | null;
  customerAccountFindUnique?: () => Promise<unknown>;
  transaction?: () => Promise<unknown>;
}) {
  const recordSuccess = jest.fn().mockResolvedValue(undefined);
  const recordRejected = jest.fn().mockResolvedValue(undefined);
  const touchExistingSuccess = jest.fn().mockResolvedValue(undefined);
  const idMapper = {
    findExisting: overrides.findExisting ?? jest.fn().mockResolvedValue(null),
    recordSuccess,
    recordRejected,
    touchExistingSuccess,
  } as unknown as LegacyIdMapperService;

  let callCount = 0;
  const legacyPrisma = {
    legacyCardUser: {
      count: jest.fn().mockResolvedValue(1),
      findMany: jest.fn().mockImplementation(async () => {
        callCount += 1;
        if (callCount === 1) {
          return (
            overrides.findMany ?? (() => Promise.resolve([legacyCardUser()]))
          )();
        }
        return [];
      }),
    },
  } as unknown as LegacyPrismaService;

  const defaultTransaction = jest
    .fn()
    .mockImplementation((fn: (tx: unknown) => Promise<unknown>) => {
      const tx = {
        customerAccount: {
          create: jest.fn().mockResolvedValue({ id: 'account-1' }),
        },
        customer: {
          create: jest.fn().mockResolvedValue({ id: 'customer-1' }),
        },
      };
      return fn(tx);
    });

  const customerCredentialCreate = jest.fn().mockResolvedValue({});
  const prisma = {
    plan: {
      findFirst: jest
        .fn()
        .mockResolvedValue(
          overrides.fallbackPlan === undefined
            ? { id: 'fallback-plan-1' }
            : overrides.fallbackPlan,
        ),
    },
    customerAccount: {
      findUnique:
        overrides.customerAccountFindUnique ??
        jest.fn().mockResolvedValue(null),
    },
    customerCredential: {
      create: customerCredentialCreate,
    },
    $transaction: overrides.transaction ?? defaultTransaction,
  } as unknown as PrismaService;

  return {
    migrator: new CustomerIdentityMigrator(prisma, legacyPrisma, idMapper),
    recordSuccess,
    recordRejected,
    touchExistingSuccess,
    customerCredentialCreate,
  };
}

describe('CustomerIdentityMigrator', () => {
  it('creates a CustomerAccount+Customer on the fallback plan and records success', async () => {
    const { migrator, recordSuccess } = createMigrator({});

    await migrator.migrate('job-1');

    expect(recordSuccess).toHaveBeenCalledWith(
      expect.objectContaining({
        sourceTable: 'CardUser',
        sourceId: 'legacy-card-user-1',
        targetTable: 'Customer',
        targetId: 'customer-1',
      }),
    );
  });

  it('rejects as FALLBACK_PLAN_NOT_CONFIGURED when no fallback plan exists', async () => {
    const { migrator, recordRejected, recordSuccess } = createMigrator({
      fallbackPlan: null,
    });

    await migrator.migrate('job-1');

    expect(recordSuccess).not.toHaveBeenCalled();
    expect(recordRejected).toHaveBeenCalledWith(
      expect.objectContaining({ reason: 'FALLBACK_PLAN_NOT_CONFIGURED' }),
    );
  });

  it('rejects as EMAIL_ALREADY_EXISTS_IN_TARGET when the email is already taken', async () => {
    const { migrator, recordRejected, recordSuccess } = createMigrator({
      customerAccountFindUnique: jest
        .fn()
        .mockResolvedValue({ id: 'existing' }),
    });

    await migrator.migrate('job-1');

    expect(recordSuccess).not.toHaveBeenCalled();
    expect(recordRejected).toHaveBeenCalledWith(
      expect.objectContaining({ reason: 'EMAIL_ALREADY_EXISTS_IN_TARGET' }),
    );
  });

  it('skips reprocessing and just touches the record when a prior SUCCESS exists', async () => {
    const { migrator, recordSuccess, touchExistingSuccess } = createMigrator({
      findExisting: jest.fn().mockResolvedValue({ status: 'SUCCESS' }),
    });

    await migrator.migrate('job-1');

    expect(recordSuccess).not.toHaveBeenCalled();
    expect(touchExistingSuccess).toHaveBeenCalledWith(
      'CUSTOMER_IDENTITY',
      'CardUser',
      'legacy-card-user-1',
      'job-1',
    );
  });

  it('applies the credential strategy with the legacy bcrypt hash for a password-based account', async () => {
    const { migrator, customerCredentialCreate } = createMigrator({
      findMany: () =>
        Promise.resolve([
          legacyCardUser({ password: '$2a$10$hash', googleId: null }),
        ]),
    });

    await migrator.migrate('job-1');

    expect(customerCredentialCreate).toHaveBeenCalledWith({
      data: {
        accountId: 'account-1',
        userId: 'account-1',
        providerId: 'credential',
        password: '$2a$10$hash',
      },
    });
  });

  it('pre-links a google credential for a Google-linked account, in addition to any password', async () => {
    const { migrator, customerCredentialCreate } = createMigrator({
      findMany: () =>
        Promise.resolve([
          legacyCardUser({ password: '$2a$10$hash', googleId: 'google-sub-1' }),
        ]),
    });

    await migrator.migrate('job-1');

    expect(customerCredentialCreate).toHaveBeenCalledTimes(2);
    expect(customerCredentialCreate).toHaveBeenCalledWith({
      data: {
        accountId: 'google-sub-1',
        userId: 'account-1',
        providerId: 'google',
      },
    });
  });
});
