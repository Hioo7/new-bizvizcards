import { randomUUID } from 'crypto';
import { AppConfigService } from '../../../common/config/app-config.service';
import { PrismaService } from '../../../common/prisma/prisma.service';
import {
  MigrationDomain,
  MigrationRecordStatus,
} from '../../../generated/prisma/client';
import { LegacyIdMapperService } from './legacy-id-mapper.service';

// Uses $transaction([...]) (array form) throughout, which a mocked
// PrismaService can't faithfully emulate — tested here as a real
// integration spec against TEST_DATABASE_URL instead, same convention as
// customers.service.spec.ts / staff.service.spec.ts.
describe('LegacyIdMapperService (integration, TEST_DATABASE_URL only)', () => {
  let prisma: PrismaService;
  let service: LegacyIdMapperService;
  let originalDatabaseUrl: string | undefined;
  let employeeId: string;
  const seededAccountIds: string[] = [];
  const seededJobIds: string[] = [];

  beforeAll(async () => {
    originalDatabaseUrl = process.env.DATABASE_URL;
    process.env.DATABASE_URL = process.env.TEST_DATABASE_URL;

    prisma = new PrismaService(new AppConfigService());
    service = new LegacyIdMapperService(prisma);

    const account = await prisma.employeeAccount.create({
      data: {
        name: 'Migration Test Employee',
        email: `legacy-id-mapper-${randomUUID()}@example.com`,
        emailVerified: true,
        role: 'super_admin',
      },
    });
    seededAccountIds.push(account.id);
    const employee = await prisma.employee.create({
      data: { accountId: account.id },
    });
    employeeId = employee.id;
  });

  afterAll(async () => {
    if (seededAccountIds.length > 0) {
      await prisma.employeeAccount.deleteMany({
        where: { id: { in: seededAccountIds } },
      });
    }
    await prisma.$disconnect();
    process.env.DATABASE_URL = originalDatabaseUrl;
  });

  afterEach(async () => {
    if (seededJobIds.length > 0) {
      await prisma.migrationRecord.deleteMany({
        where: { lastProcessedJobId: { in: seededJobIds } },
      });
      await prisma.migrationJob.deleteMany({
        where: { id: { in: seededJobIds } },
      });
      seededJobIds.length = 0;
    }
  });

  async function seedJob() {
    const job = await prisma.migrationJob.create({
      data: { triggeredByEmployeeId: employeeId },
    });
    seededJobIds.push(job.id);
    return job;
  }

  describe('findExisting / resolveTargetId', () => {
    it('returns null for a legacy entity never seen before', async () => {
      const found = await service.findExisting(
        MigrationDomain.CUSTOMER_IDENTITY,
        'CardUser',
        randomUUID(),
      );
      expect(found).toBeNull();

      const resolved = await service.resolveTargetId(
        MigrationDomain.CUSTOMER_IDENTITY,
        'CardUser',
        randomUUID(),
      );
      expect(resolved).toBeNull();
    });

    it('resolveTargetId returns the targetId only for a SUCCESS record, not REJECTED/SKIPPED', async () => {
      const job = await seedJob();
      const sourceId = randomUUID();
      const targetId = randomUUID();

      await service.recordRejected({
        domain: MigrationDomain.CUSTOMER_IDENTITY,
        sourceTable: 'CardUser',
        sourceId,
        reason: 'EMAIL_ALREADY_EXISTS_IN_TARGET',
        jobId: job.id,
      });
      await expect(
        service.resolveTargetId(
          MigrationDomain.CUSTOMER_IDENTITY,
          'CardUser',
          sourceId,
        ),
      ).resolves.toBeNull();

      await service.recordSuccess({
        domain: MigrationDomain.CUSTOMER_IDENTITY,
        sourceTable: 'CardUser',
        sourceId,
        targetTable: 'Customer',
        targetId,
        jobId: job.id,
      });
      await expect(
        service.resolveTargetId(
          MigrationDomain.CUSTOMER_IDENTITY,
          'CardUser',
          sourceId,
        ),
      ).resolves.toBe(targetId);
    });
  });

  describe('recordSuccess', () => {
    it('creates a SUCCESS record and increments the job counters', async () => {
      const job = await seedJob();
      const sourceId = randomUUID();
      const targetId = randomUUID();

      await service.recordSuccess({
        domain: MigrationDomain.CUSTOMER_IDENTITY,
        sourceTable: 'CardUser',
        sourceId,
        targetTable: 'Customer',
        targetId,
        jobId: job.id,
      });

      const record = await prisma.migrationRecord.findUniqueOrThrow({
        where: {
          domain_sourceTable_sourceId: {
            domain: MigrationDomain.CUSTOMER_IDENTITY,
            sourceTable: 'CardUser',
            sourceId,
          },
        },
      });
      expect(record.status).toBe(MigrationRecordStatus.SUCCESS);
      expect(record.targetId).toBe(targetId);
      expect(record.reason).toBeNull();

      const updatedJob = await prisma.migrationJob.findUniqueOrThrow({
        where: { id: job.id },
      });
      expect(updatedJob.processedRecords).toBe(1);
      expect(updatedJob.successCount).toBe(1);
      expect(updatedJob.rejectedCount).toBe(0);
      expect(updatedJob.skippedCount).toBe(0);
    });

    it('stores an optional note in `reason` even though the status is SUCCESS', async () => {
      const job = await seedJob();
      const sourceId = randomUUID();

      await service.recordSuccess({
        domain: MigrationDomain.SMART_CARD,
        sourceTable: 'SmartCard',
        sourceId,
        targetTable: 'SmartCard',
        targetId: randomUUID(),
        jobId: job.id,
        note: 'OWNER_NOT_MIGRATED_CARD_UNASSIGNED',
      });

      const record = await prisma.migrationRecord.findUniqueOrThrow({
        where: {
          domain_sourceTable_sourceId: {
            domain: MigrationDomain.SMART_CARD,
            sourceTable: 'SmartCard',
            sourceId,
          },
        },
      });
      expect(record.status).toBe(MigrationRecordStatus.SUCCESS);
      expect(record.reason).toBe('OWNER_NOT_MIGRATED_CARD_UNASSIGNED');
    });
  });

  describe('recordRejected', () => {
    it('creates a REJECTED record with the given reason and increments rejectedCount', async () => {
      const job = await seedJob();
      const sourceId = randomUUID();

      await service.recordRejected({
        domain: MigrationDomain.ECARD,
        sourceTable: 'ECard',
        sourceId,
        reason: 'ENDPOINT_ALREADY_TAKEN',
        jobId: job.id,
      });

      const record = await prisma.migrationRecord.findUniqueOrThrow({
        where: {
          domain_sourceTable_sourceId: {
            domain: MigrationDomain.ECARD,
            sourceTable: 'ECard',
            sourceId,
          },
        },
      });
      expect(record.status).toBe(MigrationRecordStatus.REJECTED);
      expect(record.reason).toBe('ENDPOINT_ALREADY_TAKEN');
      expect(record.targetId).toBeNull();

      const updatedJob = await prisma.migrationJob.findUniqueOrThrow({
        where: { id: job.id },
      });
      expect(updatedJob.rejectedCount).toBe(1);
    });

    it('flipping a prior REJECTED record to SUCCESS on retry clears targetTable/targetId back in, reason back out', async () => {
      const jobA = await seedJob();
      const jobB = await seedJob();
      const sourceId = randomUUID();
      const targetId = randomUUID();

      await service.recordRejected({
        domain: MigrationDomain.ECARD,
        sourceTable: 'ECard',
        sourceId,
        reason: 'OWNING_CUSTOMER_NOT_MIGRATED',
        jobId: jobA.id,
      });

      await service.recordSuccess({
        domain: MigrationDomain.ECARD,
        sourceTable: 'ECard',
        sourceId,
        targetTable: 'ECard',
        targetId,
        jobId: jobB.id,
      });

      const record = await prisma.migrationRecord.findUniqueOrThrow({
        where: {
          domain_sourceTable_sourceId: {
            domain: MigrationDomain.ECARD,
            sourceTable: 'ECard',
            sourceId,
          },
        },
      });
      expect(record.status).toBe(MigrationRecordStatus.SUCCESS);
      expect(record.reason).toBeNull();
      expect(record.targetId).toBe(targetId);
      expect(record.lastProcessedJobId).toBe(jobB.id);
    });
  });

  describe('recordSkipped', () => {
    it('creates a SKIPPED record and increments the job skippedCount', async () => {
      const job = await seedJob();
      const sourceId = randomUUID();

      await service.recordSkipped({
        domain: MigrationDomain.MEDIA,
        sourceTable: 'ECard.imageUrl',
        sourceId,
        reason: 'NO_MEDIA_REFERENCE',
        jobId: job.id,
      });

      const record = await prisma.migrationRecord.findUniqueOrThrow({
        where: {
          domain_sourceTable_sourceId: {
            domain: MigrationDomain.MEDIA,
            sourceTable: 'ECard.imageUrl',
            sourceId,
          },
        },
      });
      expect(record.status).toBe(MigrationRecordStatus.SKIPPED);

      const updatedJob = await prisma.migrationJob.findUniqueOrThrow({
        where: { id: job.id },
      });
      expect(updatedJob.skippedCount).toBe(1);
    });
  });

  describe('touchExistingSuccess', () => {
    it('re-points lastProcessedJobId at the new job and bumps skippedCount, without touching status/targetId', async () => {
      const jobA = await seedJob();
      const jobB = await seedJob();
      const sourceId = randomUUID();
      const targetId = randomUUID();

      await service.recordSuccess({
        domain: MigrationDomain.CUSTOMER_IDENTITY,
        sourceTable: 'CardUser',
        sourceId,
        targetTable: 'Customer',
        targetId,
        jobId: jobA.id,
      });

      await service.touchExistingSuccess(
        MigrationDomain.CUSTOMER_IDENTITY,
        'CardUser',
        sourceId,
        jobB.id,
      );

      const record = await prisma.migrationRecord.findUniqueOrThrow({
        where: {
          domain_sourceTable_sourceId: {
            domain: MigrationDomain.CUSTOMER_IDENTITY,
            sourceTable: 'CardUser',
            sourceId,
          },
        },
      });
      expect(record.status).toBe(MigrationRecordStatus.SUCCESS);
      expect(record.targetId).toBe(targetId);
      expect(record.lastProcessedJobId).toBe(jobB.id);

      const updatedJobB = await prisma.migrationJob.findUniqueOrThrow({
        where: { id: jobB.id },
      });
      expect(updatedJobB.processedRecords).toBe(1);
      expect(updatedJobB.skippedCount).toBe(1);
      expect(updatedJobB.successCount).toBe(0);
    });
  });

  describe('uniqueness — one MigrationRecord ever per (domain, sourceTable, sourceId)', () => {
    it('re-running recordSuccess for the same key upserts in place rather than creating a duplicate row', async () => {
      const job = await seedJob();
      const sourceId = randomUUID();
      const targetId = randomUUID();

      await service.recordSuccess({
        domain: MigrationDomain.ORGANISATION,
        sourceTable: 'Organisation',
        sourceId,
        targetTable: 'Organisation',
        targetId,
        jobId: job.id,
      });
      await service.recordSuccess({
        domain: MigrationDomain.ORGANISATION,
        sourceTable: 'Organisation',
        sourceId,
        targetTable: 'Organisation',
        targetId,
        jobId: job.id,
      });

      const records = await prisma.migrationRecord.findMany({
        where: {
          domain: MigrationDomain.ORGANISATION,
          sourceTable: 'Organisation',
          sourceId,
        },
      });
      expect(records).toHaveLength(1);
    });
  });
});
