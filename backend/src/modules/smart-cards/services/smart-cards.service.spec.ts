import { randomUUID } from 'crypto';
import { AppConfigService } from '../../../common/config/app-config.service';
import { PrismaService } from '../../../common/prisma/prisma.service';
import { ImageMediaService } from '../../../common/media/image-media.service';
import {
  ImageSource,
  SmartCardTemplateKey,
} from '../../../generated/prisma/client';
import type {
  ImageStorageProvider,
  UploadImageParams,
} from '../../../common/media/storage/image-storage-provider.interface';
import type { ImageStorageProviderRegistry } from '../../../common/media/storage/image-storage-provider-registry.provider';
import { SmartCardsService } from './smart-cards.service';
import type { CreateSmartCardDto } from '../dto/create-smart-card.dto';

class FakeImageStorageProvider implements ImageStorageProvider {
  uploadedKeys: string[] = [];
  deletedKeys: string[] = [];

  upload(params: UploadImageParams): Promise<void> {
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

describe('SmartCardsService (integration, TEST_DATABASE_URL only)', () => {
  let prisma: PrismaService;
  let appConfig: AppConfigService;
  let fakeProvider: FakeImageStorageProvider;
  let service: SmartCardsService;
  let originalDatabaseUrl: string | undefined;
  const seededAccountIds: string[] = [];
  const seededCardIds: string[] = [];

  beforeAll(async () => {
    originalDatabaseUrl = process.env.DATABASE_URL;
    process.env.DATABASE_URL = process.env.TEST_DATABASE_URL;

    appConfig = new AppConfigService();
    prisma = new PrismaService(appConfig);

    for (const key of Object.values(SmartCardTemplateKey)) {
      await prisma.smartCardTemplate.upsert({
        where: { key },
        update: {},
        create: { key, name: key },
      });
    }
  });

  afterAll(async () => {
    await prisma.$disconnect();
    process.env.DATABASE_URL = originalDatabaseUrl;
  });

  beforeEach(() => {
    fakeProvider = new FakeImageStorageProvider();
    const registry: ImageStorageProviderRegistry = {
      [ImageSource.MINIO]: fakeProvider,
    };
    const imageMediaService = new ImageMediaService(prisma, registry);
    service = new SmartCardsService(prisma, imageMediaService);
  });

  afterEach(async () => {
    if (seededCardIds.length > 0) {
      await prisma.smartCard.deleteMany({
        where: { id: { in: seededCardIds } },
      });
      seededCardIds.length = 0;
    }
    if (seededAccountIds.length > 0) {
      await prisma.employeeAccount.deleteMany({
        where: { id: { in: seededAccountIds } },
      });
      seededAccountIds.length = 0;
    }
  });

  // Returns the EmployeeAccount id (what request.employeeSession.user.id
  // actually is) — SmartCardsService.create resolves this to the Employee
  // business-row id internally, mirroring how CustomersService resolves a
  // CustomerAccount id to its Customer row.
  async function seedEmployee(): Promise<string> {
    const account = await prisma.employeeAccount.create({
      data: {
        name: 'Test Employee',
        email: `smart-cards-${randomUUID()}@example.com`,
        emailVerified: true,
        role: 'employee',
      },
    });
    seededAccountIds.push(account.id);
    await prisma.employee.create({
      data: { accountId: account.id },
    });
    return account.id;
  }

  function minimalCreateDto(endpointSuffix: string): CreateSmartCardDto {
    return {
      endpoint: `test-card-${endpointSuffix}`,
      services: [],
      testimonials: [],
      galleries: [],
    };
  }

  describe('create', () => {
    it('creates a standalone card with no images', async () => {
      const employeeId = await seedEmployee();

      const created = await service.create(
        SmartCardTemplateKey.INTERIOR_DESIGN_TEMPLATE,
        employeeId,
        minimalCreateDto(randomUUID()),
        [],
      );
      seededCardIds.push(created.id);

      expect(created.customerId).toBeNull();
      expect(created.profile).toBeNull();
      expect(created.services).toEqual([]);
    });

    it('creates a card with a profile logo and one service image, uploading via the media pipeline', async () => {
      const employeeId = await seedEmployee();
      const endpoint = `test-card-${randomUUID()}`;

      const created = await service.create(
        SmartCardTemplateKey.INTERIOR_DESIGN_TEMPLATE,
        employeeId,
        {
          endpoint,
          profile: { companyName: 'Acme', logo: { action: 'upload' } },
          services: [{ title: 'Service A', image: { action: 'upload' } }],
          testimonials: [],
          galleries: [],
        },
        [makeFile('profileLogo'), makeFile('serviceImage_0')],
      );
      seededCardIds.push(created.id);

      expect(created.profile?.companyName).toBe('Acme');
      expect(created.profile?.logoUrl).not.toBeNull();
      expect(created.services).toHaveLength(1);
      expect(created.services[0].imageUrl).not.toBeNull();
      expect(fakeProvider.uploadedKeys).toHaveLength(2);
    });

    it('rejects creating a card with a duplicate endpoint', async () => {
      const employeeId = await seedEmployee();
      const endpoint = `test-card-${randomUUID()}`;
      const first = await service.create(
        SmartCardTemplateKey.INTERIOR_DESIGN_TEMPLATE,
        employeeId,
        minimalCreateDto(endpoint.slice(10)),
        [],
      );
      seededCardIds.push(first.id);
      // Reuse the exact same endpoint deliberately.
      await prisma.smartCard.update({
        where: { id: first.id },
        data: { endpoint },
      });

      await expect(
        service.create(
          SmartCardTemplateKey.INTERIOR_DESIGN_TEMPLATE,
          employeeId,
          { endpoint, services: [], testimonials: [], galleries: [] },
          [],
        ),
      ).rejects.toThrow();
    });
  });

  describe('getById / cross-template isolation', () => {
    it('a card created under one template 404s when fetched via a different template', async () => {
      const employeeId = await seedEmployee();
      const created = await service.create(
        SmartCardTemplateKey.INTERIOR_DESIGN_TEMPLATE,
        employeeId,
        minimalCreateDto(randomUUID()),
        [],
      );
      seededCardIds.push(created.id);

      await expect(
        service.getById(
          SmartCardTemplateKey.INTERIOR_DESIGN_TEMPLATE_2,
          created.id,
        ),
      ).rejects.toThrow();

      const found = await service.getById(
        SmartCardTemplateKey.INTERIOR_DESIGN_TEMPLATE,
        created.id,
      );
      expect(found.id).toBe(created.id);
    });
  });

  describe('update', () => {
    it('replaces the logo image, deleting the old media', async () => {
      const employeeId = await seedEmployee();
      const created = await service.create(
        SmartCardTemplateKey.INTERIOR_DESIGN_TEMPLATE,
        employeeId,
        {
          endpoint: `test-card-${randomUUID()}`,
          profile: { companyName: 'Acme', logo: { action: 'upload' } },
          services: [],
          testimonials: [],
          galleries: [],
        },
        [makeFile('profileLogo')],
      );
      seededCardIds.push(created.id);
      const firstMediaId = created.profile?.logoMediaId as string;

      const updated = await service.update(
        SmartCardTemplateKey.INTERIOR_DESIGN_TEMPLATE,
        created.id,
        {
          profile: { companyName: 'Acme', logo: { action: 'upload' } },
        },
        [makeFile('profileLogo')],
      );

      expect(updated.profile?.logoMediaId).not.toBe(firstMediaId);
      const oldMedia = await prisma.imageMedia.findUnique({
        where: { id: firstMediaId },
      });
      expect(oldMedia).toBeNull();
    });

    it('keeps an existing image via {action:"keep"} while another slot is dropped', async () => {
      const employeeId = await seedEmployee();
      const created = await service.create(
        SmartCardTemplateKey.INTERIOR_DESIGN_TEMPLATE,
        employeeId,
        {
          endpoint: `test-card-${randomUUID()}`,
          services: [
            { title: 'Keep me', image: { action: 'upload' } },
            { title: 'Drop me', image: { action: 'upload' } },
          ],
          testimonials: [],
          galleries: [],
        },
        [makeFile('serviceImage_0'), makeFile('serviceImage_1')],
      );
      seededCardIds.push(created.id);
      const keepMediaId = created.services[0].imageMediaId as string;
      const dropMediaId = created.services[1].imageMediaId as string;

      const updated = await service.update(
        SmartCardTemplateKey.INTERIOR_DESIGN_TEMPLATE,
        created.id,
        {
          services: [
            {
              title: 'Keep me',
              image: { action: 'keep', mediaId: keepMediaId },
            },
          ],
          testimonials: [],
          galleries: [],
        },
        [],
      );

      expect(updated.services).toHaveLength(1);
      expect(updated.services[0].imageMediaId).toBe(keepMediaId);
      const dropMedia = await prisma.imageMedia.findUnique({
        where: { id: dropMediaId },
      });
      expect(dropMedia).toBeNull();
    });

    it('rejects a "keep" mediaId that does not belong to this card', async () => {
      const employeeId = await seedEmployee();
      const created = await service.create(
        SmartCardTemplateKey.INTERIOR_DESIGN_TEMPLATE,
        employeeId,
        minimalCreateDto(randomUUID()),
        [],
      );
      seededCardIds.push(created.id);

      await expect(
        service.update(
          SmartCardTemplateKey.INTERIOR_DESIGN_TEMPLATE,
          created.id,
          {
            profile: {
              logo: { action: 'keep', mediaId: randomUUID() },
            },
          },
          [],
        ),
      ).rejects.toThrow();
    });

    it('template cannot be changed via update (no field exists for it)', async () => {
      const employeeId = await seedEmployee();
      const created = await service.create(
        SmartCardTemplateKey.INTERIOR_DESIGN_TEMPLATE,
        employeeId,
        minimalCreateDto(randomUUID()),
        [],
      );
      seededCardIds.push(created.id);

      const updated = await service.update(
        SmartCardTemplateKey.INTERIOR_DESIGN_TEMPLATE,
        created.id,
        { services: [], testimonials: [], galleries: [] },
        [],
      );

      const stillUnderOriginalTemplate = await service.getById(
        SmartCardTemplateKey.INTERIOR_DESIGN_TEMPLATE,
        updated.id,
      );
      expect(stillUnderOriginalTemplate.id).toBe(created.id);
    });
  });

  describe('remove', () => {
    it('deletes the card and all referenced media', async () => {
      const employeeId = await seedEmployee();
      const created = await service.create(
        SmartCardTemplateKey.INTERIOR_DESIGN_TEMPLATE,
        employeeId,
        {
          endpoint: `test-card-${randomUUID()}`,
          profile: { companyName: 'Acme', logo: { action: 'upload' } },
          services: [],
          testimonials: [],
          galleries: [],
        },
        [makeFile('profileLogo')],
      );
      const mediaId = created.profile?.logoMediaId as string;

      const result = await service.remove(
        SmartCardTemplateKey.INTERIOR_DESIGN_TEMPLATE,
        created.id,
      );

      expect(result.success).toBe(true);
      const cardRow = await prisma.smartCard.findUnique({
        where: { id: created.id },
      });
      expect(cardRow).toBeNull();
      const mediaRow = await prisma.imageMedia.findUnique({
        where: { id: mediaId },
      });
      expect(mediaRow).toBeNull();
    });
  });

  describe('list', () => {
    it('paginates and scopes results to the given template', async () => {
      const employeeId = await seedEmployee();
      const first = await service.create(
        SmartCardTemplateKey.INTERIOR_DESIGN_TEMPLATE,
        employeeId,
        minimalCreateDto(randomUUID()),
        [],
      );
      const second = await service.create(
        SmartCardTemplateKey.INTERIOR_DESIGN_TEMPLATE,
        employeeId,
        minimalCreateDto(randomUUID()),
        [],
      );
      seededCardIds.push(first.id, second.id);

      const page1 = await service.list(
        SmartCardTemplateKey.INTERIOR_DESIGN_TEMPLATE,
        {
          page: 1,
          pageSize: 1,
        },
      );
      expect(page1.smartCards).toHaveLength(1);
      expect(page1.total).toBeGreaterThanOrEqual(2);

      const otherTemplate = await service.list(
        SmartCardTemplateKey.INTERIOR_DESIGN_TEMPLATE_3,
        { page: 1, pageSize: 20 },
      );
      expect(
        otherTemplate.smartCards.find(
          (card) => (card as { id: string }).id === first.id,
        ),
      ).toBeUndefined();
    });
  });

  describe('getByEndpoint', () => {
    it('returns the assembled card with its templateKey, keyed only by endpoint', async () => {
      const employeeId = await seedEmployee();
      const endpoint = `test-card-${randomUUID()}`;
      const created = await service.create(
        SmartCardTemplateKey.INTERIOR_DESIGN_TEMPLATE_2,
        employeeId,
        minimalCreateDto(endpoint.replace('test-card-', '')),
        [],
      );
      seededCardIds.push(created.id);

      const found = await service.getByEndpoint(created.endpoint);

      expect(found.id).toBe(created.id);
      expect(found.templateKey).toBe(
        SmartCardTemplateKey.INTERIOR_DESIGN_TEMPLATE_2,
      );
    });

    it('throws NotFoundException for an unknown endpoint', async () => {
      await expect(
        service.getByEndpoint(`does-not-exist-${randomUUID()}`),
      ).rejects.toThrow();
    });
  });
});
