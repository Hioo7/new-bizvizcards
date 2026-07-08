import { AppConfigService } from '../config/app-config.service';
import { PrismaService } from './prisma.service';

describe('PrismaService (integration, TEST_DATABASE_URL only)', () => {
  let service: PrismaService;
  let originalDatabaseUrl: string | undefined;

  beforeAll(() => {
    originalDatabaseUrl = process.env.DATABASE_URL;
    process.env.DATABASE_URL = process.env.TEST_DATABASE_URL;

    const appConfig = new AppConfigService();
    service = new PrismaService(appConfig);
  });

  afterAll(async () => {
    await service.$disconnect();
    process.env.DATABASE_URL = originalDatabaseUrl;
  });

  it('connects to the test database and runs a trivial query', async () => {
    await service.onModuleInit();

    const result = await service.$queryRaw<
      { value: number }[]
    >`SELECT 1 as value`;

    expect(result).toEqual([{ value: 1 }]);
  });
});
