import { Injectable } from '@nestjs/common';
import {
  MigrationDomain,
  MigrationRecordStatus,
} from '../../../../generated/prisma/client';
import type { LegacyCardUserLead } from '../../../../generated/legacy-prisma/client';
import { PrismaService } from '../../../../common/prisma/prisma.service';
import { LegacyPrismaService } from '../../../../common/legacy-db/legacy-prisma.service';
import { LegacyIdMapperService } from '../legacy-id-mapper.service';
import { iterateLegacyRows } from '../iterate-legacy-rows.util';
import {
  MIGRATION_REJECTION_REASON,
  MIGRATION_SOURCE_TABLE,
} from '../../migration.constants';
import type { DomainMigrator } from './domain-migrator.interface';

// sourcedBy defaults to MANUAL_ENTRY and stage stays null at the Prisma
// schema level (see prisma/schema/lead.prisma) — legacy CardUserLead has no
// equivalent data for either, so this migrator simply omits both fields
// rather than setting them explicitly, letting the schema defaults apply.
// A lead whose legacy folderId doesn't resolve degrades to folderId: null
// (Lead.folderId is optional) rather than rejecting the whole lead — only
// the owning customer is a hard dependency.
@Injectable()
export class LeadMigrator implements DomainMigrator {
  readonly domain = MigrationDomain.LEAD;

  constructor(
    private readonly prisma: PrismaService,
    private readonly legacyPrisma: LegacyPrismaService,
    private readonly idMapper: LegacyIdMapperService,
  ) {}

  async countTotal(): Promise<number> {
    return this.legacyPrisma.legacyCardUserLead.count();
  }

  async migrate(jobId: string): Promise<void> {
    await iterateLegacyRows(
      (skip, take) =>
        this.legacyPrisma.legacyCardUserLead.findMany({
          skip,
          take,
          orderBy: { id: 'asc' },
        }),
      (legacyLead) => this.migrateOne(legacyLead, jobId),
    );
  }

  private async migrateOne(
    legacyLead: LegacyCardUserLead,
    jobId: string,
  ): Promise<void> {
    const existing = await this.idMapper.findExisting(
      this.domain,
      MIGRATION_SOURCE_TABLE.CARD_USER_LEAD,
      legacyLead.id,
    );
    if (existing?.status === MigrationRecordStatus.SUCCESS) {
      await this.idMapper.touchExistingSuccess(
        this.domain,
        MIGRATION_SOURCE_TABLE.CARD_USER_LEAD,
        legacyLead.id,
        jobId,
      );
      return;
    }

    const customerId = await this.idMapper.resolveTargetId(
      MigrationDomain.CUSTOMER_IDENTITY,
      MIGRATION_SOURCE_TABLE.CARD_USER,
      legacyLead.cardUserId,
    );
    if (!customerId) {
      await this.idMapper.recordRejected({
        domain: this.domain,
        sourceTable: MIGRATION_SOURCE_TABLE.CARD_USER_LEAD,
        sourceId: legacyLead.id,
        reason: MIGRATION_REJECTION_REASON.OWNING_CUSTOMER_NOT_MIGRATED,
        jobId,
      });
      return;
    }

    const folderId = legacyLead.folderId
      ? await this.idMapper.resolveTargetId(
          MigrationDomain.LEAD_FOLDER,
          MIGRATION_SOURCE_TABLE.LEAD_FOLDER,
          legacyLead.folderId,
        )
      : null;

    try {
      const lead = await this.prisma.lead.create({
        data: {
          customerId,
          folderId,
          // Lead.name is required in the new schema; legacy name is
          // nullable — falls back to an empty string rather than rejecting
          // an otherwise-migratable lead over a single missing display name.
          name: legacyLead.name ?? '',
          email: legacyLead.email,
          countryDialCode:
            legacyLead.mob_country_code != null
              ? `+${legacyLead.mob_country_code}`
              : null,
          phoneNumber:
            legacyLead.mobile_number != null
              ? String(legacyLead.mobile_number)
              : null,
          note: legacyLead.note,
          company: legacyLead.company,
          profession: legacyLead.profession,
          location: legacyLead.location,
          locationLatitude: legacyLead.location_latitude,
          locationLongitude: legacyLead.location_longitude,
        },
      });

      await this.idMapper.recordSuccess({
        domain: this.domain,
        sourceTable: MIGRATION_SOURCE_TABLE.CARD_USER_LEAD,
        sourceId: legacyLead.id,
        targetTable: 'Lead',
        targetId: lead.id,
        jobId,
      });
    } catch {
      await this.idMapper.recordRejected({
        domain: this.domain,
        sourceTable: MIGRATION_SOURCE_TABLE.CARD_USER_LEAD,
        sourceId: legacyLead.id,
        reason: MIGRATION_REJECTION_REASON.UNEXPECTED_DATABASE_ERROR,
        jobId,
      });
    }
  }
}
