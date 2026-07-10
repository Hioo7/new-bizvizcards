import { randomUUID } from 'crypto';
import { ConflictException, NotFoundException } from '@nestjs/common';
import { AppConfigService } from '../../../common/config/app-config.service';
import { PrismaService } from '../../../common/prisma/prisma.service';
import { ExternalRedirectsService } from './external-redirects.service';
import { RestrictedPathsService } from './restricted-paths.service';

describe('ExternalRedirectsService (integration, TEST_DATABASE_URL only)', () => {
  let prisma: PrismaService;
  let appConfig: AppConfigService;
  let service: ExternalRedirectsService;
  let restrictedPathsService: RestrictedPathsService;
  let originalDatabaseUrl: string | undefined;
  const seededRouteIds: string[] = [];
  const seededAccountIds: string[] = [];
  const seededRestrictedPathIds: string[] = [];

  beforeAll(() => {
    originalDatabaseUrl = process.env.DATABASE_URL;
    process.env.DATABASE_URL = process.env.TEST_DATABASE_URL;

    appConfig = new AppConfigService();
    prisma = new PrismaService(appConfig);
    restrictedPathsService = new RestrictedPathsService(prisma);
    service = new ExternalRedirectsService(prisma, restrictedPathsService);
  });

  afterAll(async () => {
    await prisma.$disconnect();
    process.env.DATABASE_URL = originalDatabaseUrl;
  });

  afterEach(async () => {
    if (seededRouteIds.length > 0) {
      await prisma.externalRedirectRoute.deleteMany({
        where: { id: { in: seededRouteIds } },
      });
      seededRouteIds.length = 0;
    }
    if (seededRestrictedPathIds.length > 0) {
      await prisma.restrictedRedirectPath.deleteMany({
        where: { id: { in: seededRestrictedPathIds } },
      });
      seededRestrictedPathIds.length = 0;
    }
    if (seededAccountIds.length > 0) {
      await prisma.employeeAccount.deleteMany({
        where: { id: { in: seededAccountIds } },
      });
      seededAccountIds.length = 0;
    }
  });

  function uniquePath(prefix: string): string {
    return `/${prefix}-${randomUUID()}`;
  }

  async function seedEmployee(): Promise<string> {
    const account = await prisma.employeeAccount.create({
      data: {
        name: 'Test Employee',
        email: `external-redirects-${randomUUID()}@example.com`,
        emailVerified: true,
        role: 'admin',
      },
    });
    seededAccountIds.push(account.id);
    await prisma.employee.create({ data: { accountId: account.id } });
    return account.id;
  }

  async function seedRestrictedPath(path: string) {
    const restricted = await prisma.restrictedRedirectPath.create({
      data: { path },
    });
    seededRestrictedPathIds.push(restricted.id);
    return restricted;
  }

  describe('create', () => {
    it('creates an external redirect enabled by default', async () => {
      const actorAccountId = await seedEmployee();
      const sourcePath = uniquePath('source');

      const result = await service.create(
        { sourcePath, destinationUrl: 'https://example.com' },
        actorAccountId,
      );
      seededRouteIds.push(result.id);

      expect(result.sourcePath).toBe(sourcePath);
      expect(result.destinationUrl).toBe('https://example.com');
      expect(result.enabled).toBe(true);
    });

    it('throws ConflictException for a duplicate sourcePath', async () => {
      const actorAccountId = await seedEmployee();
      const sourcePath = uniquePath('source');
      const first = await service.create(
        { sourcePath, destinationUrl: 'https://a.example.com' },
        actorAccountId,
      );
      seededRouteIds.push(first.id);

      await expect(
        service.create(
          { sourcePath, destinationUrl: 'https://b.example.com' },
          actorAccountId,
        ),
      ).rejects.toThrow(ConflictException);
    });

    it('throws BadRequestException when sourcePath is restricted', async () => {
      const actorAccountId = await seedEmployee();
      const sourcePath = uniquePath('restricted');
      await seedRestrictedPath(sourcePath);

      await expect(
        service.create(
          { sourcePath, destinationUrl: 'https://example.com' },
          actorAccountId,
        ),
      ).rejects.toThrow();
    });
  });

  describe('list / getById', () => {
    it('lists created routes and can fetch by id', async () => {
      const actorAccountId = await seedEmployee();
      const created = await service.create(
        {
          sourcePath: uniquePath('source'),
          destinationUrl: 'https://example.com',
        },
        actorAccountId,
      );
      seededRouteIds.push(created.id);

      const list = await service.list();
      expect(list.some((route) => route.id === created.id)).toBe(true);

      const fetched = await service.getById(created.id);
      expect(fetched.id).toBe(created.id);
    });

    it('throws NotFoundException for a non-existent id', async () => {
      await expect(service.getById(randomUUID())).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('update', () => {
    it('updates fields including toggling enabled', async () => {
      const actorAccountId = await seedEmployee();
      const created = await service.create(
        {
          sourcePath: uniquePath('source'),
          destinationUrl: 'https://example.com',
        },
        actorAccountId,
      );
      seededRouteIds.push(created.id);

      const updated = await service.update(created.id, {
        destinationUrl: 'https://updated.example.com',
        enabled: false,
      });

      expect(updated.destinationUrl).toBe('https://updated.example.com');
      expect(updated.enabled).toBe(false);
    });

    it('throws ConflictException when updating sourcePath to one already in use', async () => {
      const actorAccountId = await seedEmployee();
      const routeA = await service.create(
        {
          sourcePath: uniquePath('a'),
          destinationUrl: 'https://a.example.com',
        },
        actorAccountId,
      );
      seededRouteIds.push(routeA.id);
      const routeB = await service.create(
        {
          sourcePath: uniquePath('b'),
          destinationUrl: 'https://b.example.com',
        },
        actorAccountId,
      );
      seededRouteIds.push(routeB.id);

      await expect(
        service.update(routeB.id, { sourcePath: routeA.sourcePath }),
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('delete', () => {
    it('deletes an existing route', async () => {
      const actorAccountId = await seedEmployee();
      const created = await service.create(
        {
          sourcePath: uniquePath('source'),
          destinationUrl: 'https://example.com',
        },
        actorAccountId,
      );

      await service.delete(created.id);

      const found = await prisma.externalRedirectRoute.findUnique({
        where: { id: created.id },
      });
      expect(found).toBeNull();
    });

    it('throws NotFoundException for a non-existent id', async () => {
      await expect(service.delete(randomUUID())).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});
