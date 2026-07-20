import { Injectable } from '@nestjs/common';
import {
  MigrationDomain,
  MigrationRecordStatus,
  Prisma,
} from '../../../../generated/prisma/client';
import type { LegacyExternalRedirectRoute } from '../../../../generated/legacy-prisma/client';
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
// Unlike internal redirects, legacy never cross-checked an external
// redirect's internalPath against RestrictedRoute at creation time, so this
// migrator preserves that same (lack of) validation — writes directly via
// Prisma, not through ExternalRedirectsService, matching every other
// migrator's convention of never calling into a feature module's service.
@Injectable()
export class ExternalRedirectMigrator implements DomainMigrator {
  readonly domain = MigrationDomain.EXTERNAL_REDIRECT;

  constructor(
    private readonly prisma: PrismaService,
    private readonly legacyPrisma: LegacyPrismaService,
    private readonly idMapper: LegacyIdMapperService,
  ) {}

  async countTotal(): Promise<number> {
    return this.legacyPrisma.legacyExternalRedirectRoute.count();
  }

  async migrate(jobId: string): Promise<void> {
    await iterateLegacyRows(
      (skip, take) =>
        this.legacyPrisma.legacyExternalRedirectRoute.findMany({
          skip,
          take,
          orderBy: { id: 'asc' },
        }),
      (legacyRedirect) => this.migrateOne(legacyRedirect, jobId),
    );
  }

  private async migrateOne(
    legacyRedirect: LegacyExternalRedirectRoute,
    jobId: string,
  ): Promise<void> {
    const existing = await this.idMapper.findExisting(
      this.domain,
      MIGRATION_SOURCE_TABLE.EXTERNAL_REDIRECT_ROUTE,
      legacyRedirect.id,
    );
    if (existing?.status === MigrationRecordStatus.SUCCESS) {
      await this.idMapper.touchExistingSuccess(
        this.domain,
        MIGRATION_SOURCE_TABLE.EXTERNAL_REDIRECT_ROUTE,
        legacyRedirect.id,
        jobId,
      );
      return;
    }

    try {
      const redirect = await this.prisma.externalRedirectRoute.create({
        data: {
          sourcePath: legacyRedirect.internalPath,
          destinationUrl: legacyRedirect.externalUrl,
          enabled: legacyRedirect.enabled,
          createdByEmployeeId: null,
        },
      });

      await this.idMapper.recordSuccess({
        domain: this.domain,
        sourceTable: MIGRATION_SOURCE_TABLE.EXTERNAL_REDIRECT_ROUTE,
        sourceId: legacyRedirect.id,
        targetTable: 'ExternalRedirectRoute',
        targetId: redirect.id,
        jobId,
      });
    } catch (error) {
      await this.idMapper.recordRejected({
        domain: this.domain,
        sourceTable: MIGRATION_SOURCE_TABLE.EXTERNAL_REDIRECT_ROUTE,
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
