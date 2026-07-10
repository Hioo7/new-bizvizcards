import { randomUUID } from 'crypto';
import {
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { AppConfigService } from '../../../common/config/app-config.service';
import { PrismaService } from '../../../common/prisma/prisma.service';
import { RestrictedPathsService } from './restricted-paths.service';

describe('RestrictedPathsService (integration, TEST_DATABASE_URL only)', () => {
  let prisma: PrismaService;
  let appConfig: AppConfigService;
  let service: RestrictedPathsService;
  let originalDatabaseUrl: string | undefined;
  const seededIds: string[] = [];

  beforeAll(() => {
    originalDatabaseUrl = process.env.DATABASE_URL;
    process.env.DATABASE_URL = process.env.TEST_DATABASE_URL;

    appConfig = new AppConfigService();
    prisma = new PrismaService(appConfig);
    service = new RestrictedPathsService(prisma);
  });

  afterAll(async () => {
    await prisma.$disconnect();
    process.env.DATABASE_URL = originalDatabaseUrl;
  });

  afterEach(async () => {
    if (seededIds.length > 0) {
      await prisma.restrictedRedirectPath.deleteMany({
        where: { id: { in: seededIds } },
      });
      seededIds.length = 0;
    }
  });

  function uniquePath(): string {
    return `/restricted-${randomUUID()}`;
  }

  async function seedRestrictedPath(path: string) {
    const restricted = await prisma.restrictedRedirectPath.create({
      data: { path },
    });
    seededIds.push(restricted.id);
    return restricted;
  }

  describe('create', () => {
    it('creates a restricted path', async () => {
      const path = uniquePath();

      const result = await service.create({ path });
      seededIds.push(result.id);

      expect(result.path).toBe(path);
    });

    it('throws ConflictException for a duplicate path', async () => {
      const path = uniquePath();
      await seedRestrictedPath(path);

      await expect(service.create({ path })).rejects.toThrow(ConflictException);
    });
  });

  describe('list', () => {
    it('returns restricted paths ordered by createdAt desc', async () => {
      const first = await seedRestrictedPath(uniquePath());
      const second = await seedRestrictedPath(uniquePath());

      const result = await service.list();
      const ids = result.map((r) => r.id);

      expect(ids.indexOf(second.id)).toBeLessThan(ids.indexOf(first.id));
    });
  });

  describe('delete', () => {
    it('deletes an existing restricted path', async () => {
      const restricted = await seedRestrictedPath(uniquePath());

      await service.delete(restricted.id);

      const found = await prisma.restrictedRedirectPath.findUnique({
        where: { id: restricted.id },
      });
      expect(found).toBeNull();
    });

    it('throws NotFoundException for a non-existent id', async () => {
      await expect(service.delete(randomUUID())).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('assertNotRestricted', () => {
    it('resolves without throwing when the path is not restricted', async () => {
      await expect(
        service.assertNotRestricted(uniquePath()),
      ).resolves.toBeUndefined();
    });

    it('throws BadRequestException when the path is restricted', async () => {
      const path = uniquePath();
      await seedRestrictedPath(path);

      await expect(service.assertNotRestricted(path)).rejects.toThrow(
        BadRequestException,
      );
    });
  });
});
