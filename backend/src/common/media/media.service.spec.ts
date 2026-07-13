import { AppConfigService } from '../config/app-config.service';
import { PrismaService } from '../prisma/prisma.service';
import { MediaService } from './media.service';
import { MediaSource } from '../../generated/prisma/client';
import type {
  MediaStorageProvider,
  UploadMediaParams,
} from './storage/media-storage-provider.interface';
import type { MediaStorageProviderRegistry } from './storage/media-storage-provider-registry.provider';

class FakeMediaStorageProvider implements MediaStorageProvider {
  uploads: UploadMediaParams[] = [];
  deletedKeys: string[] = [];

  upload(params: UploadMediaParams): Promise<void> {
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

describe('MediaService (integration, TEST_DATABASE_URL only)', () => {
  let prisma: PrismaService;
  let fakeProvider: FakeMediaStorageProvider;
  let service: MediaService;
  let originalDatabaseUrl: string | undefined;
  const seededIds: string[] = [];

  beforeAll(() => {
    originalDatabaseUrl = process.env.DATABASE_URL;
    process.env.DATABASE_URL = process.env.TEST_DATABASE_URL;

    const appConfig = new AppConfigService();
    prisma = new PrismaService(appConfig);
    fakeProvider = new FakeMediaStorageProvider();
    const registry: MediaStorageProviderRegistry = {
      [MediaSource.MINIO]: fakeProvider,
    };
    service = new MediaService(prisma, registry);
  });

  afterAll(async () => {
    await prisma.$disconnect();
    process.env.DATABASE_URL = originalDatabaseUrl;
  });

  afterEach(async () => {
    if (seededIds.length > 0) {
      await prisma.media.deleteMany({ where: { id: { in: seededIds } } });
      seededIds.length = 0;
    }
    fakeProvider.uploads = [];
    fakeProvider.deletedKeys = [];
  });

  it('uploads to the storage provider under the given keyPrefix and persists a Media row', async () => {
    const media = await service.upload({
      buffer: Buffer.from('fake-image-bytes'),
      contentType: 'image/png',
      originalName: 'avatar.png',
      extension: 'png',
      keyPrefix: 'pfp/customer-1',
    });
    seededIds.push(media.id);

    expect(media.source).toBe(MediaSource.MINIO);
    expect(media.storageKey).toBe(`pfp/customer-1/${media.id}.png`);
    expect(media.originalName).toBe('avatar.png');
    expect(fakeProvider.uploads).toHaveLength(1);
    expect(fakeProvider.uploads[0]).toEqual({
      key: media.storageKey,
      buffer: Buffer.from('fake-image-bytes'),
      contentType: 'image/png',
    });

    const persisted = await prisma.media.findUnique({
      where: { id: media.id },
    });
    expect(persisted).not.toBeNull();
  });

  it('deletes from the storage provider before deleting the DB row', async () => {
    const media = await service.upload({
      buffer: Buffer.from('fake-image-bytes'),
      contentType: 'image/png',
      originalName: 'avatar.png',
      extension: 'png',
      keyPrefix: 'pfp/customer-1',
    });

    await service.delete(media.id);

    expect(fakeProvider.deletedKeys).toEqual([media.storageKey]);
    const persisted = await prisma.media.findUnique({
      where: { id: media.id },
    });
    expect(persisted).toBeNull();
  });

  it('throws when deleting an id that does not exist', async () => {
    await expect(
      service.delete('00000000-0000-0000-0000-000000000000'),
    ).rejects.toThrow();
  });

  it('resolves the public URL via the provider matching the media source', async () => {
    const media = await service.upload({
      buffer: Buffer.from('fake-image-bytes'),
      contentType: 'image/png',
      originalName: 'avatar.png',
      extension: 'png',
      keyPrefix: 'pfp/customer-1',
    });
    seededIds.push(media.id);

    const url = service.getPublicUrl(media);

    expect(url).toBe(`http://localhost:9000/test-bucket/${media.storageKey}`);
  });
});
