import { StaffIdentityMigrator } from './staff-identity.migrator';
import type { PrismaService } from '../../../../common/prisma/prisma.service';
import type { LegacyPrismaService } from '../../../../common/legacy-db/legacy-prisma.service';
import type { LegacyIdMapperService } from '../legacy-id-mapper.service';

function legacyUser(
  overrides?: Partial<{
    id: string;
    name: string;
    email: string;
    role: string;
  }>,
) {
  return {
    id: 'legacy-user-1',
    name: 'Admin Person',
    email: 'admin@example.com',
    passwordHash: 'unused',
    role: 'USER',
    lastLogin: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}

function createMigrator(overrides: {
  findMany?: () => Promise<unknown[]>;
  findExisting?: () => Promise<unknown>;
  employeeAccountFindUnique?: () => Promise<unknown>;
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
    legacyUser: {
      count: jest.fn().mockResolvedValue(1),
      findMany: jest.fn().mockImplementation(async () => {
        callCount += 1;
        if (callCount === 1) {
          return (
            overrides.findMany ?? (() => Promise.resolve([legacyUser()]))
          )();
        }
        return [];
      }),
    },
  } as unknown as LegacyPrismaService;

  const prisma = {
    employeeAccount: {
      findUnique:
        overrides.employeeAccountFindUnique ??
        jest.fn().mockResolvedValue(null),
    },
    $transaction:
      overrides.transaction ??
      jest.fn().mockResolvedValue({ id: 'employee-1' }),
  } as unknown as PrismaService;

  return {
    migrator: new StaffIdentityMigrator(prisma, legacyPrisma, idMapper),
    recordSuccess,
    recordRejected,
    touchExistingSuccess,
  };
}

describe('StaffIdentityMigrator', () => {
  it('creates an EmployeeAccount+Employee and records success for a new legacy User', async () => {
    const { migrator, recordSuccess } = createMigrator({});

    await migrator.migrate('job-1');

    expect(recordSuccess).toHaveBeenCalledWith(
      expect.objectContaining({
        sourceTable: 'User',
        sourceId: 'legacy-user-1',
        targetTable: 'Employee',
        targetId: 'employee-1',
      }),
    );
  });

  it('maps legacy Role.ADMIN to the admin employee role, not employee', async () => {
    const transaction = jest
      .fn()
      .mockImplementation((fn: (tx: unknown) => Promise<unknown>) => {
        const tx = {
          employeeAccount: {
            create: jest
              .fn()
              .mockImplementation(({ data }: { data: { role: string } }) => {
                expect(data.role).toBe('admin');
                return Promise.resolve({ id: 'account-1' });
              }),
          },
          employee: {
            create: jest.fn().mockResolvedValue({ id: 'employee-1' }),
          },
        };
        return fn(tx);
      });

    const { migrator } = createMigrator({
      findMany: () => Promise.resolve([legacyUser({ role: 'ADMIN' })]),
      transaction,
    });

    await migrator.migrate('job-1');

    expect(transaction).toHaveBeenCalled();
  });

  it('rejects as EMPLOYEE_EMAIL_ALREADY_EXISTS_IN_TARGET when the email is already taken', async () => {
    const { migrator, recordRejected, recordSuccess } = createMigrator({
      employeeAccountFindUnique: jest
        .fn()
        .mockResolvedValue({ id: 'existing' }),
    });

    await migrator.migrate('job-1');

    expect(recordSuccess).not.toHaveBeenCalled();
    expect(recordRejected).toHaveBeenCalledWith(
      expect.objectContaining({
        reason: 'EMPLOYEE_EMAIL_ALREADY_EXISTS_IN_TARGET',
      }),
    );
  });

  it('skips reprocessing and just touches the record when a prior SUCCESS exists', async () => {
    const { migrator, recordSuccess, touchExistingSuccess } = createMigrator({
      findExisting: jest.fn().mockResolvedValue({ status: 'SUCCESS' }),
    });

    await migrator.migrate('job-1');

    expect(recordSuccess).not.toHaveBeenCalled();
    expect(touchExistingSuccess).toHaveBeenCalledWith(
      'STAFF_IDENTITY',
      'User',
      'legacy-user-1',
      'job-1',
    );
  });
});
