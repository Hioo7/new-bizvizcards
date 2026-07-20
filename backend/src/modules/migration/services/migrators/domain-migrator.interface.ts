import { MigrationDomain } from '../../../../generated/prisma/client';

// One implementation per MigrationDomain, run in the exact array order
// they're registered in migration.module.ts (dependency order matters —
// e.g. CUSTOMER_IDENTITY must run before ECARD, since ECard migration
// resolves its owning Customer via LegacyIdMapperService). Each migrator is
// responsible for calling LegacyIdMapperService itself after every row it
// processes — job progress counters are updated live, per row, as a side
// effect of those calls, not aggregated and reported back here.
export interface DomainMigrator {
  readonly domain: MigrationDomain;

  // Total legacy rows this migrator will consider for the given job — used
  // by the orchestrator to set MigrationJob.totalRecords up front, so the
  // live-polling progress bar has a meaningful denominator from the start
  // rather than growing as each domain runs.
  countTotal(): Promise<number>;

  migrate(jobId: string): Promise<void>;
}

export const MIGRATION_DOMAIN_MIGRATORS = Symbol('MIGRATION_DOMAIN_MIGRATORS');
