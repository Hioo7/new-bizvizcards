import { EcardMigrator } from './ecard.migrator';
import type { PrismaService } from '../../../../common/prisma/prisma.service';
import type { LegacyPrismaService } from '../../../../common/legacy-db/legacy-prisma.service';
import type { LegacyIdMapperService } from '../legacy-id-mapper.service';
import type { LegacyMediaTransferService } from '../legacy-media-transfer.service';

function legacyEcard(overrides?: Record<string, unknown>) {
  return {
    id: 'legacy-ecard-1',
    cardUserId: 'legacy-card-user-1',
    endpoint: 'jane-doe',
    Profession: 'Designer',
    shortNote: 'Note',
    description: 'Desc',
    aboutme: 'About',
    whatsapp: null,
    mob_country_code: 91,
    mobile_number: BigInt('9876543210'),
    imageUrl: null,
    mediaId: null,
    website: null,
    instagram: null,
    facebook: null,
    twitter: null,
    linkedin: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    cardUser: {
      id: 'legacy-card-user-1',
      name: 'Jane Doe',
      email: 'jane@example.com',
      permissions: { isExchangeContactEnabled: true },
    },
    ...overrides,
  };
}

function createMigrator(overrides: {
  findMany?: () => Promise<unknown[]>;
  findExisting?: () => Promise<unknown>;
  resolveTargetId?: () => Promise<string | null>;
  ecardFindUnique?: () => Promise<unknown>;
  transfer?: () => Promise<{ id: string } | null>;
  transaction?: () => Promise<unknown>;
  organisationMemberFindFirst?: () => Promise<{
    organisationId: string;
  } | null>;
}) {
  const recordSuccess = jest.fn().mockResolvedValue(undefined);
  const recordRejected = jest.fn().mockResolvedValue(undefined);
  const touchExistingSuccess = jest.fn().mockResolvedValue(undefined);
  const idMapper = {
    findExisting: overrides.findExisting ?? jest.fn().mockResolvedValue(null),
    resolveTargetId:
      overrides.resolveTargetId ?? jest.fn().mockResolvedValue('customer-1'),
    recordSuccess,
    recordRejected,
    touchExistingSuccess,
  } as unknown as LegacyIdMapperService;

  let callCount = 0;
  const legacyPrisma = {
    legacyECard: {
      count: jest.fn().mockResolvedValue(1),
      findMany: jest.fn().mockImplementation(async () => {
        callCount += 1;
        if (callCount === 1) {
          return (
            overrides.findMany ?? (() => Promise.resolve([legacyEcard()]))
          )();
        }
        return [];
      }),
    },
  } as unknown as LegacyPrismaService;

  const componentCreates: { type: string; data: unknown }[] = [];
  const whatsappComponentCreates: {
    phoneCountryDialCode: string;
    phoneNumber: string;
  }[] = [];
  const ecardCreates: { organisationId: string | null }[] = [];
  const defaultTransaction = jest
    .fn()
    .mockImplementation((fn: (tx: unknown) => Promise<unknown>) => {
      const tx = {
        eCard: {
          create: jest
            .fn()
            .mockImplementation(
              ({ data }: { data: { organisationId: string | null } }) => {
                ecardCreates.push({ organisationId: data.organisationId });
                return Promise.resolve({ id: 'ecard-1' });
              },
            ),
        },
        eCardComponent: {
          create: jest
            .fn()
            .mockImplementation(({ data }: { data: { type: string } }) => {
              componentCreates.push({ type: data.type, data });
              return Promise.resolve({ id: `component-${data.type}` });
            }),
        },
        eCardAboutComponent: { create: jest.fn().mockResolvedValue({}) },
        eCardSocialLinksComponent: { create: jest.fn().mockResolvedValue({}) },
        eCardWhatsAppComponent: {
          create: jest.fn().mockImplementation(
            ({
              data,
            }: {
              data: {
                ecardComponentId: string;
                phoneCountryDialCode: string;
                phoneNumber: string;
              };
            }) => {
              whatsappComponentCreates.push({
                phoneCountryDialCode: data.phoneCountryDialCode,
                phoneNumber: data.phoneNumber,
              });
              return Promise.resolve({});
            },
          ),
        },
      };
      return fn(tx);
    });

  const prisma = {
    eCard: {
      findUnique:
        overrides.ecardFindUnique ?? jest.fn().mockResolvedValue(null),
    },
    organisationMember: {
      findFirst:
        overrides.organisationMemberFindFirst ??
        jest.fn().mockResolvedValue(null),
    },
    $transaction: overrides.transaction ?? defaultTransaction,
  } as unknown as PrismaService;

  const mediaTransfer = {
    transfer: overrides.transfer ?? jest.fn().mockResolvedValue(null),
  } as unknown as LegacyMediaTransferService;

  return {
    migrator: new EcardMigrator(prisma, legacyPrisma, idMapper, mediaTransfer),
    recordSuccess,
    recordRejected,
    touchExistingSuccess,
    componentCreates,
    whatsappComponentCreates,
    ecardCreates,
  };
}

describe('EcardMigrator', () => {
  it('creates an ECard with hero fields from CardUser and an ABOUT component matching legacy fields 1:1', async () => {
    const { migrator, recordSuccess, componentCreates } = createMigrator({});

    await migrator.migrate('job-1');

    expect(recordSuccess).toHaveBeenCalledWith(
      expect.objectContaining({
        sourceTable: 'ECard',
        sourceId: 'legacy-ecard-1',
        targetTable: 'ECard',
        targetId: 'ecard-1',
        note: undefined,
      }),
    );
    expect(componentCreates.map((c) => c.type)).toEqual(['ABOUT']);
  });

  it('rejects as OWNING_CUSTOMER_NOT_MIGRATED when the owning CardUser was not migrated (hard reject, unlike SmartCard)', async () => {
    const { migrator, recordRejected, recordSuccess } = createMigrator({
      resolveTargetId: jest.fn().mockResolvedValue(null),
    });

    await migrator.migrate('job-1');

    expect(recordSuccess).not.toHaveBeenCalled();
    expect(recordRejected).toHaveBeenCalledWith(
      expect.objectContaining({ reason: 'OWNING_CUSTOMER_NOT_MIGRATED' }),
    );
  });

  it('rejects as ENDPOINT_ALREADY_TAKEN when the endpoint is already in use', async () => {
    const { migrator, recordRejected, recordSuccess } = createMigrator({
      ecardFindUnique: jest.fn().mockResolvedValue({ id: 'existing' }),
    });

    await migrator.migrate('job-1');

    expect(recordSuccess).not.toHaveBeenCalled();
    expect(recordRejected).toHaveBeenCalledWith(
      expect.objectContaining({ reason: 'ENDPOINT_ALREADY_TAKEN' }),
    );
  });

  it('creates a SOCIAL_LINKS component only when at least one social field is present', async () => {
    const { migrator, componentCreates } = createMigrator({
      findMany: () => Promise.resolve([legacyEcard({ instagram: 'janedoe' })]),
    });

    await migrator.migrate('job-1');

    expect(componentCreates.map((c) => c.type)).toEqual([
      'ABOUT',
      'SOCIAL_LINKS',
    ]);
  });

  it("creates a WHATSAPP component, splitting the dial code using the ECard's own mob_country_code rather than guessing from digit count", async () => {
    // Deliberately a 2-digit dial code (91) — a naive greedy \d{1,3} regex
    // would mis-split this as "+919" / "876543210" (wrong); the fix trusts
    // the row's own structured mob_country_code field instead.
    const { migrator, componentCreates, whatsappComponentCreates } =
      createMigrator({
        findMany: () =>
          Promise.resolve([
            legacyEcard({ whatsapp: '+91 98765 43210', mob_country_code: 91 }),
          ]),
      });

    await migrator.migrate('job-1');

    expect(componentCreates.map((c) => c.type)).toEqual(['ABOUT', 'WHATSAPP']);
    expect(whatsappComponentCreates).toEqual([
      { phoneCountryDialCode: '+91', phoneNumber: '9876543210' },
    ]);
  });

  it('skips the WHATSAPP component with a non-fatal note when the number is unparseable — the ECard still succeeds', async () => {
    const { migrator, recordSuccess, componentCreates } = createMigrator({
      findMany: () =>
        Promise.resolve([legacyEcard({ whatsapp: 'call me maybe' })]),
    });

    await migrator.migrate('job-1');

    expect(componentCreates.map((c) => c.type)).toEqual(['ABOUT']);
    expect(recordSuccess).toHaveBeenCalledWith(
      expect.objectContaining({ note: 'WHATSAPP_NUMBER_UNPARSEABLE' }),
    );
  });

  it('skips the WHATSAPP component when mob_country_code is unset, even if the whatsapp string looks numeric', async () => {
    const { migrator, componentCreates, recordSuccess } = createMigrator({
      findMany: () =>
        Promise.resolve([
          legacyEcard({ whatsapp: '+919876543210', mob_country_code: null }),
        ]),
    });

    await migrator.migrate('job-1');

    expect(componentCreates.map((c) => c.type)).toEqual(['ABOUT']);
    expect(recordSuccess).toHaveBeenCalledWith(
      expect.objectContaining({ note: 'WHATSAPP_NUMBER_UNPARSEABLE' }),
    );
  });

  it('skips the WHATSAPP component when the whatsapp digits do not start with the known mob_country_code', async () => {
    const { migrator, componentCreates } = createMigrator({
      findMany: () =>
        Promise.resolve([
          legacyEcard({ whatsapp: '+15551234567', mob_country_code: 91 }),
        ]),
    });

    await migrator.migrate('job-1');

    expect(componentCreates.map((c) => c.type)).toEqual(['ABOUT']);
  });

  it('records a PROFILE_PHOTO_TRANSFER_FAILED note but still succeeds when the hero photo fails to transfer', async () => {
    const { migrator, recordSuccess } = createMigrator({
      findMany: () =>
        Promise.resolve([
          legacyEcard({ imageUrl: 'https://example.com/x.jpg' }),
        ]),
      transfer: jest.fn().mockResolvedValue(null),
    });

    await migrator.migrate('job-1');

    expect(recordSuccess).toHaveBeenCalledWith(
      expect.objectContaining({ note: 'PROFILE_PHOTO_TRANSFER_FAILED' }),
    );
  });

  it("links the ECard to the owner's migrated organisation membership", async () => {
    const { migrator, ecardCreates } = createMigrator({
      organisationMemberFindFirst: jest
        .fn()
        .mockResolvedValue({ organisationId: 'organisation-1' }),
    });

    await migrator.migrate('job-1');

    expect(ecardCreates).toEqual([{ organisationId: 'organisation-1' }]);
  });

  it('leaves organisationId null when the owner has no migrated organisation membership', async () => {
    const { migrator, ecardCreates } = createMigrator({
      organisationMemberFindFirst: jest.fn().mockResolvedValue(null),
    });

    await migrator.migrate('job-1');

    expect(ecardCreates).toEqual([{ organisationId: null }]);
  });

  it('skips reprocessing and just touches the record when a prior SUCCESS exists', async () => {
    const { migrator, recordSuccess, touchExistingSuccess } = createMigrator({
      findExisting: jest.fn().mockResolvedValue({ status: 'SUCCESS' }),
    });

    await migrator.migrate('job-1');

    expect(recordSuccess).not.toHaveBeenCalled();
    expect(touchExistingSuccess).toHaveBeenCalledWith(
      'ECARD',
      'ECard',
      'legacy-ecard-1',
      'job-1',
    );
  });
});
