import { Injectable } from '@nestjs/common';
import {
  MigrationDomain,
  MigrationRecordStatus,
  Prisma,
} from '../../../../generated/prisma/client';
import type { LegacyRestrictedRoute } from '../../../../generated/legacy-prisma/client';
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

// Fully independent domain — no FK to any other legacy or new-app model, so
// there's no upstream id to resolve via LegacyIdMapperService. A blacklist
// of paths that can never be used as a redirect source; migrated as raw
// data only (this migrator writes directly via Prisma, not through
// RestrictedPathsService, matching every other migrator's convention of
// never calling into a feature module's own service layer).
@Injectable()
export class RestrictedRouteMigrator implements DomainMigrator {
  readonly domain = MigrationDomain.RESTRICTED_ROUTE;

  constructor(
    private readonly prisma: PrismaService,
    private readonly legacyPrisma: LegacyPrismaService,
    private readonly idMapper: LegacyIdMapperService,
  ) {}

  async countTotal(): Promise<number> {
    return this.legacyPrisma.legacyRestrictedRoute.count();
  }

  async migrate(jobId: string): Promise<void> {
    await iterateLegacyRows(
      (skip, take) =>
        this.legacyPrisma.legacyRestrictedRoute.findMany({
          skip,
          take,
          orderBy: { id: 'asc' },
        }),
      (legacyRoute) => this.migrateOne(legacyRoute, jobId),
    );
  }

  private async migrateOne(
    legacyRoute: LegacyRestrictedRoute,
    jobId: string,
  ): Promise<void> {
    const existing = await this.idMapper.findExisting(
      this.domain,
      MIGRATION_SOURCE_TABLE.RESTRICTED_ROUTE,
      legacyRoute.id,
    );
    if (existing?.status === MigrationRecordStatus.SUCCESS) {
      await this.idMapper.touchExistingSuccess(
        this.domain,
        MIGRATION_SOURCE_TABLE.RESTRICTED_ROUTE,
        legacyRoute.id,
        jobId,
      );
      return;
    }

    try {
      const path = await this.prisma.restrictedRedirectPath.create({
        data: { path: legacyRoute.endpoint },
      });

      await this.idMapper.recordSuccess({
        domain: this.domain,
        sourceTable: MIGRATION_SOURCE_TABLE.RESTRICTED_ROUTE,
        sourceId: legacyRoute.id,
        targetTable: 'RestrictedRedirectPath',
        targetId: path.id,
        jobId,
      });
    } catch (error) {
      await this.idMapper.recordRejected({
        domain: this.domain,
        sourceTable: MIGRATION_SOURCE_TABLE.RESTRICTED_ROUTE,
        sourceId: legacyRoute.id,
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
      return MIGRATION_REJECTION_REASON.RESTRICTED_PATH_ALREADY_TAKEN;
    }
    return MIGRATION_REJECTION_REASON.UNEXPECTED_DATABASE_ERROR;
  }
}
