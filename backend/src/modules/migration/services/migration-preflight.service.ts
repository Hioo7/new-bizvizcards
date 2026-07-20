import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../common/prisma/prisma.service';
import { LegacyPrismaService } from '../../../common/legacy-db/legacy-prisma.service';
import { LegacyMediaStagingClient } from './legacy-media-staging-client.service';
import { withTimeout } from './with-timeout.util';
import {
  MIGRATION_NETWORK_TIMEOUT_MS,
  MIGRATION_PREFLIGHT_CHECK_ID,
  MIGRATION_PREFLIGHT_CHECK_LABEL,
  MigrationPreflightCheckId,
} from '../migration.constants';

export type MigrationPreflightCheckStatus = 'PASSED' | 'FAILED';

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

// Every check here is live and uncached — GET /api/migration/preflight runs
// them fresh on every call so the frontend's auto-polling checklist always
// reflects real, current state (a tunnel that just came up, an `mc mirror`
// that just finished). MigrationOrchestratorService re-runs this same
// summary server-side before starting a job, so the gate holds even for a
// direct API call bypassing the UI entirely.
@Injectable()
export class MigrationPreflightService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly legacyPrisma: LegacyPrismaService,
    private readonly legacyMediaStagingClient: LegacyMediaStagingClient,
  ) {}

  async runAll(): Promise<MigrationPreflightSummary> {
    const checks = await Promise.all([
      this.checkLegacyDatabaseConnectivity(),
      this.checkLegacyMediaStagingConnectivity(),
      this.checkFallbackPlanConfigured(),
      this.checkSmartCardTemplatesSeeded(),
    ]);

    return {
      checks,
      canStart: checks.every((check) => check.status === 'PASSED'),
    };
  }

  private async checkLegacyDatabaseConnectivity(): Promise<MigrationPreflightCheckResult> {
    const id = MIGRATION_PREFLIGHT_CHECK_ID.LEGACY_DATABASE_CONNECTIVITY;
    try {
      const count = await withTimeout(
        this.legacyPrisma.legacyCardUser.count(),
        MIGRATION_NETWORK_TIMEOUT_MS,
        'Timed out connecting to the legacy database.',
      );
      return this.passed(
        id,
        `Connected — ${count} CardUser row${count === 1 ? '' : 's'} visible.`,
      );
    } catch (error) {
      return this.failed(id, this.describeDatabaseError(error));
    }
  }

  private async checkLegacyMediaStagingConnectivity(): Promise<MigrationPreflightCheckResult> {
    const id = MIGRATION_PREFLIGHT_CHECK_ID.LEGACY_MEDIA_STAGING_CONNECTIVITY;
    if (!this.legacyMediaStagingClient.bucket) {
      return this.failed(id, 'LEGACY_MEDIA_STAGING_BUCKET is not configured.');
    }
    try {
      const { objectCount } = await withTimeout(
        this.legacyMediaStagingClient.checkReachable(),
        MIGRATION_NETWORK_TIMEOUT_MS,
        'Timed out connecting to the legacy media staging bucket.',
      );
      if (objectCount === 0) {
        return this.failed(
          id,
          `Bucket "${this.legacyMediaStagingClient.bucket}" exists but contains no objects — has \`mc mirror\` been run yet, and did it point at the right bucket?`,
        );
      }
      return this.passed(
        id,
        `Bucket "${this.legacyMediaStagingClient.bucket}" reachable with objects present.`,
      );
    } catch {
      return this.failed(
        id,
        `Staging bucket "${this.legacyMediaStagingClient.bucket}" not found or unreachable — has \`mc mirror\` been run yet?`,
      );
    }
  }

  private async checkFallbackPlanConfigured(): Promise<MigrationPreflightCheckResult> {
    const id = MIGRATION_PREFLIGHT_CHECK_ID.FALLBACK_PLAN_CONFIGURED;
    const fallbackPlan = await this.prisma.plan.findFirst({
      where: { isFallbackPlan: true },
      select: { id: true, name: true },
    });
    if (!fallbackPlan) {
      return this.failed(
        id,
        'No fallback plan configured — run `npm run seed:fallback-plan` before migrating customers.',
      );
    }
    return this.passed(id, `Fallback plan "${fallbackPlan.name}" configured.`);
  }

  private async checkSmartCardTemplatesSeeded(): Promise<MigrationPreflightCheckResult> {
    const id = MIGRATION_PREFLIGHT_CHECK_ID.SMART_CARD_TEMPLATES_SEEDED;
    const count = await this.prisma.smartCardTemplate.count();
    if (count === 0) {
      return this.failed(
        id,
        'No smart card templates configured — run `npm run seed:smart-card-templates` before migrating smart cards.',
      );
    }
    return this.passed(id, `${count} smart card template(s) configured.`);
  }

  private passed(
    id: MigrationPreflightCheckId,
    detail: string,
  ): MigrationPreflightCheckResult {
    return {
      id,
      label: MIGRATION_PREFLIGHT_CHECK_LABEL[id],
      status: 'PASSED',
      detail,
    };
  }

  private failed(
    id: MigrationPreflightCheckId,
    detail: string,
  ): MigrationPreflightCheckResult {
    return {
      id,
      label: MIGRATION_PREFLIGHT_CHECK_LABEL[id],
      status: 'FAILED',
      detail,
    };
  }

  private describeDatabaseError(error: unknown): string {
    const message = error instanceof Error ? error.message : String(error);
    if (/ECONNREFUSED|timed out|ETIMEDOUT/i.test(message)) {
      return 'Connection refused/timed out — the SSH tunnel is likely not open. Re-check the tunnel command.';
    }
    if (/password authentication failed|permission denied/i.test(message)) {
      return `Connected, but authentication failed — check LEGACY_DATABASE_URL's credentials. (${message})`;
    }
    return `Connected, but the query failed — check the tunnel points at the right database/schema. (${message})`;
  }
}
