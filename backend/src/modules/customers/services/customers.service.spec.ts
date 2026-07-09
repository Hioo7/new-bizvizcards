import { randomUUID } from 'crypto';
import { AppConfigService } from '../../../common/config/app-config.service';
import { PrismaService } from '../../../common/prisma/prisma.service';
import { ImageMediaService } from '../../../common/media/image-media.service';
import { ImageSource } from '../../../generated/prisma/client';
import type {
  ImageStorageProvider,
  UploadImageParams,
} from '../../../common/media/storage/image-storage-provider.interface';
import type { ImageStorageProviderRegistry } from '../../../common/media/storage/image-storage-provider-registry.provider';
import { CustomersService } from './customers.service';

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

describe('CustomersService (integration, TEST_DATABASE_URL only)', () => {
  let prisma: PrismaService;
  let appConfig: AppConfigService;
  let fakeProvider: FakeImageStorageProvider;
  let service: CustomersService;
  let originalDatabaseUrl: string | undefined;
  const seededAccountIds: string[] = [];

  beforeAll(() => {
    originalDatabaseUrl = process.env.DATABASE_URL;
    process.env.DATABASE_URL = process.env.TEST_DATABASE_URL;

    appConfig = new AppConfigService();
    prisma = new PrismaService(appConfig);
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
    service = new CustomersService(prisma, imageMediaService);
  });

  afterEach(async () => {
    if (seededAccountIds.length > 0) {
      // ImageMedia rows are unlinked/deleted by the service under test as
      // part of each flow; deleting the account cascades the Customer row.
      await prisma.customerAccount.deleteMany({
        where: { id: { in: seededAccountIds } },
      });
      seededAccountIds.length = 0;
    }
  });

  async function seedCustomer(overrides?: { name?: string; email?: string }) {
    const account = await prisma.customerAccount.create({
      data: {
        name: overrides?.name ?? 'Test Customer',
        email:
          overrides?.email ?? `customers-service-${randomUUID()}@example.com`,
        emailVerified: true,
      },
    });
    seededAccountIds.push(account.id);
    return prisma.customer.create({ data: { accountId: account.id } });
  }

  it('resolves a customer by accountId', async () => {
    const customer = await seedCustomer();

    const resolved = await service.getByAccountId(customer.accountId);

    expect(resolved.id).toBe(customer.id);
  });

  it('replaces a profile picture under pfp/<customerId>/, linking the new media before deleting the old one', async () => {
    const customer = await seedCustomer();

    const afterFirstUpload = await service.replaceProfilePicture(customer.id, {
      buffer: Buffer.from('a'),
      contentType: 'image/png',
      originalName: 'a.png',
      extension: 'png',
    });
    expect(afterFirstUpload.customer.pfpMediaId).not.toBeNull();
    expect(fakeProvider.deletedKeys).toHaveLength(0);
    const firstMediaId = afterFirstUpload.customer.pfpMediaId as string;
    const firstMediaRow = await prisma.imageMedia.findUniqueOrThrow({
      where: { id: firstMediaId },
    });
    expect(firstMediaRow.storageKey).toBe(
      `pfp/${customer.id}/${firstMediaId}.png`,
    );
    expect(afterFirstUpload.pfpUrl).toBe(
      `/media/test-bucket/${firstMediaRow.storageKey}`,
    );

    const afterSecondUpload = await service.replaceProfilePicture(customer.id, {
      buffer: Buffer.from('b'),
      contentType: 'image/png',
      originalName: 'b.png',
      extension: 'png',
    });

    expect(afterSecondUpload.customer.pfpMediaId).not.toBe(firstMediaId);
    // The old media's row is gone (deleted after the new one was linked) and
    // its storage key was deleted from the provider.
    const oldMediaRow = await prisma.imageMedia.findUnique({
      where: { id: firstMediaId },
    });
    expect(oldMediaRow).toBeNull();
    expect(fakeProvider.deletedKeys).toEqual([firstMediaRow.storageKey]);
  });

  it('removeProfilePicture is a no-op when there is no existing picture', async () => {
    const customer = await seedCustomer();

    const result = await service.removeProfilePicture(customer.id);

    expect(result.pfpMediaId).toBeNull();
    expect(fakeProvider.deletedKeys).toHaveLength(0);
  });

  it('removeProfilePicture unlinks the FK before deleting the old media', async () => {
    const customer = await seedCustomer();
    const uploaded = await service.replaceProfilePicture(customer.id, {
      buffer: Buffer.from('a'),
      contentType: 'image/png',
      originalName: 'a.png',
      extension: 'png',
    });
    const mediaId = uploaded.customer.pfpMediaId as string;

    const result = await service.removeProfilePicture(customer.id);

    expect(result.pfpMediaId).toBeNull();
    const mediaRow = await prisma.imageMedia.findUnique({
      where: { id: mediaId },
    });
    expect(mediaRow).toBeNull();
    expect(fakeProvider.deletedKeys).toHaveLength(1);
  });

  describe('list', () => {
    it('paginates customers ordered by newest first', async () => {
      const suffix = randomUUID();
      const first = await seedCustomer({ name: `Alpha ${suffix}` });
      const second = await seedCustomer({ name: `Beta ${suffix}` });

      const result = await service.list({
        page: 1,
        pageSize: 1,
        search: suffix,
      });

      expect(result.total).toBe(2);
      expect(result.customers).toHaveLength(1);
      expect(result.customers[0].id).toBe(second.id);

      const nextPage = await service.list({
        page: 2,
        pageSize: 1,
        search: suffix,
      });
      expect(nextPage.customers[0].id).toBe(first.id);
    });

    it('searches case-insensitively across name and email', async () => {
      const suffix = randomUUID();
      const customer = await seedCustomer({
        name: `Searchable Co ${suffix}`,
        email: `unique-${suffix}@example.com`,
      });

      const byName = await service.list({
        page: 1,
        pageSize: 20,
        search: `searchable co ${suffix}`,
      });
      expect(byName.customers.map((c) => c.id)).toContain(customer.id);

      const byEmail = await service.list({
        page: 1,
        pageSize: 20,
        search: `UNIQUE-${suffix}`,
      });
      expect(byEmail.customers.map((c) => c.id)).toContain(customer.id);
    });

    it('includes a null pfpUrl when no profile picture is set', async () => {
      const suffix = randomUUID();
      const customer = await seedCustomer({ name: `NoPfp ${suffix}` });

      const result = await service.list({
        page: 1,
        pageSize: 20,
        search: suffix,
      });

      const found = result.customers.find((c) => c.id === customer.id);
      expect(found?.pfpUrl).toBeNull();
    });
  });
});
