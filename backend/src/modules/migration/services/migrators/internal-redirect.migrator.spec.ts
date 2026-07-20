import { InternalRedirectMigrator } from './internal-redirect.migrator';
import { Prisma } from '../../../../generated/prisma/client';
import type { PrismaService } from '../../../../common/prisma/prisma.service';
import type { LegacyPrismaService } from '../../../../common/legacy-db/legacy-prisma.service';
import type { LegacyIdMapperService } from '../legacy-id-mapper.service';

function legacyRedirect(
  overrides?: Partial<{
    id: string;
    oldRoute: string;
    newRoute: string;
    enabled: boolean;
  }>,
) {
  return {
    id: 'legacy-redirect-1',
    oldRoute: '/old-path',
    newRoute: '/new-path',
    enabled: true,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}

function createMigrator(overrides: {
  findMany?: () => Promise<unknown[]>;
  findExisting?: () => Promise<unknown>;
  redirectCreate?: () => Promise<{ id: string }>;
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
    legacyRedirectRoute: {
      count: jest.fn().mockResolvedValue(1),
      findMany: jest.fn().mockImplementation(async () => {
        callCount += 1;
        if (callCount === 1) {
          return (
            overrides.findMany ?? (() => Promise.resolve([legacyRedirect()]))
          )();
        }
        return [];
      }),
    },
  } as unknown as LegacyPrismaService;

  const prisma = {
    internalRedirectRoute: {
      create:
        overrides.redirectCreate ??
        jest.fn().mockResolvedValue({ id: 'internal-redirect-1' }),
    },
  } as unknown as PrismaService;

  return {
    migrator: new InternalRedirectMigrator(prisma, legacyPrisma, idMapper),
    recordSuccess,
    recordRejected,
    touchExistingSuccess,
  };
}

describe('InternalRedirectMigrator', () => {
  it('creates an InternalRedirectRoute mapping oldRoute/newRoute and records success', async () => {
    const create = jest.fn().mockResolvedValue({ id: 'internal-redirect-1' });
    const { migrator, recordSuccess } = createMigrator({
      redirectCreate: create,
    });

    await migrator.migrate('job-1');

    expect(create).toHaveBeenCalledWith({
      data: {
        sourcePath: '/old-path',
        targetPath: '/new-path',
        enabled: true,
        createdByEmployeeId: null,
      },
    });
    expect(recordSuccess).toHaveBeenCalledWith(
      expect.objectContaining({
        targetTable: 'InternalRedirectRoute',
        targetId: 'internal-redirect-1',
      }),
    );
  });

  it('carries a disabled legacy redirect through as disabled', async () => {
    const create = jest.fn().mockResolvedValue({ id: 'internal-redirect-1' });
    const { migrator } = createMigrator({
      findMany: () => Promise.resolve([legacyRedirect({ enabled: false })]),
      redirectCreate: create,
    });

    await migrator.migrate('job-1');

    expect(create).toHaveBeenCalledWith({
      data: {
        sourcePath: '/old-path',
        targetPath: '/new-path',
        enabled: false,
        createdByEmployeeId: null,
      },
    });
  });

  it('skips reprocessing and just touches the record when a prior SUCCESS exists', async () => {
    const { migrator, recordSuccess, touchExistingSuccess } = createMigrator({
      findExisting: jest.fn().mockResolvedValue({ status: 'SUCCESS' }),
    });

    await migrator.migrate('job-1');

    expect(recordSuccess).not.toHaveBeenCalled();
    expect(touchExistingSuccess).toHaveBeenCalledWith(
      'INTERNAL_REDIRECT',
      'RedirectRoute',
      'legacy-redirect-1',
      'job-1',
    );
  });

  it('rejects as SOURCE_PATH_ALREADY_TAKEN on a unique constraint conflict', async () => {
    const { migrator, recordRejected, recordSuccess } = createMigrator({
      redirectCreate: jest.fn().mockRejectedValue(
        new Prisma.PrismaClientKnownRequestError('Unique constraint failed', {
          code: 'P2002',
          clientVersion: 'test',
        }),
      ),
    });

    await migrator.migrate('job-1');

    expect(recordSuccess).not.toHaveBeenCalled();
    expect(recordRejected).toHaveBeenCalledWith(
      expect.objectContaining({ reason: 'SOURCE_PATH_ALREADY_TAKEN' }),
    );
  });

  it('rejects as UNEXPECTED_DATABASE_ERROR on any other error', async () => {
    const { migrator, recordRejected } = createMigrator({
      redirectCreate: jest.fn().mockRejectedValue(new Error('connection lost')),
    });

    await migrator.migrate('job-1');

    expect(recordRejected).toHaveBeenCalledWith(
      expect.objectContaining({ reason: 'UNEXPECTED_DATABASE_ERROR' }),
    );
  });
});
