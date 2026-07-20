import { MigrationPreflightService } from './migration-preflight.service';
import type { PrismaService } from '../../../common/prisma/prisma.service';
import type { LegacyPrismaService } from '../../../common/legacy-db/legacy-prisma.service';
import type { LegacyMediaStagingClient } from './legacy-media-staging-client.service';

function createService(overrides: {
  legacyCardUserCount?: () => Promise<number>;
  stagingBucket?: string | undefined;
  checkReachable?: () => Promise<{ objectCount: number }>;
  fallbackPlan?: { id: string; name: string } | null;
  smartCardTemplateCount?: number;
}) {
  const prisma = {
    plan: {
      findFirst: jest.fn().mockResolvedValue(overrides.fallbackPlan ?? null),
    },
    smartCardTemplate: {
      count: jest.fn().mockResolvedValue(overrides.smartCardTemplateCount ?? 0),
    },
  } as unknown as PrismaService;

  const legacyPrisma = {
    legacyCardUser: {
      count:
        overrides.legacyCardUserCount ??
        jest.fn().mockRejectedValue(new Error('ECONNREFUSED')),
    },
  } as unknown as LegacyPrismaService;

  const legacyMediaStagingClient = {
    bucket: overrides.stagingBucket,
    checkReachable:
      overrides.checkReachable ??
      jest.fn().mockRejectedValue(new Error('bucket not found')),
  } as unknown as LegacyMediaStagingClient;

  return new MigrationPreflightService(
    prisma,
    legacyPrisma,
    legacyMediaStagingClient,
  );
}

describe('MigrationPreflightService', () => {
  describe('checkLegacyDatabaseConnectivity (via runAll)', () => {
    it('passes and reports the row count on success', async () => {
      const service = createService({
        legacyCardUserCount: jest.fn().mockResolvedValue(42),
        stagingBucket: 'legacy-media-staging',
        checkReachable: jest.fn().mockResolvedValue({ objectCount: 1 }),
        fallbackPlan: { id: 'plan-1', name: 'Free' },
        smartCardTemplateCount: 2,
      });

      const summary = await service.runAll();
      const check = summary.checks.find(
        (c) => c.id === 'LEGACY_DATABASE_CONNECTIVITY',
      );

      expect(check?.status).toBe('PASSED');
      expect(check?.detail).toContain('42');
    });

    it('fails with a connection-refused hint when the tunnel is down', async () => {
      const service = createService({
        legacyCardUserCount: jest
          .fn()
          .mockRejectedValue(new Error('connect ECONNREFUSED 127.0.0.1:5432')),
        stagingBucket: 'legacy-media-staging',
        checkReachable: jest.fn().mockResolvedValue({ objectCount: 1 }),
        fallbackPlan: { id: 'plan-1', name: 'Free' },
        smartCardTemplateCount: 2,
      });

      const summary = await service.runAll();
      const check = summary.checks.find(
        (c) => c.id === 'LEGACY_DATABASE_CONNECTIVITY',
      );

      expect(check?.status).toBe('FAILED');
      expect(check?.detail).toMatch(/tunnel/i);
    });
  });

  describe('checkLegacyMediaStagingConnectivity (via runAll)', () => {
    it('fails when the staging bucket env var is unset', async () => {
      const service = createService({
        legacyCardUserCount: jest.fn().mockResolvedValue(1),
        stagingBucket: undefined,
      });

      const summary = await service.runAll();
      const check = summary.checks.find(
        (c) => c.id === 'LEGACY_MEDIA_STAGING_CONNECTIVITY',
      );

      expect(check?.status).toBe('FAILED');
      expect(check?.detail).toContain('LEGACY_MEDIA_STAGING_BUCKET');
    });

    it('fails when the bucket exists but is empty', async () => {
      const service = createService({
        legacyCardUserCount: jest.fn().mockResolvedValue(1),
        stagingBucket: 'legacy-media-staging',
        checkReachable: jest.fn().mockResolvedValue({ objectCount: 0 }),
      });

      const summary = await service.runAll();
      const check = summary.checks.find(
        (c) => c.id === 'LEGACY_MEDIA_STAGING_CONNECTIVITY',
      );

      expect(check?.status).toBe('FAILED');
      expect(check?.detail).toMatch(/no objects/i);
    });

    it('passes when the bucket is reachable with objects', async () => {
      const service = createService({
        legacyCardUserCount: jest.fn().mockResolvedValue(1),
        stagingBucket: 'legacy-media-staging',
        checkReachable: jest.fn().mockResolvedValue({ objectCount: 10 }),
      });

      const summary = await service.runAll();
      const check = summary.checks.find(
        (c) => c.id === 'LEGACY_MEDIA_STAGING_CONNECTIVITY',
      );

      expect(check?.status).toBe('PASSED');
    });
  });

  describe('checkFallbackPlanConfigured / checkSmartCardTemplatesSeeded (via runAll)', () => {
    it('fails when no fallback plan exists', async () => {
      const service = createService({
        legacyCardUserCount: jest.fn().mockResolvedValue(1),
        stagingBucket: 'legacy-media-staging',
        checkReachable: jest.fn().mockResolvedValue({ objectCount: 1 }),
        fallbackPlan: null,
      });

      const summary = await service.runAll();
      const check = summary.checks.find(
        (c) => c.id === 'FALLBACK_PLAN_CONFIGURED',
      );

      expect(check?.status).toBe('FAILED');
    });

    it('fails when no smart card templates exist', async () => {
      const service = createService({
        legacyCardUserCount: jest.fn().mockResolvedValue(1),
        stagingBucket: 'legacy-media-staging',
        checkReachable: jest.fn().mockResolvedValue({ objectCount: 1 }),
        fallbackPlan: { id: 'plan-1', name: 'Free' },
        smartCardTemplateCount: 0,
      });

      const summary = await service.runAll();
      const check = summary.checks.find(
        (c) => c.id === 'SMART_CARD_TEMPLATES_SEEDED',
      );

      expect(check?.status).toBe('FAILED');
    });
  });

  describe('runAll canStart aggregation', () => {
    it('canStart is true only when every check passes', async () => {
      const allPassing = createService({
        legacyCardUserCount: jest.fn().mockResolvedValue(1),
        stagingBucket: 'legacy-media-staging',
        checkReachable: jest.fn().mockResolvedValue({ objectCount: 1 }),
        fallbackPlan: { id: 'plan-1', name: 'Free' },
        smartCardTemplateCount: 1,
      });
      expect((await allPassing.runAll()).canStart).toBe(true);

      const oneFailing = createService({
        legacyCardUserCount: jest.fn().mockResolvedValue(1),
        stagingBucket: 'legacy-media-staging',
        checkReachable: jest.fn().mockResolvedValue({ objectCount: 1 }),
        fallbackPlan: null,
        smartCardTemplateCount: 1,
      });
      expect((await oneFailing.runAll()).canStart).toBe(false);
    });
  });
});
