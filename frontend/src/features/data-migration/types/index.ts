export type MigrationDomain =
  | "STAFF_IDENTITY"
  | "CUSTOMER_IDENTITY"
  | "ORGANISATION"
  | "ORGANISATION_MEMBER"
  | "SMART_CARD"
  | "ECARD"
  | "LEAD_FOLDER"
  | "LEAD"
  | "MEDIA"
  | "RESTRICTED_ROUTE"
  | "INTERNAL_REDIRECT"
  | "EXTERNAL_REDIRECT";

export type MigrationJobStatus = "PENDING" | "RUNNING" | "COMPLETED" | "FAILED";

export type MigrationRecordStatus = "SUCCESS" | "REJECTED" | "SKIPPED";

export interface MigrationJob {
  id: string;
  status: MigrationJobStatus;
  triggeredByEmployeeId: string;
  totalRecords: number;
  processedRecords: number;
  successCount: number;
  rejectedCount: number;
  skippedCount: number;
  errorMessage: string | null;
  startedAt: string | null;
  completedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface MigrationRecord {
  id: string;
  domain: MigrationDomain;
  sourceTable: string;
  sourceId: string;
  status: MigrationRecordStatus;
  reason: string | null;
  targetTable: string | null;
  targetId: string | null;
  lastProcessedJobId: string | null;
  createdAt: string;
  updatedAt: string;
}

export type MigrationPreflightCheckId =
  | "LEGACY_DATABASE_CONNECTIVITY"
  | "LEGACY_MEDIA_STAGING_CONNECTIVITY"
  | "FALLBACK_PLAN_CONFIGURED"
  | "SMART_CARD_TEMPLATES_SEEDED";

export type MigrationPreflightCheckStatus = "PASSED" | "FAILED";

export interface MigrationPreflightCheckResult {
  id: MigrationPreflightCheckId;
  label: string;
  status: MigrationPreflightCheckStatus;
  detail: string;
}

export interface MigrationPreflightSummary {
  checks: MigrationPreflightCheckResult[];
  canStart: boolean;
}

export interface PaginatedResult<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
}

export interface ListMigrationJobsQuery {
  page?: number;
  pageSize?: number;
}

export interface ListMigrationRecordsQuery {
  domain?: MigrationDomain;
  status?: MigrationRecordStatus;
  reason?: string;
  page?: number;
  pageSize?: number;
}
