import { Injectable } from '@nestjs/common';
import {
  MigrationDomain,
  MigrationRecordStatus,
  Prisma,
} from '../../../../generated/prisma/client';
import { LegacyRole } from '../../../../generated/legacy-prisma/client';
import type { LegacyUser } from '../../../../generated/legacy-prisma/client';
import { PrismaService } from '../../../../common/prisma/prisma.service';
import { LegacyPrismaService } from '../../../../common/legacy-db/legacy-prisma.service';
import { PRISMA_ERROR_CODES } from '../../../../common/constants/prisma-error-codes.constants';
import { EMPLOYEE_ROLE } from '../../../../common/constants/roles.constants';
import { LegacyIdMapperService } from '../legacy-id-mapper.service';
import { iterateLegacyRows } from '../iterate-legacy-rows.util';
import {
  MIGRATION_REJECTION_REASON,
  MIGRATION_SOURCE_TABLE,
  MigrationRejectionReason,
} from '../../migration.constants';
import type { DomainMigrator } from './domain-migrator.interface';

// Legacy admin login was OTP-only (User.passwordHash is unused — see the
// migration plan's research), and so is the new app's employee auth, so no
// credential migration happens here at all — this only backfills the
// EmployeeAccount + Employee identity rows. Direct Prisma inserts, not
// through better-auth's own account-creation API, matching the established
// pattern in prisma/scripts/seed-super-admin.ts (the only other place this
// codebase hand-creates an EmployeeAccount outside of real sign-up).
@Injectable()
export class StaffIdentityMigrator implements DomainMigrator {
  readonly domain = MigrationDomain.STAFF_IDENTITY;

  constructor(
    private readonly prisma: PrismaService,
    private readonly legacyPrisma: LegacyPrismaService,
    private readonly idMapper: LegacyIdMapperService,
  ) {}

  async countTotal(): Promise<number> {
    return this.legacyPrisma.legacyUser.count();
  }

  async migrate(jobId: string): Promise<void> {
    await iterateLegacyRows(
      (skip, take) =>
        this.legacyPrisma.legacyUser.findMany({
          skip,
          take,
          orderBy: { id: 'asc' },
        }),
      (legacyUser) => this.migrateOne(legacyUser, jobId),
    );
  }

  private async migrateOne(
    legacyUser: LegacyUser,
    jobId: string,
  ): Promise<void> {
    const existing = await this.idMapper.findExisting(
      this.domain,
      MIGRATION_SOURCE_TABLE.USER,
      legacyUser.id,
    );
    if (existing?.status === MigrationRecordStatus.SUCCESS) {
      await this.idMapper.touchExistingSuccess(
        this.domain,
        MIGRATION_SOURCE_TABLE.USER,
        legacyUser.id,
        jobId,
      );
      return;
    }

    const alreadyTaken = await this.prisma.employeeAccount.findUnique({
      where: { email: legacyUser.email },
      select: { id: true },
    });
    if (alreadyTaken) {
      await this.idMapper.recordRejected({
        domain: this.domain,
        sourceTable: MIGRATION_SOURCE_TABLE.USER,
        sourceId: legacyUser.id,
        reason:
          MIGRATION_REJECTION_REASON.EMPLOYEE_EMAIL_ALREADY_EXISTS_IN_TARGET,
        jobId,
      });
      return;
    }

    // Never auto-grants super_admin — that role is bootstrapped separately
    // (seed-super-admin.ts) and stays exactly one row.
    const role =
      legacyUser.role === LegacyRole.ADMIN
        ? EMPLOYEE_ROLE.ADMIN
        : EMPLOYEE_ROLE.EMPLOYEE;

    try {
      const employee = await this.prisma.$transaction(async (tx) => {
        const account = await tx.employeeAccount.create({
          data: {
            name: legacyUser.name,
            email: legacyUser.email,
            emailVerified: true,
            role,
          },
        });
        return tx.employee.create({ data: { accountId: account.id } });
      });

      await this.idMapper.recordSuccess({
        domain: this.domain,
        sourceTable: MIGRATION_SOURCE_TABLE.USER,
        sourceId: legacyUser.id,
        targetTable: 'Employee',
        targetId: employee.id,
        jobId,
      });
    } catch (error) {
      await this.idMapper.recordRejected({
        domain: this.domain,
        sourceTable: MIGRATION_SOURCE_TABLE.USER,
        sourceId: legacyUser.id,
        reason: this.classifyError(error),
        jobId,
      });
    }
  }

  private classifyError(error: unknown): MigrationRejectionReason {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === PRISMA_ERROR_CODES.UNIQUE_CONSTRAINT_VIOLATION
    ) {
      return MIGRATION_REJECTION_REASON.EMPLOYEE_EMAIL_ALREADY_EXISTS_IN_TARGET;
    }
    return MIGRATION_REJECTION_REASON.UNEXPECTED_DATABASE_ERROR;
  }
}
