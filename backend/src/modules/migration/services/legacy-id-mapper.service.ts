import { Injectable } from '@nestjs/common';
import {
  MigrationDomain,
  MigrationRecord,
  MigrationRecordStatus,
} from '../../../generated/prisma/client';
import { PrismaService } from '../../../common/prisma/prisma.service';
import type { MigrationRejectionReason } from '../migration.constants';

// The single choke point every migrator uses for idempotency and
// cross-domain legacy-id -> new-id resolution. One MigrationRecord row ever
// exists per (domain, sourceTable, sourceId) — see prisma/schema/migration.prisma
// for why a SUCCESS row is terminal while a REJECTED row is naturally
// retried on the next run.
@Injectable()
export class LegacyIdMapperService {
  constructor(private readonly prisma: PrismaService) {}

  // Returns the prior record for this legacy entity, if any exists yet —
  // callers branch on `.status` (SUCCESS = skip and re-touch; REJECTED =
  // retry; absent = first attempt).
  async findExisting(
    domain: MigrationDomain,
    sourceTable: string,
    sourceId: string,
  ): Promise<MigrationRecord | null> {
    return this.prisma.migrationRecord.findUnique({
      where: { domain_sourceTable_sourceId: { domain, sourceTable, sourceId } },
    });
  }

  // Resolves the new-schema id a legacy entity was migrated to, reading only
  // terminal SUCCESS records — this is how downstream migrators look up an
  // upstream dependency's new id (e.g. ECard migrator resolving the
  // Customer a legacy CardUser became).
  async resolveTargetId(
    domain: MigrationDomain,
    sourceTable: string,
    sourceId: string,
  ): Promise<string | null> {
    const record = await this.prisma.migrationRecord.findUnique({
      where: { domain_sourceTable_sourceId: { domain, sourceTable, sourceId } },
      select: { status: true, targetId: true },
    });
    if (!record || record.status !== MigrationRecordStatus.SUCCESS) {
      return null;
    }
    return record.targetId;
  }

  // A prior SUCCESS record needs no rework — just note that the current job
  // also observed it (and bump the job's live skippedCount), so the report
  // can distinguish "created this run" from "already existed from a prior
  // run" without reprocessing anything. Progress is written after every
  // single row, not batched, so the polling UI always reflects live state —
  // same reasoning as recordSuccess/recordRejected/recordSkipped below.
  async touchExistingSuccess(
    domain: MigrationDomain,
    sourceTable: string,
    sourceId: string,
    jobId: string,
  ): Promise<void> {
    await this.prisma.$transaction([
      this.prisma.migrationRecord.update({
        where: {
          domain_sourceTable_sourceId: { domain, sourceTable, sourceId },
        },
        data: { lastProcessedJobId: jobId },
      }),
      this.prisma.migrationJob.update({
        where: { id: jobId },
        data: {
          processedRecords: { increment: 1 },
          skippedCount: { increment: 1 },
        },
      }),
    ]);
  }

  async recordSuccess(params: {
    domain: MigrationDomain;
    sourceTable: string;
    sourceId: string;
    targetTable: string;
    targetId: string;
    jobId: string;
    // Optional informational note stored in `reason` even though the row
    // succeeded — e.g. SMART_CARD's OWNER_NOT_MIGRATED_CARD_UNASSIGNED,
    // where the card is still created (unclaimed) but the report should
    // flag that its original owner wasn't migrated. Not a rejection.
    note?: MigrationRejectionReason;
  }): Promise<void> {
    const {
      domain,
      sourceTable,
      sourceId,
      targetTable,
      targetId,
      jobId,
      note,
    } = params;
    await this.prisma.$transaction([
      this.prisma.migrationRecord.upsert({
        where: {
          domain_sourceTable_sourceId: { domain, sourceTable, sourceId },
        },
        create: {
          domain,
          sourceTable,
          sourceId,
          status: MigrationRecordStatus.SUCCESS,
          reason: note ?? null,
          targetTable,
          targetId,
          lastProcessedJobId: jobId,
        },
        update: {
          status: MigrationRecordStatus.SUCCESS,
          reason: note ?? null,
          targetTable,
          targetId,
          lastProcessedJobId: jobId,
        },
      }),
      this.prisma.migrationJob.update({
        where: { id: jobId },
        data: {
          processedRecords: { increment: 1 },
          successCount: { increment: 1 },
        },
      }),
    ]);
  }

  async recordRejected(params: {
    domain: MigrationDomain;
    sourceTable: string;
    sourceId: string;
    reason: MigrationRejectionReason;
    jobId: string;
  }): Promise<void> {
    const { domain, sourceTable, sourceId, reason, jobId } = params;
    await this.prisma.$transaction([
      this.prisma.migrationRecord.upsert({
        where: {
          domain_sourceTable_sourceId: { domain, sourceTable, sourceId },
        },
        create: {
          domain,
          sourceTable,
          sourceId,
          status: MigrationRecordStatus.REJECTED,
          reason,
          lastProcessedJobId: jobId,
        },
        update: {
          status: MigrationRecordStatus.REJECTED,
          reason,
          targetTable: null,
          targetId: null,
          lastProcessedJobId: jobId,
        },
      }),
      this.prisma.migrationJob.update({
        where: { id: jobId },
        data: {
          processedRecords: { increment: 1 },
          rejectedCount: { increment: 1 },
        },
      }),
    ]);
  }

  // For an entity that was genuinely inapplicable in this domain (e.g. a
  // legacy row with no media reference at all for the MEDIA domain) — not a
  // failure, just nothing to do. Distinct from touchExistingSuccess above
  // (which is about re-encountering a *prior success* on re-run) — this is
  // for a first-time determination that there was nothing to migrate.
  async recordSkipped(params: {
    domain: MigrationDomain;
    sourceTable: string;
    sourceId: string;
    reason: MigrationRejectionReason;
    jobId: string;
  }): Promise<void> {
    const { domain, sourceTable, sourceId, reason, jobId } = params;
    await this.prisma.$transaction([
      this.prisma.migrationRecord.upsert({
        where: {
          domain_sourceTable_sourceId: { domain, sourceTable, sourceId },
        },
        create: {
          domain,
          sourceTable,
          sourceId,
          status: MigrationRecordStatus.SKIPPED,
          reason,
          lastProcessedJobId: jobId,
        },
        update: {
          status: MigrationRecordStatus.SKIPPED,
          reason,
          targetTable: null,
          targetId: null,
          lastProcessedJobId: jobId,
        },
      }),
      this.prisma.migrationJob.update({
        where: { id: jobId },
        data: {
          processedRecords: { increment: 1 },
          skippedCount: { increment: 1 },
        },
      }),
    ]);
  }
}
