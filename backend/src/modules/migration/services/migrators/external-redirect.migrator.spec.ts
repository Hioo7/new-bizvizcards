import { ExternalRedirectMigrator } from './external-redirect.migrator';
import { Prisma } from '../../../../generated/prisma/client';
import type { PrismaService } from '../../../../common/prisma/prisma.service';
import type { LegacyPrismaService } from '../../../../common/legacy-db/legacy-prisma.service';
import type { LegacyIdMapperService } from '../legacy-id-mapper.service';

function legacyRedirect(
  overrides?: Partial<{
    id: string;
    internalPath: string;
    externalUrl: string;
    enabled: boolean;
  }>,
) {
  return {
    id: 'legacy-external-redirect-1',
    internalPath: '/go/somewhere',
    externalUrl: 'https://example.com/landing',
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
    legacyExternalRedirectRoute: {
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
    externalRedirectRoute: {
      create:
        overrides.redirectCreate ??
        jest.fn().mockResolvedValue({ id: 'external-redirect-1' }),
    },
  } as unknown as PrismaService;

  return {
    migrator: new ExternalRedirectMigrator(prisma, legacyPrisma, idMapper),
    recordSuccess,
    recordRejected,
    touchExistingSuccess,
  };
}

describe('ExternalRedirectMigrator', () => {
  it('creates an ExternalRedirectRoute mapping internalPath/externalUrl and records success', async () => {
    const create = jest.fn().mockResolvedValue({ id: 'external-redirect-1' });
    const { migrator, recordSuccess } = createMigrator({
      redirectCreate: create,
    });

    await migrator.migrate('job-1');

    expect(create).toHaveBeenCalledWith({
      data: {
        sourcePath: '/go/somewhere',
        destinationUrl: 'https://example.com/landing',
        enabled: true,
        createdByEmployeeId: null,
      },
    });
    expect(recordSuccess).toHaveBeenCalledWith(
      expect.objectContaining({
        targetTable: 'ExternalRedirectRoute',
        targetId: 'external-redirect-1',
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
      'EXTERNAL_REDIRECT',
      'ExternalRedirectRoute',
      'legacy-external-redirect-1',
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
