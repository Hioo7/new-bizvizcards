/** How often the pre-flight checklist auto-rechecks while any check is
 * still failing — stops once every check has passed. */
export const PREFLIGHT_POLL_INTERVAL_MS = 5_000;

/** How often a running/pending job's status is re-fetched — matches the
 * legacy migration tool's own polling cadence. */
export const MIGRATION_JOB_POLL_INTERVAL_MS = 3_000;

export const MIGRATION_JOBS_LIST_PAGE_SIZE = 10;
export const MIGRATION_RECORDS_LIST_PAGE_SIZE = 25;

/** Job statuses past which a job will never change again — used to decide
 * when to stop polling a job (or a list containing one). */
export const MIGRATION_TERMINAL_JOB_STATUSES: readonly MigrationJobStatus[] = [
  "COMPLETED",
  "FAILED",
];

/** Every distinct status string that can appear across pre-flight checks,
 * migration jobs, and migration records — one shared badge (MigrationStatusBadge)
 * renders all three, so labels/tones live in one place rather than per-context. */
export type MigrationStatusValue =
  | "PASSED"
  | "FAILED"
  | "PENDING"
  | "RUNNING"
  | "COMPLETED"
  | "SUCCESS"
  | "REJECTED"
  | "SKIPPED";

export type MigrationStatusTone =
  | "success"
  | "error"
  | "warning"
  | "info"
  | "neutral";

export const MIGRATION_STATUS_LABELS: Record<MigrationStatusValue, string> = {
  PASSED: "Passed",
  FAILED: "Failed",
  PENDING: "Pending",
  RUNNING: "Running",
  COMPLETED: "Completed",
  SUCCESS: "Success",
  REJECTED: "Rejected",
  SKIPPED: "Skipped",
};

export const MIGRATION_STATUS_TONES: Record<MigrationStatusValue, MigrationStatusTone> = {
  PASSED: "success",
  FAILED: "error",
  PENDING: "neutral",
  RUNNING: "info",
  COMPLETED: "success",
  SUCCESS: "success",
  REJECTED: "error",
  SKIPPED: "warning",
};

import type {
  MigrationDomain,
  MigrationJobStatus,
  MigrationRecordStatus,
} from "../types";

export const MIGRATION_DOMAIN_OPTIONS: { value: MigrationDomain; label: string }[] = [
  { value: "STAFF_IDENTITY", label: "Staff identity" },
  { value: "CUSTOMER_IDENTITY", label: "Customer identity" },
  { value: "ORGANISATION", label: "Organisation" },
  { value: "ORGANISATION_MEMBER", label: "Organisation member" },
  { value: "SMART_CARD", label: "Smart card" },
  { value: "ECARD", label: "E-card" },
  { value: "LEAD_FOLDER", label: "Lead folder" },
  { value: "LEAD", label: "Lead" },
  { value: "MEDIA", label: "Media" },
  { value: "RESTRICTED_ROUTE", label: "Restricted route" },
  { value: "INTERNAL_REDIRECT", label: "Internal redirect" },
  { value: "EXTERNAL_REDIRECT", label: "External redirect" },
];

export const MIGRATION_RECORD_STATUS_OPTIONS: {
  value: MigrationRecordStatus;
  label: string;
}[] = [
  { value: "SUCCESS", label: "Success" },
  { value: "REJECTED", label: "Rejected" },
  { value: "SKIPPED", label: "Skipped" },
];

/** Per-check operator guidance shown in the pre-flight checklist — the
 * exact tunnel/credential values are specific to whichever VPS is being
 * migrated from, so these are templates with placeholders to fill in, not
 * live-generated commands. Frontend-only presentational content; kept here
 * rather than on the backend response since it's purely instructional. */
export const PREFLIGHT_CHECK_GUIDANCE: Record<
  string,
  { instructions: string; command?: string }
> = {
  LEGACY_DATABASE_CONNECTIVITY: {
    instructions:
      "Open an SSH tunnel to the legacy Postgres container, then set LEGACY_DATABASE_URL to the read-only role and restart the backend.",
    command:
      "ssh -N -L 5432:<postgres_container_ip>:5432 root@<vps-host>",
  },
  LEGACY_MEDIA_STAGING_CONNECTIVITY: {
    instructions:
      "Mirror the legacy MinIO bucket into the staging bucket, then set LEGACY_MEDIA_STAGING_BUCKET and restart the backend.",
    command:
      "mc mirror --overwrite legacy/media new/legacy-media-staging",
  },
  FALLBACK_PLAN_CONFIGURED: {
    instructions: "Run the fallback plan seed script on the new backend.",
    command: "npm run seed:fallback-plan",
  },
  SMART_CARD_TEMPLATES_SEEDED: {
    instructions: "Run the smart card template seed script on the new backend.",
    command: "npm run seed:smart-card-templates",
  },
};
