import { Injectable } from '@nestjs/common';
import {
  MigrationDomain,
  MigrationRecordStatus,
} from '../../../../generated/prisma/client';
import { LegacyOrgMemberRole } from '../../../../generated/legacy-prisma/client';
import type { LegacyOrganisation } from '../../../../generated/legacy-prisma/client';
import { PrismaService } from '../../../../common/prisma/prisma.service';
import { LegacyPrismaService } from '../../../../common/legacy-db/legacy-prisma.service';
import { LegacyIdMapperService } from '../legacy-id-mapper.service';
import { iterateLegacyRows } from '../iterate-legacy-rows.util';
import {
  MIGRATION_REJECTION_REASON,
  MIGRATION_SOURCE_TABLE,
} from '../../migration.constants';
import type { DomainMigrator } from './domain-migrator.interface';

// Legacy Organisation.domainName has no target field in the new schema and
// is dropped entirely (see the migration plan's open items — nothing in
// the new app reads it). createdByCustomerId has no legacy equivalent
// either, so it's inferred: if the org has exactly one legacy SPOC member
// (already migrated by the time this runs — CUSTOMER_IDENTITY precedes
// ORGANISATION in the orchestration order), that customer becomes the
// creator; otherwise null.
@Injectable()
export class OrganisationMigrator implements DomainMigrator {
  readonly domain = MigrationDomain.ORGANISATION;

  constructor(
    private readonly prisma: PrismaService,
    private readonly legacyPrisma: LegacyPrismaService,
    private readonly idMapper: LegacyIdMapperService,
  ) {}

  async countTotal(): Promise<number> {
    return this.legacyPrisma.legacyOrganisation.count();
  }

  async migrate(jobId: string): Promise<void> {
    await iterateLegacyRows(
      (skip, take) =>
        this.legacyPrisma.legacyOrganisation.findMany({
          skip,
          take,
          orderBy: { id: 'asc' },
        }),
      (legacyOrganisation) => this.migrateOne(legacyOrganisation, jobId),
    );
  }

  private async migrateOne(
    legacyOrganisation: LegacyOrganisation,
    jobId: string,
  ): Promise<void> {
    const existing = await this.idMapper.findExisting(
      this.domain,
      MIGRATION_SOURCE_TABLE.ORGANISATION,
      legacyOrganisation.id,
    );
    if (existing?.status === MigrationRecordStatus.SUCCESS) {
      await this.idMapper.touchExistingSuccess(
        this.domain,
        MIGRATION_SOURCE_TABLE.ORGANISATION,
        legacyOrganisation.id,
        jobId,
      );
      return;
    }

    try {
      const createdByCustomerId = await this.inferCreatedByCustomerId(
        legacyOrganisation.id,
      );

      const organisation = await this.prisma.organisation.create({
        data: {
          name: legacyOrganisation.displayName,
          createdByCustomerId,
        },
      });

      await this.idMapper.recordSuccess({
        domain: this.domain,
        sourceTable: MIGRATION_SOURCE_TABLE.ORGANISATION,
        sourceId: legacyOrganisation.id,
        targetTable: 'Organisation',
        targetId: organisation.id,
        jobId,
      });
    } catch {
      await this.idMapper.recordRejected({
        domain: this.domain,
        sourceTable: MIGRATION_SOURCE_TABLE.ORGANISATION,
        sourceId: legacyOrganisation.id,
        reason: MIGRATION_REJECTION_REASON.UNEXPECTED_DATABASE_ERROR,
        jobId,
      });
    }
  }

  private async inferCreatedByCustomerId(
    legacyOrganisationId: string,
  ): Promise<string | null> {
    const spocMembers =
      await this.legacyPrisma.legacyOrganisationMember.findMany({
        where: {
          organisationId: legacyOrganisationId,
          role: LegacyOrgMemberRole.SPOC,
        },
        select: { cardUserId: true },
      });
    if (spocMembers.length !== 1) {
      return null;
    }
    return this.idMapper.resolveTargetId(
      MigrationDomain.CUSTOMER_IDENTITY,
      MIGRATION_SOURCE_TABLE.CARD_USER,
      spocMembers[0].cardUserId,
    );
  }
}
