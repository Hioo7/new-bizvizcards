import { LeadFolderMigrator } from './lead-folder.migrator';
import type { PrismaService } from '../../../../common/prisma/prisma.service';
import type { LegacyPrismaService } from '../../../../common/legacy-db/legacy-prisma.service';
import type { LegacyIdMapperService } from '../legacy-id-mapper.service';

function legacyLeadFolder(overrides?: Record<string, unknown>) {
  return {
    id: 'legacy-folder-1',
    name: 'Trade Show Leads',
    cardUserId: 'legacy-card-user-1',
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}

function createMigrator(overrides: {
  findMany?: () => Promise<unknown[]>;
  findExisting?: () => Promise<unknown>;
  resolveTargetId?: (domain: string) => Promise<string | null>;
  cardUsersWithDefaultFolder?: unknown[];
  folderCreate?: () => Promise<{ id: string }>;
  customerUpdate?: () => Promise<unknown>;
}) {
  const recordSuccess = jest.fn().mockResolvedValue(undefined);
  const recordRejected = jest.fn().mockResolvedValue(undefined);
  const touchExistingSuccess = jest.fn().mockResolvedValue(undefined);
  const resolveTargetId =
    overrides.resolveTargetId ??
    ((domain: string) =>
      Promise.resolve(
        domain === 'CUSTOMER_IDENTITY' ? 'customer-1' : 'lead-folder-1',
      ));
  const idMapper = {
    findExisting: overrides.findExisting ?? jest.fn().mockResolvedValue(null),
    resolveTargetId: jest.fn().mockImplementation(resolveTargetId),
    recordSuccess,
    recordRejected,
    touchExistingSuccess,
  } as unknown as LegacyIdMapperService;

  let folderCallCount = 0;
  let cardUserCallCount = 0;
  const legacyPrisma = {
    legacyLeadFolder: {
      count: jest.fn().mockResolvedValue(1),
      findMany: jest.fn().mockImplementation(async () => {
        folderCallCount += 1;
        if (folderCallCount === 1) {
          return (
            overrides.findMany ?? (() => Promise.resolve([legacyLeadFolder()]))
          )();
        }
        return [];
      }),
    },
    legacyCardUser: {
      findMany: jest.fn().mockImplementation(() => {
        cardUserCallCount += 1;
        if (cardUserCallCount === 1) {
          return Promise.resolve(overrides.cardUsersWithDefaultFolder ?? []);
        }
        return Promise.resolve([]);
      }),
    },
  } as unknown as LegacyPrismaService;

  const customerUpdate =
    overrides.customerUpdate ?? jest.fn().mockResolvedValue({});
  const prisma = {
    leadFolder: {
      create:
        overrides.folderCreate ??
        jest.fn().mockResolvedValue({ id: 'lead-folder-1' }),
    },
    customer: { update: customerUpdate },
  } as unknown as PrismaService;

  return {
    migrator: new LeadFolderMigrator(prisma, legacyPrisma, idMapper),
    recordSuccess,
    recordRejected,
    touchExistingSuccess,
    customerUpdate,
  };
}

describe('LeadFolderMigrator', () => {
  it('creates a LeadFolder for the resolved customer and records success', async () => {
    const { migrator, recordSuccess } = createMigrator({});

    await migrator.migrate('job-1');

    expect(recordSuccess).toHaveBeenCalledWith(
      expect.objectContaining({
        sourceTable: 'LeadFolder',
        sourceId: 'legacy-folder-1',
        targetTable: 'LeadFolder',
        targetId: 'lead-folder-1',
      }),
    );
  });

  it('rejects as OWNING_CUSTOMER_NOT_MIGRATED when the owning CardUser was not migrated', async () => {
    const { migrator, recordRejected, recordSuccess } = createMigrator({
      resolveTargetId: () => Promise.resolve(null),
    });

    await migrator.migrate('job-1');

    expect(recordSuccess).not.toHaveBeenCalled();
    expect(recordRejected).toHaveBeenCalledWith(
      expect.objectContaining({ reason: 'OWNING_CUSTOMER_NOT_MIGRATED' }),
    );
  });

  it('backfills Customer.defaultLeadFolderId after migrating folders', async () => {
    const { migrator, customerUpdate } = createMigrator({
      cardUsersWithDefaultFolder: [
        { id: 'legacy-card-user-1', defaultLeadFolderId: 'legacy-folder-1' },
      ],
    });

    await migrator.migrate('job-1');

    expect(customerUpdate).toHaveBeenCalledWith({
      where: { id: 'customer-1' },
      data: { defaultLeadFolderId: 'lead-folder-1' },
    });
  });

  it('does not backfill when either the customer or the lead folder is unresolved', async () => {
    const { migrator, customerUpdate } = createMigrator({
      cardUsersWithDefaultFolder: [
        { id: 'legacy-card-user-1', defaultLeadFolderId: 'legacy-folder-1' },
      ],
      resolveTargetId: () => Promise.resolve(null),
    });

    await migrator.migrate('job-1');

    expect(customerUpdate).not.toHaveBeenCalled();
  });

  it('skips reprocessing and just touches the record when a prior SUCCESS exists', async () => {
    const { migrator, recordSuccess, touchExistingSuccess } = createMigrator({
      findExisting: jest.fn().mockResolvedValue({ status: 'SUCCESS' }),
    });

    await migrator.migrate('job-1');

    expect(recordSuccess).not.toHaveBeenCalled();
    expect(touchExistingSuccess).toHaveBeenCalledWith(
      'LEAD_FOLDER',
      'LeadFolder',
      'legacy-folder-1',
      'job-1',
    );
  });
});
