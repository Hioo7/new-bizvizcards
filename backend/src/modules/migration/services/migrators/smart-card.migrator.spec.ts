import { SmartCardMigrator } from './smart-card.migrator';
import type { PrismaService } from '../../../../common/prisma/prisma.service';
import type { LegacyPrismaService } from '../../../../common/legacy-db/legacy-prisma.service';
import type { LegacyIdMapperService } from '../legacy-id-mapper.service';
import type { LegacyMediaTransferService } from '../legacy-media-transfer.service';

function legacySmartCard(overrides?: Record<string, unknown>) {
  return {
    id: 'legacy-smart-card-1',
    cardUserId: null,
    templateId: 'legacy-template-1',
    endpoint: 'acme-card',
    createdAt: new Date(),
    updatedAt: new Date(),
    template: {
      id: 'legacy-template-1',
      slug: 'interior.design.template',
      name: 'Interior',
    },
    profile: null,
    contact: null,
    socialMedia: null,
    founder: null,
    services: [],
    testimonials: [],
    galleries: [],
    ...overrides,
  };
}

function createMigrator(overrides: {
  findMany?: () => Promise<unknown[]>;
  findExisting?: () => Promise<unknown>;
  resolveTargetId?: () => Promise<string | null>;
  smartCardTemplateFindUnique?: () => Promise<unknown>;
  smartCardFindUnique?: () => Promise<unknown>;
  transfer?: () => Promise<{ id: string } | null>;
  transaction?: () => Promise<unknown>;
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
    legacySmartCard: {
      count: jest.fn().mockResolvedValue(1),
      findMany: jest.fn().mockImplementation(async () => {
        callCount += 1;
        if (callCount === 1) {
          return (
            overrides.findMany ?? (() => Promise.resolve([legacySmartCard()]))
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
        smartCard: {
          create: jest.fn().mockResolvedValue({ id: 'smart-card-1' }),
        },
        smartCardProfile: { create: jest.fn().mockResolvedValue({}) },
        smartCardContact: { create: jest.fn().mockResolvedValue({}) },
        smartCardSocialMedia: { create: jest.fn().mockResolvedValue({}) },
        smartCardFounder: { create: jest.fn().mockResolvedValue({}) },
        smartCardService: { create: jest.fn().mockResolvedValue({}) },
        smartCardTestimonial: { create: jest.fn().mockResolvedValue({}) },
        smartCardGallery: {
          create: jest.fn().mockResolvedValue({ id: 'gallery-1' }),
        },
        smartCardGalleryImage: { create: jest.fn().mockResolvedValue({}) },
      };
      return fn(tx);
    });

  const prisma = {
    smartCardTemplate: {
      findUnique:
        overrides.smartCardTemplateFindUnique ??
        jest.fn().mockResolvedValue({ id: 'target-template-1' }),
    },
    smartCard: {
      findUnique:
        overrides.smartCardFindUnique ?? jest.fn().mockResolvedValue(null),
    },
    $transaction: overrides.transaction ?? defaultTransaction,
  } as unknown as PrismaService;

  const mediaTransfer = {
    transfer: overrides.transfer ?? jest.fn().mockResolvedValue(null),
  } as unknown as LegacyMediaTransferService;

  return {
    migrator: new SmartCardMigrator(
      prisma,
      legacyPrisma,
      idMapper,
      mediaTransfer,
    ),
    recordSuccess,
    recordRejected,
    touchExistingSuccess,
  };
}

describe('SmartCardMigrator', () => {
  it('creates a SmartCard for a recognized template slug and records success', async () => {
    const { migrator, recordSuccess } = createMigrator({});

    await migrator.migrate('job-1');

    expect(recordSuccess).toHaveBeenCalledWith(
      expect.objectContaining({
        sourceTable: 'SmartCard',
        sourceId: 'legacy-smart-card-1',
        targetTable: 'SmartCard',
        targetId: 'smart-card-1',
        note: undefined,
      }),
    );
  });

  it('rejects as UNRECOGNIZED_TEMPLATE_SLUG for an unknown legacy template slug', async () => {
    const { migrator, recordRejected, recordSuccess } = createMigrator({
      findMany: () =>
        Promise.resolve([
          legacySmartCard({
            template: {
              id: 'legacy-template-x',
              slug: 'cardone.template',
              name: 'CardOne',
            },
          }),
        ]),
    });

    await migrator.migrate('job-1');

    expect(recordSuccess).not.toHaveBeenCalled();
    expect(recordRejected).toHaveBeenCalledWith(
      expect.objectContaining({ reason: 'UNRECOGNIZED_TEMPLATE_SLUG' }),
    );
  });

  it('rejects as UNRECOGNIZED_TEMPLATE_SLUG when the template key is recognized but not seeded in the new DB', async () => {
    const { migrator, recordRejected } = createMigrator({
      smartCardTemplateFindUnique: jest.fn().mockResolvedValue(null),
    });

    await migrator.migrate('job-1');

    expect(recordRejected).toHaveBeenCalledWith(
      expect.objectContaining({ reason: 'UNRECOGNIZED_TEMPLATE_SLUG' }),
    );
  });

  it('rejects as ENDPOINT_ALREADY_TAKEN when the endpoint is already in use', async () => {
    const { migrator, recordRejected, recordSuccess } = createMigrator({
      smartCardFindUnique: jest.fn().mockResolvedValue({ id: 'existing' }),
    });

    await migrator.migrate('job-1');

    expect(recordSuccess).not.toHaveBeenCalled();
    expect(recordRejected).toHaveBeenCalledWith(
      expect.objectContaining({ reason: 'ENDPOINT_ALREADY_TAKEN' }),
    );
  });

  it('creates the card unassigned (customerId null) with a soft note when the legacy owner was not migrated', async () => {
    const { migrator, recordSuccess } = createMigrator({
      findMany: () =>
        Promise.resolve([
          legacySmartCard({ cardUserId: 'legacy-card-user-1' }),
        ]),
      resolveTargetId: jest.fn().mockResolvedValue(null),
    });

    await migrator.migrate('job-1');

    expect(recordSuccess).toHaveBeenCalledWith(
      expect.objectContaining({
        note: 'OWNER_NOT_MIGRATED_CARD_UNASSIGNED',
      }),
    );
  });

  it('does not reject the card when a gallery image media transfer fails — it is just dropped from the gallery', async () => {
    const create = jest.fn().mockResolvedValue({});
    const transaction = jest
      .fn()
      .mockImplementation((fn: (tx: unknown) => Promise<unknown>) => {
        const tx = {
          smartCard: {
            create: jest.fn().mockResolvedValue({ id: 'smart-card-1' }),
          },
          smartCardGallery: {
            create: jest.fn().mockResolvedValue({ id: 'gallery-1' }),
          },
          smartCardGalleryImage: { create },
        };
        return fn(tx);
      });
    const { migrator, recordSuccess, recordRejected } = createMigrator({
      findMany: () =>
        Promise.resolve([
          legacySmartCard({
            galleries: [
              {
                id: 'legacy-gallery-1',
                title: 'Gallery',
                order: 0,
                images: [
                  {
                    id: 'legacy-image-1',
                    url: 'https://example.com/x.jpg',
                    mediaId: null,
                    order: 0,
                  },
                ],
              },
            ],
          }),
        ]),
      transfer: jest.fn().mockResolvedValue(null), // media transfer fails
      transaction,
    });

    await migrator.migrate('job-1');

    expect(create).not.toHaveBeenCalled(); // dropped, not created
    expect(recordRejected).not.toHaveBeenCalled();
    expect(recordSuccess).toHaveBeenCalled(); // card itself still succeeds
  });

  it('skips reprocessing and just touches the record when a prior SUCCESS exists', async () => {
    const { migrator, recordSuccess, touchExistingSuccess } = createMigrator({
      findExisting: jest.fn().mockResolvedValue({ status: 'SUCCESS' }),
    });

    await migrator.migrate('job-1');

    expect(recordSuccess).not.toHaveBeenCalled();
    expect(touchExistingSuccess).toHaveBeenCalledWith(
      'SMART_CARD',
      'SmartCard',
      'legacy-smart-card-1',
      'job-1',
    );
  });
});
