import { MIGRATION_BATCH_SIZE } from '../migration.constants';

// Fetches and processes legacy rows in bounded batches (offset pagination —
// simple and sufficient at this domain's actual scale, see the migration
// plan) rather than loading an entire legacy table into memory at once.
// `onRow` is called once per row, in order; each migrator is responsible
// for its own per-row error handling (turning a failure into a REJECTED
// MigrationRecord rather than throwing past this loop).
export async function iterateLegacyRows<T>(
  fetchBatch: (skip: number, take: number) => Promise<T[]>,
  onRow: (row: T) => Promise<void>,
): Promise<void> {
  let skip = 0;
  for (;;) {
    const batch = await fetchBatch(skip, MIGRATION_BATCH_SIZE);
    if (batch.length === 0) {
      return;
    }
    for (const row of batch) {
      await onRow(row);
    }
    skip += batch.length;
  }
}
