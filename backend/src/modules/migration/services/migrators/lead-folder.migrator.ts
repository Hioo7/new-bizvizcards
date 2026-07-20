import { Injectable } from '@nestjs/common';
import {
  MigrationDomain,
  MigrationRecordStatus,
} from '../../../../generated/prisma/client';
import type { LegacyLeadFolder } from '../../../../generated/legacy-prisma/client';
import { PrismaService } from '../../../../common/prisma/prisma.service';
import { LegacyPrismaService } from '../../../../common/legacy-db/legacy-prisma.service';
import { LegacyIdMapperService } from '../legacy-id-mapper.service';
import { iterateLegacyRows } from '../iterate-legacy-rows.util';
import {
  MIGRATION_REJECTION_REASON,
  MIGRATION_SOURCE_TABLE,
} from '../../migration.constants';
import type { DomainMigrator } from './domain-migrator.interface';

// After every legacy LeadFolder is migrated, backfills
// Customer.defaultLeadFolderId from legacy CardUser.defaultLeadFolderId —
// this only depends on LEAD_FOLDER having run, not LEAD, so it's colocated
// here rather than in lead.migrator.ts. Not tracked via its own
// MigrationRecord: re-running it just re-applies the same (idempotent)
// update, so no separate ledger entry is needed.
@Injectable()
export class LeadFolderMigrator implements DomainMigrator {
  readonly domain = MigrationDomain.LEAD_FOLDER;

  constructor(
    private readonly prisma: PrismaService,
    private readonly legacyPrisma: LegacyPrismaService,
    private readonly idMapper: LegacyIdMapperService,
  ) {}

  async countTotal(): Promise<number> {
    return this.legacyPrisma.legacyLeadFolder.count();
  }

  async migrate(jobId: string): Promise<void> {
    await iterateLegacyRows(
      (skip, take) =>
        this.legacyPrisma.legacyLeadFolder.findMany({
          skip,
          take,
          orderBy: { id: 'asc' },
        }),
      (legacyLeadFolder) => this.migrateOne(legacyLeadFolder, jobId),
    );

    await this.backfillDefaultLeadFolders();
  }

  private async migrateOne(
    legacyLeadFolder: LegacyLeadFolder,
    jobId: string,
  ): Promise<void> {
    const existing = await this.idMapper.findExisting(
      this.domain,
      MIGRATION_SOURCE_TABLE.LEAD_FOLDER,
      legacyLeadFolder.id,
    );
    if (existing?.status === MigrationRecordStatus.SUCCESS) {
      await this.idMapper.touchExistingSuccess(
        this.domain,
        MIGRATION_SOURCE_TABLE.LEAD_FOLDER,
        legacyLeadFolder.id,
        jobId,
      );
      return;
    }

    const customerId = await this.idMapper.resolveTargetId(
      MigrationDomain.CUSTOMER_IDENTITY,
      MIGRATION_SOURCE_TABLE.CARD_USER,
      legacyLeadFolder.cardUserId,
    );
    if (!customerId) {
      await this.idMapper.recordRejected({
        domain: this.domain,
        sourceTable: MIGRATION_SOURCE_TABLE.LEAD_FOLDER,
        sourceId: legacyLeadFolder.id,
        reason: MIGRATION_REJECTION_REASON.OWNING_CUSTOMER_NOT_MIGRATED,
        jobId,
      });
      return;
    }

    try {
      const folder = await this.prisma.leadFolder.create({
        data: { customerId, name: legacyLeadFolder.name },
      });
      await this.idMapper.recordSuccess({
        domain: this.domain,
        sourceTable: MIGRATION_SOURCE_TABLE.LEAD_FOLDER,
        sourceId: legacyLeadFolder.id,
        targetTable: 'LeadFolder',
        targetId: folder.id,
        jobId,
      });
    } catch {
      await this.idMapper.recordRejected({
        domain: this.domain,
        sourceTable: MIGRATION_SOURCE_TABLE.LEAD_FOLDER,
        sourceId: legacyLeadFolder.id,
        reason: MIGRATION_REJECTION_REASON.UNEXPECTED_DATABASE_ERROR,
        jobId,
      });
    }
  }

  private async backfillDefaultLeadFolders(): Promise<void> {
    await iterateLegacyRows(
      (skip, take) =>
        this.legacyPrisma.legacyCardUser.findMany({
          skip,
          take,
          orderBy: { id: 'asc' },
          where: { defaultLeadFolderId: { not: null } },
          select: { id: true, defaultLeadFolderId: true },
        }),
      async (legacyCardUser) => {
        const customerId = await this.idMapper.resolveTargetId(
          MigrationDomain.CUSTOMER_IDENTITY,
          MIGRATION_SOURCE_TABLE.CARD_USER,
          legacyCardUser.id,
        );
        const leadFolderId = legacyCardUser.defaultLeadFolderId
          ? await this.idMapper.resolveTargetId(
              this.domain,
              MIGRATION_SOURCE_TABLE.LEAD_FOLDER,
              legacyCardUser.defaultLeadFolderId,
            )
          : null;
        if (!customerId || !leadFolderId) {
          return;
        }
        await this.prisma.customer.update({
          where: { id: customerId },
          data: { defaultLeadFolderId: leadFolderId },
        });
      },
    );
  }
}
