import {
  Inject,
  Injectable,
  Logger,
  PreconditionFailedException,
} from '@nestjs/common';
import {
  MigrationJob,
  MigrationJobStatus,
} from '../../../generated/prisma/client';
import { PrismaService } from '../../../common/prisma/prisma.service';
import { MigrationPreflightService } from './migration-preflight.service';
import {
  DomainMigrator,
  MIGRATION_DOMAIN_MIGRATORS,
} from './migrators/domain-migrator.interface';

// Orchestrates the whole pipeline: creates the MigrationJob row, then runs
// every registered DomainMigrator in the exact order migration.module.ts
// wires them in (dependency order matters — see domain-migrator.interface.ts).
// Per-row progress is written by each migrator itself via
// LegacyIdMapperService, not aggregated here — this only owns the job's
// overall lifecycle (PENDING -> RUNNING -> COMPLETED/FAILED).
@Injectable()
export class MigrationOrchestratorService {
  private readonly logger = new Logger(MigrationOrchestratorService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly preflightService: MigrationPreflightService,
    @Inject(MIGRATION_DOMAIN_MIGRATORS)
    private readonly migrators: DomainMigrator[],
  ) {}

  // triggeredByAccountId is the authenticated employee's EmployeeAccount id
  // (from request.employeeSession.user.id), resolved here to the business
  // Employee.id the same way events.service.ts's createAsEmployee does,
  // since MigrationJob.triggeredByEmployeeId's FK points at Employee.id.
  async start(triggeredByAccountId: string): Promise<MigrationJob> {
    // Re-validated here, not just trusted from the frontend's disabled
    // button — this is the actual enforcement point, since anyone with
    // super_admin API access could otherwise call this directly.
    const preflight = await this.preflightService.runAll();
    if (!preflight.canStart) {
      const failedLabels = preflight.checks
        .filter((check) => check.status === 'FAILED')
        .map((check) => check.label)
        .join(', ');
      throw new PreconditionFailedException(
        `Pre-flight checks have not all passed: ${failedLabels}. Resolve these before starting a migration.`,
      );
    }

    const employee = await this.prisma.employee.findUniqueOrThrow({
      where: { accountId: triggeredByAccountId },
      select: { id: true },
    });

    const totalRecords = await this.countTotalAcrossMigrators();

    const job = await this.prisma.migrationJob.create({
      data: {
        status: MigrationJobStatus.PENDING,
        triggeredByEmployeeId: employee.id,
        totalRecords,
      },
    });

    // Fire-and-forget — the HTTP response returns the created job
    // immediately, the polling UI tracks progress from here on. No queue
    // infra exists in this codebase; introducing one for a one-time tool is
    // out of scope (see the migration plan).
    void this.run(job.id);

    return job;
  }

  private async countTotalAcrossMigrators(): Promise<number> {
    const counts = await Promise.all(
      this.migrators.map((migrator) => migrator.countTotal()),
    );
    return counts.reduce((sum, count) => sum + count, 0);
  }

  private async run(jobId: string): Promise<void> {
    await this.prisma.migrationJob.update({
      where: { id: jobId },
      data: { status: MigrationJobStatus.RUNNING, startedAt: new Date() },
    });

    try {
      for (const migrator of this.migrators) {
        await migrator.migrate(jobId);
      }

      await this.prisma.migrationJob.update({
        where: { id: jobId },
        data: {
          status: MigrationJobStatus.COMPLETED,
          completedAt: new Date(),
        },
      });
    } catch (error) {
      // Reaching here means a migrator threw past its own per-row error
      // handling (e.g. the legacy DB connection dropped entirely mid-run) —
      // individual row failures are always caught inside each migrator and
      // turned into a REJECTED MigrationRecord instead of propagating.
      this.logger.error(
        `Migration job ${jobId} failed unexpectedly`,
        error instanceof Error ? error.stack : String(error),
      );
      await this.prisma.migrationJob.update({
        where: { id: jobId },
        data: {
          status: MigrationJobStatus.FAILED,
          errorMessage: error instanceof Error ? error.message : String(error),
          completedAt: new Date(),
        },
      });
    }
  }
}
