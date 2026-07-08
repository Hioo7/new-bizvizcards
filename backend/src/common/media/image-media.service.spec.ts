import { AppConfigService } from '../config/app-config.service';
import { PrismaService } from '../prisma/prisma.service';
import { ImageMediaService } from './image-media.service';
import { ImageSource } from '../../generated/prisma/client';
import type {
  ImageStorageProvider,
  UploadImageParams,
} from './storage/image-storage-provider.interface';
import type { ImageStorageProviderRegistry } from './storage/image-storage-provider-registry.provider';

class FakeImageStorageProvider implements ImageStorageProvider {
  uploads: UploadImageParams[] = [];
  deletedKeys: string[] = [];

  upload(params: UploadImageParams): Promise<void> {
    this.uploads.push(params);
    return Promise.resolve();
  }

  delete(key: string): Promise<void> {
    this.deletedKeys.push(key);
    return Promise.resolve();
  }

  getPublicUrl(key: string): string {
    return `http://localhost:9000/test-bucket/${key}`;
  }
}

describe('ImageMediaService (integration, TEST_DATABASE_URL only)', () => {
  let prisma: PrismaService;
  let fakeProvider: FakeImageStorageProvider;
  let service: ImageMediaService;
  let originalDatabaseUrl: string | undefined;
  const seededIds: string[] = [];

  beforeAll(() => {
    originalDatabaseUrl = process.env.DATABASE_URL;
    process.env.DATABASE_URL = process.env.TEST_DATABASE_URL;

    const appConfig = new AppConfigService();
    prisma = new PrismaService(appConfig);
    fakeProvider = new FakeImageStorageProvider();
    const registry: ImageStorageProviderRegistry = {
      [ImageSource.MINIO]: fakeProvider,
    };
    service = new ImageMediaService(prisma, registry);
  });

  afterAll(async () => {
    await prisma.$disconnect();
    process.env.DATABASE_URL = originalDatabaseUrl;
  });

  afterEach(async () => {
    if (seededIds.length > 0) {
      await prisma.imageMedia.deleteMany({ where: { id: { in: seededIds } } });
      seededIds.length = 0;
    }
    fakeProvider.uploads = [];
    fakeProvider.deletedKeys = [];
  });

  it('uploads to the storage provider under the given keyPrefix and persists an ImageMedia row', async () => {
    const imageMedia = await service.upload({
      buffer: Buffer.from('fake-image-bytes'),
      contentType: 'image/png',
      originalName: 'avatar.png',
      extension: 'png',
      keyPrefix: 'pfp/customer-1',
    });
    seededIds.push(imageMedia.id);

    expect(imageMedia.source).toBe(ImageSource.MINIO);
    expect(imageMedia.storageKey).toBe(`pfp/customer-1/${imageMedia.id}.png`);
    expect(imageMedia.originalName).toBe('avatar.png');
    expect(fakeProvider.uploads).toHaveLength(1);
    expect(fakeProvider.uploads[0]).toEqual({
      key: imageMedia.storageKey,
      buffer: Buffer.from('fake-image-bytes'),
      contentType: 'image/png',
    });

    const persisted = await prisma.imageMedia.findUnique({
      where: { id: imageMedia.id },
    });
    expect(persisted).not.toBeNull();
  });

  it('deletes from the storage provider before deleting the DB row', async () => {
    const imageMedia = await service.upload({
      buffer: Buffer.from('fake-image-bytes'),
      contentType: 'image/png',
      originalName: 'avatar.png',
      extension: 'png',
      keyPrefix: 'pfp/customer-1',
    });

    await service.delete(imageMedia.id);

    expect(fakeProvider.deletedKeys).toEqual([imageMedia.storageKey]);
    const persisted = await prisma.imageMedia.findUnique({
      where: { id: imageMedia.id },
    });
    expect(persisted).toBeNull();
  });

  it('throws when deleting an id that does not exist', async () => {
    await expect(
      service.delete('00000000-0000-0000-0000-000000000000'),
    ).rejects.toThrow();
  });

  it('resolves the public URL via the provider matching the media source', async () => {
    const imageMedia = await service.upload({
      buffer: Buffer.from('fake-image-bytes'),
      contentType: 'image/png',
      originalName: 'avatar.png',
      extension: 'png',
      keyPrefix: 'pfp/customer-1',
    });
    seededIds.push(imageMedia.id);

    const url = service.getPublicUrl(imageMedia);

    expect(url).toBe(
      `http://localhost:9000/test-bucket/${imageMedia.storageKey}`,
    );
  });
});
