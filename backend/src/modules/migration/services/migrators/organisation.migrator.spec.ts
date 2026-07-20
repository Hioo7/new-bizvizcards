import { OrganisationMigrator } from './organisation.migrator';
import type { PrismaService } from '../../../../common/prisma/prisma.service';
import type { LegacyPrismaService } from '../../../../common/legacy-db/legacy-prisma.service';
import type { LegacyIdMapperService } from '../legacy-id-mapper.service';

function legacyOrganisation(
  overrides?: Partial<{ id: string; displayName: string }>,
) {
  return {
    id: 'legacy-org-1',
    displayName: 'Acme Inc',
    domainName: 'acme.com',
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}

function createMigrator(overrides: {
  findMany?: () => Promise<unknown[]>;
  findExisting?: () => Promise<unknown>;
  spocMembers?: { cardUserId: string }[];
  resolveTargetId?: () => Promise<string | null>;
  organisationCreate?: () => Promise<{ id: string }>;
}) {
  const recordSuccess = jest.fn().mockResolvedValue(undefined);
  const recordRejected = jest.fn().mockResolvedValue(undefined);
  const touchExistingSuccess = jest.fn().mockResolvedValue(undefined);
  const idMapper = {
    findExisting: overrides.findExisting ?? jest.fn().mockResolvedValue(null),
    resolveTargetId:
      overrides.resolveTargetId ??
      jest.fn().mockResolvedValue('resolved-customer-1'),
    recordSuccess,
    recordRejected,
    touchExistingSuccess,
  } as unknown as LegacyIdMapperService;

  let callCount = 0;
  const legacyPrisma = {
    legacyOrganisation: {
      count: jest.fn().mockResolvedValue(1),
      findMany: jest.fn().mockImplementation(async () => {
        callCount += 1;
        if (callCount === 1) {
          return (
            overrides.findMany ??
            (() => Promise.resolve([legacyOrganisation()]))
          )();
        }
        return [];
      }),
    },
    legacyOrganisationMember: {
      findMany: jest.fn().mockResolvedValue(overrides.spocMembers ?? []),
    },
  } as unknown as LegacyPrismaService;

  const prisma = {
    organisation: {
      create:
        overrides.organisationCreate ??
        jest.fn().mockResolvedValue({ id: 'organisation-1' }),
    },
  } as unknown as PrismaService;

  return {
    migrator: new OrganisationMigrator(prisma, legacyPrisma, idMapper),
    recordSuccess,
    recordRejected,
    touchExistingSuccess,
  };
}

describe('OrganisationMigrator', () => {
  it('creates an Organisation from displayName and records success', async () => {
    const { migrator, recordSuccess } = createMigrator({});

    await migrator.migrate('job-1');

    expect(recordSuccess).toHaveBeenCalledWith(
      expect.objectContaining({
        sourceTable: 'Organisation',
        sourceId: 'legacy-org-1',
        targetTable: 'Organisation',
        targetId: 'organisation-1',
      }),
    );
  });

  it('infers createdByCustomerId from the sole legacy SPOC member', async () => {
    const create = jest.fn().mockResolvedValue({ id: 'organisation-1' });
    const { migrator } = createMigrator({
      spocMembers: [{ cardUserId: 'legacy-card-user-1' }],
      resolveTargetId: jest.fn().mockResolvedValue('customer-1'),
      organisationCreate: create,
    });

    await migrator.migrate('job-1');

    expect(create).toHaveBeenCalledWith({
      data: { name: 'Acme Inc', createdByCustomerId: 'customer-1' },
    });
  });

  it('leaves createdByCustomerId null when there is no single SPOC member', async () => {
    const create = jest.fn().mockResolvedValue({ id: 'organisation-1' });
    const { migrator } = createMigrator({
      spocMembers: [],
      organisationCreate: create,
    });

    await migrator.migrate('job-1');

    expect(create).toHaveBeenCalledWith({
      data: { name: 'Acme Inc', createdByCustomerId: null },
    });
  });

  it('skips reprocessing and just touches the record when a prior SUCCESS exists', async () => {
    const { migrator, recordSuccess, touchExistingSuccess } = createMigrator({
      findExisting: jest.fn().mockResolvedValue({ status: 'SUCCESS' }),
    });

    await migrator.migrate('job-1');

    expect(recordSuccess).not.toHaveBeenCalled();
    expect(touchExistingSuccess).toHaveBeenCalledWith(
      'ORGANISATION',
      'Organisation',
      'legacy-org-1',
      'job-1',
    );
  });
});
