import sharp from 'sharp';
import { NotFoundException } from '@nestjs/common';
import { AppConfigService } from '../../../common/config/app-config.service';
import { PrismaService } from '../../../common/prisma/prisma.service';
import { MediaService } from '../../../common/media/media.service';
import { MediaSource } from '../../../generated/prisma/client';
import type { MediaStorageProviderRegistry } from '../../../common/media/storage/media-storage-provider-registry.provider';
import type {
  MediaStorageProvider,
  UploadMediaParams,
} from '../../../common/media/storage/media-storage-provider.interface';
import { VirtualBackgroundTemplatesService } from './virtual-background-templates.service';
import {
  VIRTUAL_BACKGROUND_HEIGHT_PX,
  VIRTUAL_BACKGROUND_WIDTH_PX,
} from '../virtual-backgrounds.constants';

// Happy paths: list returns uploaded templates ordered by insertion; create
// uploads the image and persists a template row; listByIds filters and
// preserves the id-set intersection; remove deletes the media row and
// cascades away the template.
// Sad paths: create rejects an undersized image; remove throws for an
// unknown id.

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

async function solidImageBuffer(
  width: number,
  height: number,
): Promise<Buffer> {
  return sharp({
    create: { width, height, channels: 3, background: { r: 10, g: 20, b: 30 } },
  })
    .png()
    .toBuffer();
}

function makeImageFile(buffer: Buffer): Express.Multer.File {
  return {
    buffer,
    originalname: 'template.png',
    mimetype: 'image/png',
    size: buffer.length,
  } as Express.Multer.File;
}

describe('VirtualBackgroundTemplatesService (integration, TEST_DATABASE_URL only)', () => {
  let prisma: PrismaService;
  let service: VirtualBackgroundTemplatesService;
  let originalDatabaseUrl: string | undefined;
  const seededMediaIds: string[] = [];

  beforeAll(() => {
    originalDatabaseUrl = process.env.DATABASE_URL;
    process.env.DATABASE_URL = process.env.TEST_DATABASE_URL;

    const appConfig = new AppConfigService();
    prisma = new PrismaService(appConfig);
    const registry: MediaStorageProviderRegistry = {
      [MediaSource.MINIO]: new FakeMediaStorageProvider(),
    };
    service = new VirtualBackgroundTemplatesService(
      prisma,
      new MediaService(prisma, registry),
    );
  });

  afterAll(async () => {
    await prisma.$disconnect();
    process.env.DATABASE_URL = originalDatabaseUrl;
  });

  afterEach(async () => {
    if (seededMediaIds.length > 0) {
      await prisma.media.deleteMany({ where: { id: { in: seededMediaIds } } });
      seededMediaIds.length = 0;
    }
  });

  async function createTemplate(name: string) {
    const buffer = await solidImageBuffer(
      VIRTUAL_BACKGROUND_WIDTH_PX,
      VIRTUAL_BACKGROUND_HEIGHT_PX,
    );
    const template = await service.create({ name }, makeImageFile(buffer));
    seededMediaIds.push(
      (
        await prisma.virtualBackgroundTemplate.findUniqueOrThrow({
          where: { id: template.id },
        })
      ).mediaId,
    );
    return template;
  }

  it('creates a template and returns it with a resolved image URL', async () => {
    const template = await createTemplate('Office');

    expect(template.name).toBe('Office');
    expect(template.imageUrl).toContain('/media/test-bucket/');
  });

  it('rejects an undersized base image', async () => {
    const buffer = await solidImageBuffer(
      VIRTUAL_BACKGROUND_WIDTH_PX - 1,
      VIRTUAL_BACKGROUND_HEIGHT_PX,
    );

    await expect(
      service.create({ name: 'Too Small' }, makeImageFile(buffer)),
    ).rejects.toThrow();
  });

  it('lists templates ordered by insertion', async () => {
    const first = await createTemplate('First');
    const second = await createTemplate('Second');

    const templates = await service.list();
    const ids = templates.map((t) => t.id);
    expect(ids.indexOf(first.id)).toBeLessThan(ids.indexOf(second.id));
  });

  it('listByIds returns only the requested templates, and an empty array for an empty input', async () => {
    const template = await createTemplate('Filtered');

    expect(await service.listByIds([])).toEqual([]);
    const result = await service.listByIds([template.id]);
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe(template.id);
  });

  it('deletes a template by deleting its underlying media row', async () => {
    const template = await createTemplate('To Delete');

    await service.remove(template.id);

    const found = await prisma.virtualBackgroundTemplate.findUnique({
      where: { id: template.id },
    });
    expect(found).toBeNull();
  });

  it('throws when removing an unknown template id', async () => {
    await expect(
      service.remove('00000000-0000-0000-0000-000000000000'),
    ).rejects.toThrow(NotFoundException);
  });
});
