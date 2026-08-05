import { randomUUID } from 'crypto';
import { AppConfigService } from '../../../common/config/app-config.service';
import { PrismaService } from '../../../common/prisma/prisma.service';
import { MediaService } from '../../../common/media/media.service';
import { MediaSlotResolverService } from '../../../common/media/media-slot-resolver.service';
import {
  EmailSignatureSocialPlatform,
  EmailSignatureTemplateKey,
  MediaSource,
  PlanBusinessModelType,
} from '../../../generated/prisma/client';
import type {
  MediaStorageProvider,
  UploadMediaParams,
} from '../../../common/media/storage/media-storage-provider.interface';
import type { MediaStorageProviderRegistry } from '../../../common/media/storage/media-storage-provider-registry.provider';
import { PlanEnforcementService } from '../../plans/services/plan-enforcement.service';
import { PlanPolicyResolverService } from '../../plans/services/plan-policy-resolver.service';
import { EmailSignaturesService } from './email-signatures.service';
import type { CreateEmailSignatureDto } from '../dto/create-email-signature.dto';

class FakeMediaStorageProvider implements MediaStorageProvider {
  uploadedKeys: string[] = [];
  deletedKeys: string[] = [];

  upload(params: UploadMediaParams): Promise<void> {
    this.uploadedKeys.push(params.key);
    return Promise.resolve();
  }

  delete(key: string): Promise<void> {
    this.deletedKeys.push(key);
    return Promise.resolve();
  }

  getPublicUrl(key: string): string {
    return `/media/test-bucket/${key}`;
  }
}

function makeFile(name: string): Express.Multer.File {
  return {
    fieldname: name,
    originalname: `${name}.png`,
    mimetype: 'image/png',
    buffer: Buffer.from(name),
  } as Express.Multer.File;
}

// Checklist (enumerated before writing cases, per backend/CLAUDE.md):
// Happy path — create with only the required fields succeeds; create with
// every field plus 3 images plus social links round-trips and uploads
// exactly 3 files; update replacing one image deletes the old media and
// leaves the others untouched; update omitting an image field entirely
// preserves it unchanged; update replaces the social links list in order;
// delete removes the row and cleans up every attached media row; listing
// returns only the requesting customer's own signatures; preview renders
// without creating any row.
// Sad path — create blocked when the plan doesn't include email signatures;
// create blocked at the plan's signature limit; update's "keep" action
// rejects a mediaId that doesn't belong to this signature; getById on an
// unknown id 404s.
describe('EmailSignaturesService (integration, TEST_DATABASE_URL only)', () => {
  let prisma: PrismaService;
  let fakeProvider: FakeMediaStorageProvider;
  let service: EmailSignaturesService;
  let originalDatabaseUrl: string | undefined;
  const seededAccountIds: string[] = [];
  const seededEmployeeAccountIds: string[] = [];
  const seededPlanIds: string[] = [];

  beforeAll(() => {
    originalDatabaseUrl = process.env.DATABASE_URL;
    process.env.DATABASE_URL = process.env.TEST_DATABASE_URL;
    prisma = new PrismaService(new AppConfigService());
  });

  afterAll(async () => {
    await prisma.$disconnect();
    process.env.DATABASE_URL = originalDatabaseUrl;
  });

  beforeEach(() => {
    fakeProvider = new FakeMediaStorageProvider();
    const registry: MediaStorageProviderRegistry = {
      [MediaSource.MINIO]: fakeProvider,
    };
    const mediaService = new MediaService(prisma, registry);
    const mediaSlotResolver = new MediaSlotResolverService(mediaService);
    const planEnforcementService = new PlanEnforcementService(
      prisma,
      new PlanPolicyResolverService(prisma),
    );
    service = new EmailSignaturesService(
      prisma,
      mediaService,
      mediaSlotResolver,
      planEnforcementService,
      new AppConfigService(),
    );
  });

  afterEach(async () => {
    // Cascades: CustomerAccount -> Customer -> EmailSignature (-> SocialLink),
    // and -> PlanPurchaseHistory, per each model's onDelete: Cascade.
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

  async function seedCustomer(name = 'Test Customer') {
    const account = await prisma.customerAccount.create({
      data: {
        name,
        email: `email-signatures-${randomUUID()}@example.com`,
        emailVerified: true,
      },
    });
    seededAccountIds.push(account.id);
    return prisma.customer.create({ data: { accountId: account.id } });
  }

  async function seedPlan(
    overrides: { isAvailable?: boolean; maxEmailSignatures?: number } = {},
  ) {
    const plan = await prisma.plan.create({
      data: {
        name: `Test Plan ${randomUUID()}`,
        price: 0,
        businessModelType: PlanBusinessModelType.ONE_TIME,
        policy: {
          create: {
            ecardPolicy: {
              create: { isAvailable: true, maxEcards: 0 },
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
              create: {
                isAvailable: overrides.isAvailable ?? true,
                maxEmailSignatures: overrides.maxEmailSignatures ?? 5,
              },
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
        email: `email-signatures-employee-${randomUUID()}@example.com`,
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

  async function seedCustomerWithPlan(
    overrides: { isAvailable?: boolean; maxEmailSignatures?: number } = {},
  ) {
    const customer = await seedCustomer();
    const plan = await seedPlan(overrides);
    await assignPlan(customer.id, plan.id);
    return customer;
  }

  function minimalCreateDto(): CreateEmailSignatureDto {
    return {
      name: 'Work Signature',
      templateKey: EmailSignatureTemplateKey.MINIMAL,
      fullName: 'Jane Doe',
      socialLinks: [],
    };
  }

  describe('create', () => {
    it('creates a signature with only the required fields', async () => {
      const customer = await seedCustomerWithPlan();

      const created = await service.create(
        { ...minimalCreateDto(), customerId: customer.id },
        [],
      );

      expect(created.fullName).toBe('Jane Doe');
      expect(created.profileImageUrl).toBeNull();
      expect(created.socialLinks).toEqual([]);
      expect(created.generatedHtml).toContain('Jane Doe');
    });

    it('creates a signature with every field, 3 images, and social links', async () => {
      const customer = await seedCustomerWithPlan();

      const created = await service.create(
        {
          ...minimalCreateDto(),
          templateKey: EmailSignatureTemplateKey.MODERN,
          jobTitle: 'Engineer',
          company: 'Acme',
          email: 'jane@example.com',
          phone: '15551234567',
          website: 'https://example.com',
          address: '1 Main St',
          ctaText: 'Book a call',
          ctaUrl: 'https://example.com/book',
          profileImage: { action: 'upload' },
          companyLogo: { action: 'upload' },
          bannerImage: { action: 'upload' },
          socialLinks: [
            {
              platform: EmailSignatureSocialPlatform.LINKEDIN,
              url: 'https://linkedin.com/in/jane',
            },
            {
              platform: EmailSignatureSocialPlatform.WHATSAPP,
              phoneNumber: '919876543210',
            },
            {
              platform: EmailSignatureSocialPlatform.CUSTOM,
              url: 'https://example.com/blog',
              label: 'Blog',
            },
          ],
          customerId: customer.id,
        },
        [
          makeFile('profileImage'),
          makeFile('companyLogo'),
          makeFile('bannerImage'),
        ],
      );

      expect(created.profileImageUrl).not.toBeNull();
      expect(created.companyLogoUrl).not.toBeNull();
      expect(created.bannerImageUrl).not.toBeNull();
      expect(created.socialLinks).toHaveLength(3);
      // WhatsApp is entered as a phone number but persisted/returned as the
      // generated click-to-chat wa.me link, same {platform, url, label}
      // shape as every other platform.
      expect(created.socialLinks[1]).toEqual({
        platform: EmailSignatureSocialPlatform.WHATSAPP,
        url: 'https://wa.me/919876543210',
        label: null,
      });
      expect(created.socialLinks[2]).toEqual({
        platform: EmailSignatureSocialPlatform.CUSTOM,
        url: 'https://example.com/blog',
        label: 'Blog',
      });
      expect(created.generatedHtml).toContain('https://wa.me/919876543210');
      expect(fakeProvider.uploadedKeys).toHaveLength(3);

      // A signature is copied/downloaded out of the app entirely (into an
      // email client, or a standalone .html file) — every image reference
      // must be a fully-qualified absolute URL, not the relative path
      // MediaService.getPublicUrl() returns for in-app use, since there's no
      // "current origin" for a relative URL to resolve against once it
      // leaves the app.
      expect(created.profileImageUrl).toMatch(/^https?:\/\//);
      expect(created.companyLogoUrl).toMatch(/^https?:\/\//);
      expect(created.bannerImageUrl).toMatch(/^https?:\/\//);
      expect(created.generatedHtml).not.toContain('src="/media/');
      expect(created.generatedHtml).toMatch(/src="https?:\/\/[^"]*\/media\//);
    });

    it('blocks creation when the plan does not include email signatures', async () => {
      const customer = await seedCustomerWithPlan({ isAvailable: false });

      await expect(
        service.create({ ...minimalCreateDto(), customerId: customer.id }, []),
      ).rejects.toThrow(
        "This customer's plan does not include email signatures",
      );
    });

    it('blocks creation once the plan limit is reached', async () => {
      const customer = await seedCustomerWithPlan({ maxEmailSignatures: 1 });
      await service.create(
        { ...minimalCreateDto(), customerId: customer.id },
        [],
      );

      await expect(
        service.create({ ...minimalCreateDto(), customerId: customer.id }, []),
      ).rejects.toThrow(
        "This customer's plan has reached its email signature limit",
      );
    });
  });

  describe('update', () => {
    it('replacing one image slot deletes the old media and leaves the others untouched', async () => {
      const customer = await seedCustomerWithPlan();
      const created = await service.create(
        {
          ...minimalCreateDto(),
          profileImage: { action: 'upload' },
          companyLogo: { action: 'upload' },
          customerId: customer.id,
        },
        [makeFile('profileImage'), makeFile('companyLogo')],
      );
      const oldProfileMediaId = created.profileImageMediaId!;
      const oldCompanyLogoMediaId = created.companyLogoMediaId!;

      const updated = await service.update(
        created.id,
        { profileImage: { action: 'upload' } },
        [makeFile('profileImage')],
      );

      expect(updated.profileImageMediaId).not.toBe(oldProfileMediaId);
      expect(updated.companyLogoMediaId).toBe(oldCompanyLogoMediaId);
      await expect(
        prisma.media.findUnique({ where: { id: oldProfileMediaId } }),
      ).resolves.toBeNull();
      await expect(
        prisma.media.findUnique({ where: { id: oldCompanyLogoMediaId } }),
      ).resolves.not.toBeNull();
    });

    it('omitting an image field entirely preserves it unchanged (not orphaned)', async () => {
      const customer = await seedCustomerWithPlan();
      const created = await service.create(
        {
          ...minimalCreateDto(),
          profileImage: { action: 'upload' },
          customerId: customer.id,
        },
        [makeFile('profileImage')],
      );
      const mediaId = created.profileImageMediaId!;

      const updated = await service.update(
        created.id,
        { fullName: 'Jane Smith' },
        [],
      );

      expect(updated.profileImageMediaId).toBe(mediaId);
      await expect(
        prisma.media.findUnique({ where: { id: mediaId } }),
      ).resolves.not.toBeNull();
    });

    it('rejects "keep" with a mediaId that does not belong to this signature', async () => {
      const customer = await seedCustomerWithPlan();
      const other = await service.create(
        {
          ...minimalCreateDto(),
          profileImage: { action: 'upload' },
          customerId: customer.id,
        },
        [makeFile('profileImage')],
      );
      const created = await service.create(
        { ...minimalCreateDto(), customerId: customer.id },
        [],
      );

      await expect(
        service.update(
          created.id,
          {
            profileImage: {
              action: 'keep',
              mediaId: other.profileImageMediaId!,
            },
          },
          [],
        ),
      ).rejects.toThrow();
    });

    it('replaces the social links list in order', async () => {
      const customer = await seedCustomerWithPlan();
      const created = await service.create(
        {
          ...minimalCreateDto(),
          socialLinks: [
            {
              platform: EmailSignatureSocialPlatform.LINKEDIN,
              url: 'https://linkedin.com/in/jane',
            },
          ],
          customerId: customer.id,
        },
        [],
      );

      const updated = await service.update(
        created.id,
        {
          socialLinks: [
            {
              platform: EmailSignatureSocialPlatform.WEBSITE,
              url: 'https://example.com',
            },
            {
              platform: EmailSignatureSocialPlatform.GITHUB,
              url: 'https://github.com/jane',
            },
          ],
        },
        [],
      );

      expect(updated.socialLinks.map((link) => link.platform)).toEqual([
        EmailSignatureSocialPlatform.WEBSITE,
        EmailSignatureSocialPlatform.GITHUB,
      ]);
    });
  });

  describe('delete', () => {
    it('removes the row and cleans up every attached media row', async () => {
      const customer = await seedCustomerWithPlan();
      const created = await service.create(
        {
          ...minimalCreateDto(),
          profileImage: { action: 'upload' },
          companyLogo: { action: 'upload' },
          bannerImage: { action: 'upload' },
          customerId: customer.id,
        },
        [
          makeFile('profileImage'),
          makeFile('companyLogo'),
          makeFile('bannerImage'),
        ],
      );

      await service.delete(created.id);

      await expect(service.getById(created.id)).rejects.toThrow();
      await expect(
        prisma.media.findUnique({
          where: { id: created.profileImageMediaId! },
        }),
      ).resolves.toBeNull();
      await expect(
        prisma.media.findUnique({ where: { id: created.companyLogoMediaId! } }),
      ).resolves.toBeNull();
      await expect(
        prisma.media.findUnique({ where: { id: created.bannerImageMediaId! } }),
      ).resolves.toBeNull();
    });
  });

  describe('listForCustomer', () => {
    it('returns only the requesting customer’s own signatures', async () => {
      const customerA = await seedCustomerWithPlan();
      const customerB = await seedCustomerWithPlan();
      await service.create(
        { ...minimalCreateDto(), customerId: customerA.id },
        [],
      );
      await service.create(
        { ...minimalCreateDto(), customerId: customerB.id },
        [],
      );

      const listA = await service.listForCustomer(customerA.id);
      expect(listA).toHaveLength(1);
      expect(listA[0].customerId).toBe(customerA.id);
    });
  });

  describe('getById', () => {
    it('404s for an unknown id', async () => {
      await expect(service.getById(randomUUID())).rejects.toThrow(
        'Email signature not found',
      );
    });
  });

  describe('renderPreview', () => {
    it('renders html without creating any row', async () => {
      const customer = await seedCustomerWithPlan();
      const before = await prisma.emailSignature.count({
        where: { customerId: customer.id },
      });

      const result = service.renderPreview({
        templateKey: EmailSignatureTemplateKey.CORPORATE,
        fullName: 'Preview Person',
        socialLinks: [],
      });

      const after = await prisma.emailSignature.count({
        where: { customerId: customer.id },
      });
      expect(result.html).toContain('Preview Person');
      expect(after).toBe(before);
    });
  });
});
