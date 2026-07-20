import { MIGRATION_BASE_PATH } from "@config/api";
import { apiRequest } from "@services/apiClient";
import type {
  ListMigrationJobsQuery,
  ListMigrationRecordsQuery,
  MigrationJob,
  MigrationPreflightSummary,
  MigrationRecord,
  PaginatedResult,
} from "../types";

export function getPreflightSummary(): Promise<MigrationPreflightSummary> {
  return apiRequest<MigrationPreflightSummary>(
    `${MIGRATION_BASE_PATH}/preflight`,
    { method: "GET" },
  );
}

export function startMigrationJob(): Promise<MigrationJob> {
  return apiRequest<MigrationJob>(`${MIGRATION_BASE_PATH}/jobs`, {
    method: "POST",
  });
}

export function listMigrationJobs(
  query: ListMigrationJobsQuery,
): Promise<PaginatedResult<MigrationJob>> {
  const params = new URLSearchParams();
  if (query.page) params.set("page", String(query.page));
  if (query.pageSize) params.set("pageSize", String(query.pageSize));
  const suffix = params.toString() ? `?${params.toString()}` : "";
  return apiRequest<PaginatedResult<MigrationJob>>(
    `${MIGRATION_BASE_PATH}/jobs${suffix}`,
    { method: "GET" },
  );
}

export function getMigrationJob(jobId: string): Promise<MigrationJob> {
  return apiRequest<MigrationJob>(`${MIGRATION_BASE_PATH}/jobs/${jobId}`, {
    method: "GET",
  });
}

export function listMigrationRecords(
  jobId: string,
  query: ListMigrationRecordsQuery,
): Promise<PaginatedResult<MigrationRecord>> {
  const params = new URLSearchParams();
  if (query.domain) params.set("domain", query.domain);
  if (query.status) params.set("status", query.status);
  if (query.reason) params.set("reason", query.reason);
  if (query.page) params.set("page", String(query.page));
  if (query.pageSize) params.set("pageSize", String(query.pageSize));
  const suffix = params.toString() ? `?${params.toString()}` : "";
  return apiRequest<PaginatedResult<MigrationRecord>>(
    `${MIGRATION_BASE_PATH}/jobs/${jobId}/records${suffix}`,
    { method: "GET" },
  );
}
