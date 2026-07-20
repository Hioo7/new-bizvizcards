import { Injectable } from '@nestjs/common';
import {
  MigrationDomain,
  MigrationRecordStatus,
  OrganisationMemberRole,
  OrganisationMemberStatus,
  Prisma,
} from '../../../../generated/prisma/client';
import { LegacyOrgMemberRole } from '../../../../generated/legacy-prisma/client';
import type { LegacyOrganisationMember } from '../../../../generated/legacy-prisma/client';
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

// Runs after both CUSTOMER_IDENTITY and ORGANISATION — resolves both FKs
// via LegacyIdMapperService rather than assuming legacy ids carry over.
// status has no legacy equivalent (legacy OrganisationMember has no such
// column) so every migrated membership defaults to ACTIVE.
@Injectable()
export class OrganisationMemberMigrator implements DomainMigrator {
  readonly domain = MigrationDomain.ORGANISATION_MEMBER;

  constructor(
    private readonly prisma: PrismaService,
    private readonly legacyPrisma: LegacyPrismaService,
    private readonly idMapper: LegacyIdMapperService,
  ) {}

  async countTotal(): Promise<number> {
    return this.legacyPrisma.legacyOrganisationMember.count();
  }

  async migrate(jobId: string): Promise<void> {
    await iterateLegacyRows(
      (skip, take) =>
        this.legacyPrisma.legacyOrganisationMember.findMany({
          skip,
          take,
          orderBy: { id: 'asc' },
        }),
      (legacyMember) => this.migrateOne(legacyMember, jobId),
    );
  }

  private async migrateOne(
    legacyMember: LegacyOrganisationMember,
    jobId: string,
  ): Promise<void> {
    const existing = await this.idMapper.findExisting(
      this.domain,
      MIGRATION_SOURCE_TABLE.ORGANISATION_MEMBER,
      legacyMember.id,
    );
    if (existing?.status === MigrationRecordStatus.SUCCESS) {
      await this.idMapper.touchExistingSuccess(
        this.domain,
        MIGRATION_SOURCE_TABLE.ORGANISATION_MEMBER,
        legacyMember.id,
        jobId,
      );
      return;
    }

    const organisationId = await this.idMapper.resolveTargetId(
      MigrationDomain.ORGANISATION,
      MIGRATION_SOURCE_TABLE.ORGANISATION,
      legacyMember.organisationId,
    );
    if (!organisationId) {
      await this.idMapper.recordRejected({
        domain: this.domain,
        sourceTable: MIGRATION_SOURCE_TABLE.ORGANISATION_MEMBER,
        sourceId: legacyMember.id,
        reason: MIGRATION_REJECTION_REASON.OWNING_ORGANISATION_NOT_MIGRATED,
        jobId,
      });
      return;
    }

    const customerId = await this.idMapper.resolveTargetId(
      MigrationDomain.CUSTOMER_IDENTITY,
      MIGRATION_SOURCE_TABLE.CARD_USER,
      legacyMember.cardUserId,
    );
    if (!customerId) {
      await this.idMapper.recordRejected({
        domain: this.domain,
        sourceTable: MIGRATION_SOURCE_TABLE.ORGANISATION_MEMBER,
        sourceId: legacyMember.id,
        reason: MIGRATION_REJECTION_REASON.MEMBER_CUSTOMER_NOT_MIGRATED,
        jobId,
      });
      return;
    }

    const role =
      legacyMember.role === LegacyOrgMemberRole.SPOC
        ? OrganisationMemberRole.SPOC
        : OrganisationMemberRole.MEMBER;

    try {
      const member = await this.prisma.organisationMember.create({
        data: {
          organisationId,
          customerId,
          role,
          status: OrganisationMemberStatus.ACTIVE,
        },
      });

      await this.idMapper.recordSuccess({
        domain: this.domain,
        sourceTable: MIGRATION_SOURCE_TABLE.ORGANISATION_MEMBER,
        sourceId: legacyMember.id,
        targetTable: 'OrganisationMember',
        targetId: member.id,
        jobId,
      });
    } catch (error) {
      await this.idMapper.recordRejected({
        domain: this.domain,
        sourceTable: MIGRATION_SOURCE_TABLE.ORGANISATION_MEMBER,
        sourceId: legacyMember.id,
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
      return MIGRATION_REJECTION_REASON.DUPLICATE_MEMBERSHIP;
    }
    return MIGRATION_REJECTION_REASON.UNEXPECTED_DATABASE_ERROR;
  }
}
