import { AppConfigService } from '../../../common/config/app-config.service';
import { PrismaService } from '../../../common/prisma/prisma.service';
import { ImageMediaService } from '../../../common/media/image-media.service';
import {
  ImageSource,
  SmartCardTemplateKey,
} from '../../../generated/prisma/client';
import type { ImageStorageProviderRegistry } from '../../../common/media/storage/image-storage-provider-registry.provider';
import type { ImageStorageProvider } from '../../../common/media/storage/image-storage-provider.interface';
import { SmartCardTemplatesService } from './smart-card-templates.service';

class FakeImageStorageProvider implements ImageStorageProvider {
  upload(): Promise<void> {
    return Promise.resolve();
  }
  delete(): Promise<void> {
    return Promise.resolve();
  }
  getPublicUrl(key: string): string {
    return `/media/test-bucket/${key}`;
  }
}

describe('SmartCardTemplatesService (integration, TEST_DATABASE_URL only)', () => {
  let prisma: PrismaService;
  let service: SmartCardTemplatesService;
  let originalDatabaseUrl: string | undefined;

  beforeAll(async () => {
    originalDatabaseUrl = process.env.DATABASE_URL;
    process.env.DATABASE_URL = process.env.TEST_DATABASE_URL;

    const appConfig = new AppConfigService();
    prisma = new PrismaService(appConfig);

    for (const key of Object.values(SmartCardTemplateKey)) {
      await prisma.smartCardTemplate.upsert({
        where: { key },
        update: {},
        create: { key, name: key },
      });
    }

    const registry: ImageStorageProviderRegistry = {
      [ImageSource.MINIO]: new FakeImageStorageProvider(),
    };
    service = new SmartCardTemplatesService(
      prisma,
      new ImageMediaService(prisma, registry),
    );
  });

  afterAll(async () => {
    await prisma.$disconnect();
    process.env.DATABASE_URL = originalDatabaseUrl;
  });

  it('lists all seeded templates', async () => {
    const templates = await service.list();
    const keys = templates.map((template) => template.key);
    expect(keys).toEqual(
      expect.arrayContaining(Object.values(SmartCardTemplateKey)),
    );
  });

  it('gets a template by key with a null preview URL when no preview media is set', async () => {
    const template = await service.getByKey(
      SmartCardTemplateKey.INTERIOR_DESIGN_TEMPLATE,
    );
    expect(template.key).toBe(SmartCardTemplateKey.INTERIOR_DESIGN_TEMPLATE);
    expect(template.previewImageUrl).toBeNull();
  });
});
