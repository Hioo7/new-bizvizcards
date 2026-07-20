import { OrganisationMemberMigrator } from './organisation-member.migrator';
import type { PrismaService } from '../../../../common/prisma/prisma.service';
import type { LegacyPrismaService } from '../../../../common/legacy-db/legacy-prisma.service';
import type { LegacyIdMapperService } from '../legacy-id-mapper.service';

function legacyMember(
  overrides?: Partial<{
    id: string;
    organisationId: string;
    cardUserId: string;
    role: string;
  }>,
) {
  return {
    id: 'legacy-member-1',
    organisationId: 'legacy-org-1',
    cardUserId: 'legacy-card-user-1',
    role: 'MEMBER',
    joinedAt: new Date(),
    ...overrides,
  };
}

function createMigrator(overrides: {
  findMany?: () => Promise<unknown[]>;
  findExisting?: () => Promise<unknown>;
  resolveTargetId?: (domain: string) => Promise<string | null>;
  memberCreate?: () => Promise<{ id: string }>;
}) {
  const recordSuccess = jest.fn().mockResolvedValue(undefined);
  const recordRejected = jest.fn().mockResolvedValue(undefined);
  const touchExistingSuccess = jest.fn().mockResolvedValue(undefined);
  const resolveTargetId =
    overrides.resolveTargetId ??
    ((domain: string) =>
      Promise.resolve(
        domain === 'ORGANISATION' ? 'organisation-1' : 'customer-1',
      ));
  const idMapper = {
    findExisting: overrides.findExisting ?? jest.fn().mockResolvedValue(null),
    resolveTargetId: jest.fn().mockImplementation(resolveTargetId),
    recordSuccess,
    recordRejected,
    touchExistingSuccess,
  } as unknown as LegacyIdMapperService;

  let callCount = 0;
  const legacyPrisma = {
    legacyOrganisationMember: {
      count: jest.fn().mockResolvedValue(1),
      findMany: jest.fn().mockImplementation(async () => {
        callCount += 1;
        if (callCount === 1) {
          return (
            overrides.findMany ?? (() => Promise.resolve([legacyMember()]))
          )();
        }
        return [];
      }),
    },
  } as unknown as LegacyPrismaService;

  const prisma = {
    organisationMember: {
      create:
        overrides.memberCreate ??
        jest.fn().mockResolvedValue({ id: 'member-1' }),
    },
  } as unknown as PrismaService;

  return {
    migrator: new OrganisationMemberMigrator(prisma, legacyPrisma, idMapper),
    recordSuccess,
    recordRejected,
    touchExistingSuccess,
  };
}

describe('OrganisationMemberMigrator', () => {
  it('creates an ACTIVE OrganisationMember with resolved ids and records success', async () => {
    const create = jest.fn().mockResolvedValue({ id: 'member-1' });
    const { migrator, recordSuccess } = createMigrator({
      memberCreate: create,
    });

    await migrator.migrate('job-1');

    expect(create).toHaveBeenCalledWith({
      data: {
        organisationId: 'organisation-1',
        customerId: 'customer-1',
        role: 'MEMBER',
        status: 'ACTIVE',
      },
    });
    expect(recordSuccess).toHaveBeenCalledWith(
      expect.objectContaining({
        targetTable: 'OrganisationMember',
        targetId: 'member-1',
      }),
    );
  });

  it('maps legacy SPOC role through unchanged', async () => {
    const create = jest.fn().mockResolvedValue({ id: 'member-1' });
    const { migrator } = createMigrator({
      findMany: () => Promise.resolve([legacyMember({ role: 'SPOC' })]),
      memberCreate: create,
    });

    await migrator.migrate('job-1');

    expect(create).toHaveBeenCalledWith({
      data: {
        organisationId: 'organisation-1',
        customerId: 'customer-1',
        role: 'SPOC',
        status: 'ACTIVE',
      },
    });
  });

  it('rejects as OWNING_ORGANISATION_NOT_MIGRATED when the org was not migrated', async () => {
    const { migrator, recordRejected, recordSuccess } = createMigrator({
      resolveTargetId: (domain) =>
        Promise.resolve(domain === 'ORGANISATION' ? null : 'customer-1'),
    });

    await migrator.migrate('job-1');

    expect(recordSuccess).not.toHaveBeenCalled();
    expect(recordRejected).toHaveBeenCalledWith(
      expect.objectContaining({ reason: 'OWNING_ORGANISATION_NOT_MIGRATED' }),
    );
  });

  it('rejects as MEMBER_CUSTOMER_NOT_MIGRATED when the customer was not migrated', async () => {
    const { migrator, recordRejected, recordSuccess } = createMigrator({
      resolveTargetId: (domain) =>
        Promise.resolve(domain === 'ORGANISATION' ? 'organisation-1' : null),
    });

    await migrator.migrate('job-1');

    expect(recordSuccess).not.toHaveBeenCalled();
    expect(recordRejected).toHaveBeenCalledWith(
      expect.objectContaining({ reason: 'MEMBER_CUSTOMER_NOT_MIGRATED' }),
    );
  });

  it('skips reprocessing and just touches the record when a prior SUCCESS exists', async () => {
    const { migrator, recordSuccess, touchExistingSuccess } = createMigrator({
      findExisting: jest.fn().mockResolvedValue({ status: 'SUCCESS' }),
    });

    await migrator.migrate('job-1');

    expect(recordSuccess).not.toHaveBeenCalled();
    expect(touchExistingSuccess).toHaveBeenCalledWith(
      'ORGANISATION_MEMBER',
      'OrganisationMember',
      'legacy-member-1',
      'job-1',
    );
  });
});
