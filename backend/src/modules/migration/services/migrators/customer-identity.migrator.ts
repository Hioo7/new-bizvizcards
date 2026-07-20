import { Injectable } from '@nestjs/common';
import {
  MigrationDomain,
  MigrationRecordStatus,
  Prisma,
} from '../../../../generated/prisma/client';
import type { LegacyCardUser } from '../../../../generated/legacy-prisma/client';
import { PrismaService } from '../../../../common/prisma/prisma.service';
import { LegacyPrismaService } from '../../../../common/legacy-db/legacy-prisma.service';
import { PRISMA_ERROR_CODES } from '../../../../common/constants/prisma-error-codes.constants';
import { LegacyIdMapperService } from '../legacy-id-mapper.service';
import { iterateLegacyRows } from '../iterate-legacy-rows.util';
import { applyCustomerCredentialStrategy } from './customer-credential-strategy';
import { applyGoogleOAuthCredential } from './google-oauth-credential.migrator';
import {
  MIGRATION_REJECTION_REASON,
  MIGRATION_SOURCE_TABLE,
  MigrationRejectionReason,
} from '../../migration.constants';
import type { DomainMigrator } from './domain-migrator.interface';

// Migrates legacy CardUser -> CustomerAccount + Customer, then applies both
// credential strategies (see customer-credential-strategy.ts and
// google-oauth-credential.migrator.ts — bcrypt hash carried over directly,
// Google account pre-linked by sub). Customer.defaultLeadFolderId is left
// null here and backfilled after LeadFolder/Lead migrate (see lead.migrator.ts) —
// legacy's own defaultLeadFolderId points at a LeadFolder row that doesn't
// exist in the new schema yet at this point in the run.
@Injectable()
export class CustomerIdentityMigrator implements DomainMigrator {
  readonly domain = MigrationDomain.CUSTOMER_IDENTITY;

  constructor(
    private readonly prisma: PrismaService,
    private readonly legacyPrisma: LegacyPrismaService,
    private readonly idMapper: LegacyIdMapperService,
  ) {}

  async countTotal(): Promise<number> {
    return this.legacyPrisma.legacyCardUser.count();
  }

  async migrate(jobId: string): Promise<void> {
    const fallbackPlan = await this.prisma.plan.findFirst({
      where: { isFallbackPlan: true },
      select: { id: true },
    });

    await iterateLegacyRows(
      (skip, take) =>
        this.legacyPrisma.legacyCardUser.findMany({
          skip,
          take,
          orderBy: { id: 'asc' },
        }),
      (legacyCardUser) =>
        this.migrateOne(legacyCardUser, fallbackPlan?.id ?? null, jobId),
    );
  }

  private async migrateOne(
    legacyCardUser: LegacyCardUser,
    fallbackPlanId: string | null,
    jobId: string,
  ): Promise<void> {
    const existing = await this.idMapper.findExisting(
      this.domain,
      MIGRATION_SOURCE_TABLE.CARD_USER,
      legacyCardUser.id,
    );
    if (existing?.status === MigrationRecordStatus.SUCCESS) {
      await this.idMapper.touchExistingSuccess(
        this.domain,
        MIGRATION_SOURCE_TABLE.CARD_USER,
        legacyCardUser.id,
        jobId,
      );
      return;
    }

    if (!fallbackPlanId) {
      await this.idMapper.recordRejected({
        domain: this.domain,
        sourceTable: MIGRATION_SOURCE_TABLE.CARD_USER,
        sourceId: legacyCardUser.id,
        reason: MIGRATION_REJECTION_REASON.FALLBACK_PLAN_NOT_CONFIGURED,
        jobId,
      });
      return;
    }

    const alreadyTaken = await this.prisma.customerAccount.findUnique({
      where: { email: legacyCardUser.email },
      select: { id: true },
    });
    if (alreadyTaken) {
      await this.idMapper.recordRejected({
        domain: this.domain,
        sourceTable: MIGRATION_SOURCE_TABLE.CARD_USER,
        sourceId: legacyCardUser.id,
        reason: MIGRATION_REJECTION_REASON.EMAIL_ALREADY_EXISTS_IN_TARGET,
        jobId,
      });
      return;
    }

    try {
      const created = await this.prisma.$transaction(async (tx) => {
        const account = await tx.customerAccount.create({
          data: {
            name: legacyCardUser.name,
            email: legacyCardUser.email,
            emailVerified: false,
          },
        });
        const customer = await tx.customer.create({
          data: { accountId: account.id, currentPlanId: fallbackPlanId },
        });
        return { account, customer };
      });

      await applyCustomerCredentialStrategy(this.prisma, {
        legacyPasswordHash: legacyCardUser.password,
        customerAccountId: created.account.id,
      });
      await applyGoogleOAuthCredential(this.prisma, {
        legacyGoogleId: legacyCardUser.googleId,
        customerAccountId: created.account.id,
      });

      await this.idMapper.recordSuccess({
        domain: this.domain,
        sourceTable: MIGRATION_SOURCE_TABLE.CARD_USER,
        sourceId: legacyCardUser.id,
        targetTable: 'Customer',
        targetId: created.customer.id,
        jobId,
      });
    } catch (error) {
      await this.idMapper.recordRejected({
        domain: this.domain,
        sourceTable: MIGRATION_SOURCE_TABLE.CARD_USER,
        sourceId: legacyCardUser.id,
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
      return MIGRATION_REJECTION_REASON.EMAIL_ALREADY_EXISTS_IN_TARGET;
    }
    return MIGRATION_REJECTION_REASON.UNEXPECTED_DATABASE_ERROR;
  }
}
