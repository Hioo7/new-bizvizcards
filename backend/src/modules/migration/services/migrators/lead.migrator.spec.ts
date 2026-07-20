import { LeadMigrator } from './lead.migrator';
import type { PrismaService } from '../../../../common/prisma/prisma.service';
import type { LegacyPrismaService } from '../../../../common/legacy-db/legacy-prisma.service';
import type { LegacyIdMapperService } from '../legacy-id-mapper.service';

function legacyLead(overrides?: Record<string, unknown>) {
  return {
    id: 'legacy-lead-1',
    cardUserId: 'legacy-card-user-1',
    name: 'Prospect Person',
    email: 'prospect@example.com',
    mob_country_code: 91,
    mobile_number: BigInt('9876543210'),
    note: 'Met at conference',
    location: 'Mumbai',
    location_latitude: 19.076,
    location_longitude: 72.877,
    company: 'Acme',
    profession: 'CEO',
    folderId: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}

function createMigrator(overrides: {
  findMany?: () => Promise<unknown[]>;
  findExisting?: () => Promise<unknown>;
  resolveTargetId?: (domain: string) => Promise<string | null>;
  leadCreate?: () => Promise<{ id: string }>;
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

  let callCount = 0;
  const legacyPrisma = {
    legacyCardUserLead: {
      count: jest.fn().mockResolvedValue(1),
      findMany: jest.fn().mockImplementation(async () => {
        callCount += 1;
        if (callCount === 1) {
          return (
            overrides.findMany ?? (() => Promise.resolve([legacyLead()]))
          )();
        }
        return [];
      }),
    },
  } as unknown as LegacyPrismaService;

  const leadCreate = jest
    .fn()
    .mockImplementation(
      overrides.leadCreate ?? (() => Promise.resolve({ id: 'lead-1' })),
    );
  const prisma = {
    lead: { create: leadCreate },
  } as unknown as PrismaService;

  return {
    migrator: new LeadMigrator(prisma, legacyPrisma, idMapper),
    recordSuccess,
    recordRejected,
    touchExistingSuccess,
    leadCreate,
  };
}

describe('LeadMigrator', () => {
  it('creates a Lead for the resolved customer, omitting sourcedBy/stage so schema defaults apply', async () => {
    const { migrator, leadCreate, recordSuccess } = createMigrator({});

    await migrator.migrate('job-1');

    expect(leadCreate).toHaveBeenCalledWith({
      data: {
        customerId: 'customer-1',
        folderId: null,
        name: 'Prospect Person',
        email: 'prospect@example.com',
        countryDialCode: '+91',
        phoneNumber: '9876543210',
        note: 'Met at conference',
        company: 'Acme',
        profession: 'CEO',
        location: 'Mumbai',
        locationLatitude: 19.076,
        locationLongitude: 72.877,
      },
    });
    expect(recordSuccess).toHaveBeenCalledWith(
      expect.objectContaining({ targetTable: 'Lead', targetId: 'lead-1' }),
    );
  });

  it('falls back to an empty name when the legacy lead has none, rather than rejecting', async () => {
    const { migrator, leadCreate } = createMigrator({
      findMany: () => Promise.resolve([legacyLead({ name: null })]),
    });

    await migrator.migrate('job-1');

    expect(leadCreate).toHaveBeenCalledWith({
      data: {
        customerId: 'customer-1',
        folderId: null,
        name: '',
        email: 'prospect@example.com',
        countryDialCode: '+91',
        phoneNumber: '9876543210',
        note: 'Met at conference',
        company: 'Acme',
        profession: 'CEO',
        location: 'Mumbai',
        locationLatitude: 19.076,
        locationLongitude: 72.877,
      },
    });
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

  it('degrades to folderId: null (does not reject) when the legacy folder reference is unresolved', async () => {
    const { migrator, leadCreate, recordRejected } = createMigrator({
      findMany: () =>
        Promise.resolve([legacyLead({ folderId: 'legacy-folder-x' })]),
      resolveTargetId: (domain) =>
        Promise.resolve(domain === 'CUSTOMER_IDENTITY' ? 'customer-1' : null),
    });

    await migrator.migrate('job-1');

    expect(recordRejected).not.toHaveBeenCalled();
    const [[call]] = leadCreate.mock.calls as [
      [{ data: { folderId: unknown } }],
    ];
    expect(call.data.folderId).toBeNull();
  });

  it('skips reprocessing and just touches the record when a prior SUCCESS exists', async () => {
    const { migrator, recordSuccess, touchExistingSuccess } = createMigrator({
      findExisting: jest.fn().mockResolvedValue({ status: 'SUCCESS' }),
    });

    await migrator.migrate('job-1');

    expect(recordSuccess).not.toHaveBeenCalled();
    expect(touchExistingSuccess).toHaveBeenCalledWith(
      'LEAD',
      'CardUserLead',
      'legacy-lead-1',
      'job-1',
    );
  });
});
