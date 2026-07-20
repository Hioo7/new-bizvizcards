import { Module } from '@nestjs/common';
import { LegacyDbModule } from '../../common/legacy-db/legacy-db.module';
import { MigrationController } from './migration.controller';
import { MigrationOrchestratorService } from './services/migration-orchestrator.service';
import { MigrationJobsService } from './services/migration-jobs.service';
import { MigrationPreflightService } from './services/migration-preflight.service';
import { LegacyIdMapperService } from './services/legacy-id-mapper.service';
import { LegacyMediaStagingClient } from './services/legacy-media-staging-client.service';
import { LegacyMediaTransferService } from './services/legacy-media-transfer.service';
import { MIGRATION_DOMAIN_MIGRATORS } from './services/migrators/domain-migrator.interface';
import { StaffIdentityMigrator } from './services/migrators/staff-identity.migrator';
import { CustomerIdentityMigrator } from './services/migrators/customer-identity.migrator';
import { OrganisationMigrator } from './services/migrators/organisation.migrator';
import { OrganisationMemberMigrator } from './services/migrators/organisation-member.migrator';
import { SmartCardMigrator } from './services/migrators/smart-card.migrator';
import { EcardMigrator } from './services/migrators/ecard.migrator';
import { LeadFolderMigrator } from './services/migrators/lead-folder.migrator';
import { LeadMigrator } from './services/migrators/lead.migrator';
import { RestrictedRouteMigrator } from './services/migrators/restricted-route.migrator';
import { InternalRedirectMigrator } from './services/migrators/internal-redirect.migrator';
import { ExternalRedirectMigrator } from './services/migrators/external-redirect.migrator';

@Module({
  imports: [LegacyDbModule],
  controllers: [MigrationController],
  providers: [
    MigrationOrchestratorService,
    MigrationJobsService,
    MigrationPreflightService,
    LegacyIdMapperService,
    LegacyMediaStagingClient,
    LegacyMediaTransferService,
    StaffIdentityMigrator,
    CustomerIdentityMigrator,
    OrganisationMigrator,
    OrganisationMemberMigrator,
    SmartCardMigrator,
    EcardMigrator,
    LeadFolderMigrator,
    LeadMigrator,
    RestrictedRouteMigrator,
    InternalRedirectMigrator,
    ExternalRedirectMigrator,
    // Array order here is the actual migration execution order (see
    // domain-migrator.interface.ts): identities first, then organisations,
    // then the two card types (each resolves its owning customer), then
    // leads (leaf data with no downstream dependents). The three redirect
    // migrators are appended last — they're fully independent of every
    // other domain (no FK to resolve either way), so their position doesn't
    // affect correctness.
    {
      provide: MIGRATION_DOMAIN_MIGRATORS,
      useFactory: (
        staffIdentity: StaffIdentityMigrator,
        customerIdentity: CustomerIdentityMigrator,
        organisation: OrganisationMigrator,
        organisationMember: OrganisationMemberMigrator,
        smartCard: SmartCardMigrator,
        ecard: EcardMigrator,
        leadFolder: LeadFolderMigrator,
        lead: LeadMigrator,
        restrictedRoute: RestrictedRouteMigrator,
        internalRedirect: InternalRedirectMigrator,
        externalRedirect: ExternalRedirectMigrator,
      ) => [
        staffIdentity,
        customerIdentity,
        organisation,
        organisationMember,
        smartCard,
        ecard,
        leadFolder,
        lead,
        restrictedRoute,
        internalRedirect,
        externalRedirect,
      ],
      inject: [
        StaffIdentityMigrator,
        CustomerIdentityMigrator,
        OrganisationMigrator,
        OrganisationMemberMigrator,
        SmartCardMigrator,
        EcardMigrator,
        LeadFolderMigrator,
        LeadMigrator,
        RestrictedRouteMigrator,
        InternalRedirectMigrator,
        ExternalRedirectMigrator,
      ],
    },
  ],
})
export class MigrationModule {}
