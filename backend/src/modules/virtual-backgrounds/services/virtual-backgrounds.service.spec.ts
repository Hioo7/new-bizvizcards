import { randomUUID } from 'crypto';
import sharp from 'sharp';
import { NotFoundException } from '@nestjs/common';
import { AppConfigService } from '../../../common/config/app-config.service';
import { PrismaService } from '../../../common/prisma/prisma.service';
import { MediaService } from '../../../common/media/media.service';
import {
  ECardEventType,
  ECardTrafficSource,
  MediaSource,
  PlanBusinessModelType,
  VirtualBackgroundQrCorner,
} from '../../../generated/prisma/client';
import type { MediaStorageProviderRegistry } from '../../../common/media/storage/media-storage-provider-registry.provider';
import type {
  MediaStorageProvider,
  UploadMediaParams,
} from '../../../common/media/storage/media-storage-provider.interface';
import { PlanEnforcementService } from '../../plans/services/plan-enforcement.service';
import { PlanPolicyResolverService } from '../../plans/services/plan-policy-resolver.service';
import { VirtualBackgroundComposerService } from './virtual-background-composer.service';
import { VirtualBackgroundTemplatesService } from './virtual-background-templates.service';
import { VirtualBackgroundsService } from './virtual-backgrounds.service';
import {
  VIRTUAL_BACKGROUND_HEIGHT_PX,
  VIRTUAL_BACKGROUND_WIDTH_PX,
} from '../virtual-backgrounds.constants';

// Happy paths: listAvailableTemplates returns only whitelisted templates;
// createForCustomer from a TEMPLATE source composes and persists; same for a
// CUSTOM source when the plan allows it; remove deletes an owned background.
// Sad paths: creating from a non-whitelisted template is blocked; creating a
// custom background is blocked when the plan disallows it; creating past the
// plan's limit is blocked; removing another customer's background 404s.

class FakeMediaStorageProvider implements MediaStorageProvider {
  private readonly stored = new Map<string, Buffer>();

  upload(params: UploadMediaParams): Promise<void> {
    this.stored.set(params.key, params.buffer);
    return Promise.resolve();
  }

  download(key: string): Promise<Buffer> {
    return Promise.resolve(this.stored.get(key) ?? Buffer.alloc(0));
  }

  delete(key: string): Promise<void> {
    this.stored.delete(key);
    return Promise.resolve();
  }

  getPublicUrl(key: string): string {
    return `/media/test-bucket/${key}`;
  }
}

async function solidImageBuffer(): Promise<Buffer> {
  return sharp({
    create: {
      width: VIRTUAL_BACKGROUND_WIDTH_PX,
      height: VIRTUAL_BACKGROUND_HEIGHT_PX,
      channels: 3,
      background: { r: 10, g: 20, b: 30 },
    },
  })
    .png()
    .toBuffer();
}

function makeImageFile(buffer: Buffer): Express.Multer.File {
  return {
    buffer,
    originalname: 'custom.png',
    mimetype: 'image/png',
    size: buffer.length,
  } as Express.Multer.File;
}

describe('VirtualBackgroundsService (integration, TEST_DATABASE_URL only)', () => {
  let prisma: PrismaService;
  let mediaService: MediaService;
  let templatesService: VirtualBackgroundTemplatesService;
  let composerService: VirtualBackgroundComposerService;
  let service: VirtualBackgroundsService;
  let originalDatabaseUrl: string | undefined;
  const seededAccountIds: string[] = [];
  const seededPlanIds: string[] = [];
  const seededEmployeeAccountIds: string[] = [];
  const seededMediaIds: string[] = [];

  beforeAll(() => {
    originalDatabaseUrl = process.env.DATABASE_URL;
    process.env.DATABASE_URL = process.env.TEST_DATABASE_URL;

    const appConfig = new AppConfigService();
    prisma = new PrismaService(appConfig);
    const registry: MediaStorageProviderRegistry = {
      [MediaSource.MINIO]: new FakeMediaStorageProvider(),
    };
    mediaService = new MediaService(prisma, registry);
    const policyResolver = new PlanPolicyResolverService(prisma);
    const planEnforcement = new PlanEnforcementService(prisma, policyResolver);
    templatesService = new VirtualBackgroundTemplatesService(
      prisma,
      mediaService,
    );
    composerService = new VirtualBackgroundComposerService();
    service = new VirtualBackgroundsService(
      prisma,
      mediaService,
      appConfig,
      planEnforcement,
      policyResolver,
      composerService,
      templatesService,
    );
  });

  afterAll(async () => {
    await prisma.$disconnect();
    process.env.DATABASE_URL = originalDatabaseUrl;
  });

  afterEach(async () => {
    jest.restoreAllMocks();
    if (seededMediaIds.length > 0) {
      await prisma.media.deleteMany({ where: { id: { in: seededMediaIds } } });
      seededMediaIds.length = 0;
    }
    if (seededAccountIds.length > 0) {
      await prisma.customerAccount.deleteMany({
        where: { id: { in: seededAccountIds } },
      });
      seededAccountIds.length = 0;
    }
    if (seededEmployeeAccountIds.length > 0) {
      await prisma.employeeAccount.deleteMany({
        where: { id: { in: seededEmployeeAccountIds } },
      });
      seededEmployeeAccountIds.length = 0;
    }
    if (seededPlanIds.length > 0) {
      await prisma.plan.deleteMany({ where: { id: { in: seededPlanIds } } });
      seededPlanIds.length = 0;
    }
  });

  async function createTemplate(name: string) {
    const template = await templatesService.create(
      { name },
      makeImageFile(await solidImageBuffer()),
    );
    seededMediaIds.push(
      (
        await prisma.virtualBackgroundTemplate.findUniqueOrThrow({
          where: { id: template.id },
        })
      ).mediaId,
    );
    return template;
  }

  async function seedCustomer() {
    const account = await prisma.customerAccount.create({
      data: {
        name: 'Test Customer',
        email: `virtual-backgrounds-${randomUUID()}@example.com`,
        emailVerified: true,
      },
    });
    seededAccountIds.push(account.id);
    return prisma.customer.create({ data: { accountId: account.id } });
  }

  async function seedPlan(overrides: {
    isAvailable?: boolean;
    maxVirtualBackgrounds?: number;
    allowCustomBackground?: boolean;
    whitelistedTemplateIds?: string[];
  }) {
    const plan = await prisma.plan.create({
      data: {
        name: `Test Plan ${randomUUID()}`,
        price: 0,
        businessModelType: PlanBusinessModelType.ONE_TIME,
        policy: {
          create: {
            ecardPolicy: {
              create: { isAvailable: true, maxEcards: 5 },
            },
            smartCardPolicy: {
              create: { isAvailable: true, maxSmartCards: 0 },
            },
            organisationPolicy: {
              create: {
                isAvailable: true,
                maxOrgsCanJoin: 0,
                maxOrgsCanCreate: 0,
                orgEcardPolicy: { create: { isAvailable: true, maxEcards: 0 } },
                orgSmartCardPolicy: {
                  create: { isAvailable: true, maxSmartCards: 0 },
                },
              },
            },
            eventPolicy: {
              create: { isAvailable: true, maxEvents: 0, maxGuestsPerEvent: 0 },
            },
            emailSignaturePolicy: {
              create: { isAvailable: true, maxEmailSignatures: 0 },
            },
            virtualBackgroundPolicy: {
              create: {
                isAvailable: overrides.isAvailable ?? true,
                maxVirtualBackgrounds: overrides.maxVirtualBackgrounds ?? 2,
                allowCustomBackground: overrides.allowCustomBackground ?? false,
                whitelistedTemplates: {
                  create: (overrides.whitelistedTemplateIds ?? []).map(
                    (templateId) => ({ templateId }),
                  ),
                },
              },
            },
            bulkMessengerPolicy: {
              create: { isAvailable: false, maxTemplates: 0 },
            },
          },
        },
      },
    });
    seededPlanIds.push(plan.id);
    return plan;
  }

  async function assignPlan(customerId: string, planId: string) {
    const employeeAccount = await prisma.employeeAccount.create({
      data: {
        name: 'Assigning Employee',
        email: `virtual-backgrounds-employee-${randomUUID()}@example.com`,
        emailVerified: true,
        role: 'admin',
      },
    });
    seededEmployeeAccountIds.push(employeeAccount.id);
    const employee = await prisma.employee.create({
      data: { accountId: employeeAccount.id },
    });
    await prisma.customer.update({
      where: { id: customerId },
      data: { currentPlanId: planId },
    });
    await prisma.planPurchaseHistory.create({
      data: {
        customerId,
        planId,
        assignedByEmployeeId: employee.id,
        expiresAt: null,
        businessModelTypeAtPurchase: PlanBusinessModelType.ONE_TIME,
      },
    });
  }

  async function seedEcard(customerId: string) {
    return prisma.eCard.create({
      data: {
        customerId,
        endpoint: `vb-test-${randomUUID()}`,
        heroName: 'Test',
        heroEmail: 'test@example.com',
      },
    });
  }

  it('lists only the templates whitelisted for the customer plan', async () => {
    const allowed = await createTemplate('Allowed');
    await createTemplate('Not Allowed');
    const customer = await seedCustomer();
    const plan = await seedPlan({ whitelistedTemplateIds: [allowed.id] });
    await assignPlan(customer.id, plan.id);

    const templates = await service.listAvailableTemplates(customer.id);

    expect(templates.map((t) => t.id)).toEqual([allowed.id]);
  });

  it('creates a virtual background from a whitelisted template', async () => {
    const template = await createTemplate('Office');
    const customer = await seedCustomer();
    const plan = await seedPlan({ whitelistedTemplateIds: [template.id] });
    await assignPlan(customer.id, plan.id);
    const ecard = await seedEcard(customer.id);

    const result = await service.createForCustomer(
      customer.id,
      {
        source: 'TEMPLATE',
        templateId: template.id,
        ecardId: ecard.id,
        qrCorner: VirtualBackgroundQrCorner.BOTTOM_RIGHT,
      },
      undefined,
    );
    seededMediaIds.push(
      (
        await prisma.virtualBackground.findUniqueOrThrow({
          where: { id: result.id },
        })
      ).composedMediaId,
    );

    expect(result.ecardId).toBe(ecard.id);
    expect(result.imageUrl).toContain('/media/test-bucket/');
  });

  it('blocks creating from a template that is not whitelisted for the plan', async () => {
    const template = await createTemplate('Not Whitelisted');
    const customer = await seedCustomer();
    const plan = await seedPlan({ whitelistedTemplateIds: [] });
    await assignPlan(customer.id, plan.id);
    const ecard = await seedEcard(customer.id);

    await expect(
      service.createForCustomer(
        customer.id,
        {
          source: 'TEMPLATE',
          templateId: template.id,
          ecardId: ecard.id,
          qrCorner: VirtualBackgroundQrCorner.BOTTOM_RIGHT,
        },
        undefined,
      ),
    ).rejects.toThrow(
      "This customer's plan does not include this virtual background template",
    );
  });

  it('creates a virtual background from a custom upload when the plan allows it', async () => {
    const customer = await seedCustomer();
    const plan = await seedPlan({ allowCustomBackground: true });
    await assignPlan(customer.id, plan.id);
    const ecard = await seedEcard(customer.id);

    const result = await service.createForCustomer(
      customer.id,
      {
        source: 'CUSTOM',
        ecardId: ecard.id,
        qrCorner: VirtualBackgroundQrCorner.TOP_LEFT,
        captionText: 'Scan me',
      },
      makeImageFile(await solidImageBuffer()),
    );
    const created = await prisma.virtualBackground.findUniqueOrThrow({
      where: { id: result.id },
    });
    seededMediaIds.push(created.composedMediaId);
    if (created.customBaseMediaId) {
      seededMediaIds.push(created.customBaseMediaId);
    }

    expect(result.captionText).toBe('Scan me');
  });

  it('blocks a custom upload when the plan does not allow custom backgrounds', async () => {
    const customer = await seedCustomer();
    const plan = await seedPlan({ allowCustomBackground: false });
    await assignPlan(customer.id, plan.id);
    const ecard = await seedEcard(customer.id);

    await expect(
      service.createForCustomer(
        customer.id,
        {
          source: 'CUSTOM',
          ecardId: ecard.id,
          qrCorner: VirtualBackgroundQrCorner.TOP_LEFT,
        },
        makeImageFile(await solidImageBuffer()),
      ),
    ).rejects.toThrow(
      "This customer's plan does not allow uploading a custom virtual background",
    );
  });

  it('blocks creating past the plan virtual background limit', async () => {
    const template = await createTemplate('Capped');
    const customer = await seedCustomer();
    const plan = await seedPlan({
      maxVirtualBackgrounds: 1,
      whitelistedTemplateIds: [template.id],
    });
    await assignPlan(customer.id, plan.id);
    const ecard = await seedEcard(customer.id);
    const first = await service.createForCustomer(
      customer.id,
      {
        source: 'TEMPLATE',
        templateId: template.id,
        ecardId: ecard.id,
        qrCorner: VirtualBackgroundQrCorner.BOTTOM_RIGHT,
      },
      undefined,
    );
    seededMediaIds.push(
      (
        await prisma.virtualBackground.findUniqueOrThrow({
          where: { id: first.id },
        })
      ).composedMediaId,
    );

    await expect(
      service.createForCustomer(
        customer.id,
        {
          source: 'TEMPLATE',
          templateId: template.id,
          ecardId: ecard.id,
          qrCorner: VirtualBackgroundQrCorner.BOTTOM_RIGHT,
        },
        undefined,
      ),
    ).rejects.toThrow(
      "This customer's plan has reached its virtual background limit",
    );
  });

  it("404s when removing another customer's virtual background", async () => {
    const template = await createTemplate('Owned By Someone Else');
    const owner = await seedCustomer();
    const stranger = await seedCustomer();
    const plan = await seedPlan({ whitelistedTemplateIds: [template.id] });
    await assignPlan(owner.id, plan.id);
    const ecard = await seedEcard(owner.id);
    const created = await service.createForCustomer(
      owner.id,
      {
        source: 'TEMPLATE',
        templateId: template.id,
        ecardId: ecard.id,
        qrCorner: VirtualBackgroundQrCorner.BOTTOM_RIGHT,
      },
      undefined,
    );
    seededMediaIds.push(
      (
        await prisma.virtualBackground.findUniqueOrThrow({
          where: { id: created.id },
        })
      ).composedMediaId,
    );

    await expect(
      service.removeForCustomer(stranger.id, created.id),
    ).rejects.toThrow(NotFoundException);
  });

  it('removes an owned virtual background', async () => {
    const template = await createTemplate('To Delete');
    const customer = await seedCustomer();
    const plan = await seedPlan({ whitelistedTemplateIds: [template.id] });
    await assignPlan(customer.id, plan.id);
    const ecard = await seedEcard(customer.id);
    const created = await service.createForCustomer(
      customer.id,
      {
        source: 'TEMPLATE',
        templateId: template.id,
        ecardId: ecard.id,
        qrCorner: VirtualBackgroundQrCorner.BOTTOM_RIGHT,
      },
      undefined,
    );

    await service.removeForCustomer(customer.id, created.id);

    const found = await prisma.virtualBackground.findUnique({
      where: { id: created.id },
    });
    expect(found).toBeNull();
  });

  function daysAgo(days: number): Date {
    return new Date(Date.now() - days * 86_400_000);
  }

  // Full setup for a single tracked virtual background: whitelisted template,
  // customer on a plan that allows it, an e-card, and the composed row.
  async function createTrackedVb() {
    const template = await createTemplate(`Tracked ${randomUUID()}`);
    const customer = await seedCustomer();
    const plan = await seedPlan({ whitelistedTemplateIds: [template.id] });
    await assignPlan(customer.id, plan.id);
    const ecard = await seedEcard(customer.id);
    const vb = await service.createForCustomer(
      customer.id,
      {
        source: 'TEMPLATE',
        templateId: template.id,
        ecardId: ecard.id,
        qrCorner: VirtualBackgroundQrCorner.BOTTOM_RIGHT,
      },
      undefined,
    );
    seededMediaIds.push(
      (
        await prisma.virtualBackground.findUniqueOrThrow({
          where: { id: vb.id },
        })
      ).composedMediaId,
    );
    return { customer, ecard, vb };
  }

  async function seedEcardEvent(
    ecardId: string,
    type: ECardEventType,
    options: {
      source?: ECardTrafficSource;
      sourceRefId?: string | null;
      createdAt?: Date;
    } = {},
  ) {
    await prisma.eCardEvent.create({
      data: {
        ecardId,
        type,
        source: options.source ?? ECardTrafficSource.VIRTUAL_BACKGROUND,
        sourceRefId:
          options.sourceRefId === undefined ? null : options.sourceRefId,
        createdAt: options.createdAt ?? new Date(),
      },
    });
  }

  describe('createForCustomer QR attribution', () => {
    it('bakes ?src=virtual-background&sref=<new row id> into the QR URL', async () => {
      const template = await createTemplate('QR params');
      const customer = await seedCustomer();
      const plan = await seedPlan({ whitelistedTemplateIds: [template.id] });
      await assignPlan(customer.id, plan.id);
      const ecard = await seedEcard(customer.id);
      const composeSpy = jest.spyOn(composerService, 'compose');

      const vb = await service.createForCustomer(
        customer.id,
        {
          source: 'TEMPLATE',
          templateId: template.id,
          ecardId: ecard.id,
          qrCorner: VirtualBackgroundQrCorner.BOTTOM_RIGHT,
        },
        undefined,
      );
      seededMediaIds.push(
        (
          await prisma.virtualBackground.findUniqueOrThrow({
            where: { id: vb.id },
          })
        ).composedMediaId,
      );

      const composedUrl = new URL(composeSpy.mock.calls[0][0].ecardUrl);
      expect(composedUrl.pathname.endsWith(`/ecard/${ecard.endpoint}`)).toBe(
        true,
      );
      expect(composedUrl.searchParams.get('src')).toBe('virtual-background');
      expect(composedUrl.searchParams.get('sref')).toBe(vb.id);
    });
  });

  describe('getAnalyticsForCustomer', () => {
    it('returns zeroed totals and an empty list when the customer has no virtual backgrounds', async () => {
      const customer = await seedCustomer();

      const result = await service.getAnalyticsForCustomer(customer.id, {});

      expect(result.totals).toEqual({ views: 0, exchangeContacts: 0 });
      expect(result.perBackground).toEqual([]);
      expect(result.dailyCounts.length).toBeGreaterThan(0);
      expect(
        result.dailyCounts.every(
          (day) => day.views === 0 && day.exchangeContacts === 0,
        ),
      ).toBe(true);
    });

    it('counts VIEW and EXCHANGE_CONTACT events attributed to the virtual background', async () => {
      const { customer, ecard, vb } = await createTrackedVb();
      await seedEcardEvent(ecard.id, ECardEventType.VIEW, {
        sourceRefId: vb.id,
      });
      await seedEcardEvent(ecard.id, ECardEventType.VIEW, {
        sourceRefId: vb.id,
      });
      await seedEcardEvent(ecard.id, ECardEventType.EXCHANGE_CONTACT, {
        sourceRefId: vb.id,
      });

      const result = await service.getAnalyticsForCustomer(customer.id, {});

      expect(result.totals).toEqual({ views: 2, exchangeContacts: 1 });
      expect(
        result.perBackground.find((r) => r.virtualBackgroundId === vb.id),
      ).toMatchObject({ views: 2, exchangeContacts: 1, ecardId: ecard.id });
    });

    it("ignores DIRECT events, bogus sourceRefIds, and another customer's data — the background still lists with zeros", async () => {
      const { customer, ecard, vb } = await createTrackedVb();
      const other = await createTrackedVb();
      await seedEcardEvent(ecard.id, ECardEventType.VIEW, {
        source: ECardTrafficSource.DIRECT,
        sourceRefId: vb.id,
      });
      await seedEcardEvent(ecard.id, ECardEventType.VIEW, {
        sourceRefId: randomUUID(),
      });
      await seedEcardEvent(other.ecard.id, ECardEventType.VIEW, {
        sourceRefId: other.vb.id,
      });

      const result = await service.getAnalyticsForCustomer(customer.id, {});

      expect(result.totals).toEqual({ views: 0, exchangeContacts: 0 });
      expect(
        result.perBackground.find((r) => r.virtualBackgroundId === vb.id),
      ).toMatchObject({ views: 0, exchangeContacts: 0 });
    });

    it('excludes events outside the requested window', async () => {
      const { customer, ecard, vb } = await createTrackedVb();
      await seedEcardEvent(ecard.id, ECardEventType.VIEW, {
        sourceRefId: vb.id,
        createdAt: daysAgo(40),
      });

      const result = await service.getAnalyticsForCustomer(customer.id, {});

      expect(result.totals.views).toBe(0);
    });
  });

  describe('recomposeComposedImage', () => {
    it('re-renders the composed image, repoints the row, and drops the previous media', async () => {
      const { vb } = await createTrackedVb();
      const before = await prisma.virtualBackground.findUniqueOrThrow({
        where: { id: vb.id },
      });

      await service.recomposeComposedImage(vb.id);

      const after = await prisma.virtualBackground.findUniqueOrThrow({
        where: { id: vb.id },
      });
      seededMediaIds.push(after.composedMediaId);
      expect(after.composedMediaId).not.toBe(before.composedMediaId);
      expect(
        await prisma.media.findUnique({
          where: { id: before.composedMediaId },
        }),
      ).toBeNull();
    });
  });
});
