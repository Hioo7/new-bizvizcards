import { randomUUID } from 'crypto';
import { AppConfigService } from '../../../common/config/app-config.service';
import { PrismaService } from '../../../common/prisma/prisma.service';
import { RedirectResolverService } from './redirect-resolver.service';

describe('RedirectResolverService (integration, TEST_DATABASE_URL only)', () => {
  let prisma: PrismaService;
  let appConfig: AppConfigService;
  let service: RedirectResolverService;
  let originalDatabaseUrl: string | undefined;
  const seededInternalIds: string[] = [];
  const seededExternalIds: string[] = [];

  beforeAll(() => {
    originalDatabaseUrl = process.env.DATABASE_URL;
    process.env.DATABASE_URL = process.env.TEST_DATABASE_URL;

    appConfig = new AppConfigService();
    prisma = new PrismaService(appConfig);
    service = new RedirectResolverService(prisma);
  });

  afterAll(async () => {
    await prisma.$disconnect();
    process.env.DATABASE_URL = originalDatabaseUrl;
  });

  afterEach(async () => {
    if (seededInternalIds.length > 0) {
      await prisma.internalRedirectRoute.deleteMany({
        where: { id: { in: seededInternalIds } },
      });
      seededInternalIds.length = 0;
    }
    if (seededExternalIds.length > 0) {
      await prisma.externalRedirectRoute.deleteMany({
        where: { id: { in: seededExternalIds } },
      });
      seededExternalIds.length = 0;
    }
  });

  function uniquePath(prefix: string): string {
    return `/${prefix}-${randomUUID()}`;
  }

  async function seedInternal(
    sourcePath: string,
    targetPath: string,
    enabled = true,
  ) {
    const route = await prisma.internalRedirectRoute.create({
      data: { sourcePath, targetPath, enabled },
    });
    seededInternalIds.push(route.id);
    return route;
  }

  async function seedExternal(
    sourcePath: string,
    destinationUrl: string,
    enabled = true,
  ) {
    const route = await prisma.externalRedirectRoute.create({
      data: { sourcePath, destinationUrl, enabled },
    });
    seededExternalIds.push(route.id);
    return route;
  }

  it('resolves an internal match', async () => {
    const sourcePath = uniquePath('source');
    await seedInternal(sourcePath, '/new-target');

    const result = await service.resolve(sourcePath);

    expect(result).toEqual({ type: 'internal', target: '/new-target' });
  });

  it('resolves an external match', async () => {
    const sourcePath = uniquePath('source');
    await seedExternal(sourcePath, 'https://example.com');

    const result = await service.resolve(sourcePath);

    expect(result).toEqual({
      type: 'external',
      target: 'https://example.com',
    });
  });

  it('prefers the internal match when both an internal and external route exist for the same path', async () => {
    const sourcePath = uniquePath('shared');
    await seedInternal(sourcePath, '/internal-target');
    await seedExternal(sourcePath, 'https://external.example.com');

    const result = await service.resolve(sourcePath);

    expect(result).toEqual({ type: 'internal', target: '/internal-target' });
  });

  it('never matches a disabled route', async () => {
    const sourcePath = uniquePath('disabled');
    await seedInternal(sourcePath, '/target', false);

    const result = await service.resolve(sourcePath);

    expect(result).toBeNull();
  });

  it('normalizes a trailing slash before matching', async () => {
    const sourcePath = uniquePath('trailing');
    await seedInternal(sourcePath, '/target');

    const result = await service.resolve(`${sourcePath}/`);

    expect(result).toEqual({ type: 'internal', target: '/target' });
  });

  it('returns null when no route matches', async () => {
    const result = await service.resolve(uniquePath('unmatched'));

    expect(result).toBeNull();
  });
});
