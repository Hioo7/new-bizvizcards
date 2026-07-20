import { Injectable } from '@nestjs/common';
import {
  MigrationDomain,
  MigrationRecordStatus,
  Prisma,
} from '../../../../generated/prisma/client';
import type { LegacyRedirectRoute } from '../../../../generated/legacy-prisma/client';
import { PrismaService } from '../../../../common/prisma/prisma.service';
import { LegacyPrismaService } from '../../../../common/legacy-db/legacy-prisma.service';
import { PRISMA_ERROR_CODES } from '../../../../common/constants/prisma-error-codes.constants';
import { LegacyIdMapperService } from '../legacy-id-mapper.service';
import { iterateLegacyRows } from '../iterate-legacy-rows.util';
import {
  MIGRATION_REJECTION_REASON,
  MIGRATION_SOURCE_TABLE,
  MigrationRejectionReason,
} from '../../migration.constants';
import type { DomainMigrator } from './domain-migrator.interface';

// Fully independent domain — no FK to any other legacy or new-app model.
// Legacy already blocks creating a RedirectRoute whose oldRoute matches a
// RestrictedRoute at creation time, so existing legacy rows are trusted as
// already valid — this migrator does not re-check the new app's own
// restricted-path rule (it writes directly via Prisma, not through
// InternalRedirectsService, matching every other migrator's convention).
@Injectable()
export class InternalRedirectMigrator implements DomainMigrator {
  readonly domain = MigrationDomain.INTERNAL_REDIRECT;

  constructor(
    private readonly prisma: PrismaService,
    private readonly legacyPrisma: LegacyPrismaService,
    private readonly idMapper: LegacyIdMapperService,
  ) {}

  async countTotal(): Promise<number> {
    return this.legacyPrisma.legacyRedirectRoute.count();
  }

  async migrate(jobId: string): Promise<void> {
    await iterateLegacyRows(
      (skip, take) =>
        this.legacyPrisma.legacyRedirectRoute.findMany({
          skip,
          take,
          orderBy: { id: 'asc' },
        }),
      (legacyRedirect) => this.migrateOne(legacyRedirect, jobId),
    );
  }

  private async migrateOne(
    legacyRedirect: LegacyRedirectRoute,
    jobId: string,
  ): Promise<void> {
    const existing = await this.idMapper.findExisting(
      this.domain,
      MIGRATION_SOURCE_TABLE.REDIRECT_ROUTE,
      legacyRedirect.id,
    );
    if (existing?.status === MigrationRecordStatus.SUCCESS) {
      await this.idMapper.touchExistingSuccess(
        this.domain,
        MIGRATION_SOURCE_TABLE.REDIRECT_ROUTE,
        legacyRedirect.id,
        jobId,
      );
      return;
    }

    try {
      const redirect = await this.prisma.internalRedirectRoute.create({
        data: {
          sourcePath: legacyRedirect.oldRoute,
          targetPath: legacyRedirect.newRoute,
          enabled: legacyRedirect.enabled,
          createdByEmployeeId: null,
        },
      });

      await this.idMapper.recordSuccess({
        domain: this.domain,
        sourceTable: MIGRATION_SOURCE_TABLE.REDIRECT_ROUTE,
        sourceId: legacyRedirect.id,
        targetTable: 'InternalRedirectRoute',
        targetId: redirect.id,
        jobId,
      });
    } catch (error) {
      await this.idMapper.recordRejected({
        domain: this.domain,
        sourceTable: MIGRATION_SOURCE_TABLE.REDIRECT_ROUTE,
        sourceId: legacyRedirect.id,
        reason: this.classifyError(error),
        jobId,
      });
    }
  }

  private classifyError(error: unknown): MigrationRejectionReason {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === PRISMA_ERROR_CODES.UNIQUE_CONSTRAINT_VIOLATION
    ) {
      return MIGRATION_REJECTION_REASON.SOURCE_PATH_ALREADY_TAKEN;
    }
    return MIGRATION_REJECTION_REASON.UNEXPECTED_DATABASE_ERROR;
  }
}
