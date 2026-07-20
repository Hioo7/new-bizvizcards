import { RestrictedRouteMigrator } from './restricted-route.migrator';
import { Prisma } from '../../../../generated/prisma/client';
import type { PrismaService } from '../../../../common/prisma/prisma.service';
import type { LegacyPrismaService } from '../../../../common/legacy-db/legacy-prisma.service';
import type { LegacyIdMapperService } from '../legacy-id-mapper.service';

function legacyRoute(overrides?: Partial<{ id: string; endpoint: string }>) {
  return {
    id: 'legacy-route-1',
    endpoint: '/some/blocked/path',
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}

function createMigrator(overrides: {
  findMany?: () => Promise<unknown[]>;
  findExisting?: () => Promise<unknown>;
  pathCreate?: () => Promise<{ id: string }>;
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
    legacyRestrictedRoute: {
      count: jest.fn().mockResolvedValue(1),
      findMany: jest.fn().mockImplementation(async () => {
        callCount += 1;
        if (callCount === 1) {
          return (
            overrides.findMany ?? (() => Promise.resolve([legacyRoute()]))
          )();
        }
        return [];
      }),
    },
  } as unknown as LegacyPrismaService;

  const prisma = {
    restrictedRedirectPath: {
      create:
        overrides.pathCreate ??
        jest.fn().mockResolvedValue({ id: 'restricted-path-1' }),
    },
  } as unknown as PrismaService;

  return {
    migrator: new RestrictedRouteMigrator(prisma, legacyPrisma, idMapper),
    recordSuccess,
    recordRejected,
    touchExistingSuccess,
  };
}

describe('RestrictedRouteMigrator', () => {
  it('creates a RestrictedRedirectPath from the legacy endpoint and records success', async () => {
    const create = jest.fn().mockResolvedValue({ id: 'restricted-path-1' });
    const { migrator, recordSuccess } = createMigrator({ pathCreate: create });

    await migrator.migrate('job-1');

    expect(create).toHaveBeenCalledWith({
      data: { path: '/some/blocked/path' },
    });
    expect(recordSuccess).toHaveBeenCalledWith(
      expect.objectContaining({
        targetTable: 'RestrictedRedirectPath',
        targetId: 'restricted-path-1',
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
      'RESTRICTED_ROUTE',
      'RestrictedRoute',
      'legacy-route-1',
      'job-1',
    );
  });

  it('rejects as RESTRICTED_PATH_ALREADY_TAKEN on a unique constraint conflict', async () => {
    const { migrator, recordRejected, recordSuccess } = createMigrator({
      pathCreate: jest.fn().mockRejectedValue(
        new Prisma.PrismaClientKnownRequestError('Unique constraint failed', {
          code: 'P2002',
          clientVersion: 'test',
        }),
      ),
    });

    await migrator.migrate('job-1');

    expect(recordSuccess).not.toHaveBeenCalled();
    expect(recordRejected).toHaveBeenCalledWith(
      expect.objectContaining({ reason: 'RESTRICTED_PATH_ALREADY_TAKEN' }),
    );
  });

  it('rejects as UNEXPECTED_DATABASE_ERROR on any other error', async () => {
    const { migrator, recordRejected } = createMigrator({
      pathCreate: jest.fn().mockRejectedValue(new Error('connection lost')),
    });

    await migrator.migrate('job-1');

    expect(recordRejected).toHaveBeenCalledWith(
      expect.objectContaining({ reason: 'UNEXPECTED_DATABASE_ERROR' }),
    );
  });
});
