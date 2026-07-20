import { PreconditionFailedException } from '@nestjs/common';
import { MigrationJobStatus } from '../../../generated/prisma/client';
import { MigrationOrchestratorService } from './migration-orchestrator.service';
import type { PrismaService } from '../../../common/prisma/prisma.service';
import type { MigrationPreflightService } from './migration-preflight.service';
import type { DomainMigrator } from './migrators/domain-migrator.interface';

function createService(overrides: {
  canStart: boolean;
  migrators?: DomainMigrator[];
  employeeId?: string;
}) {
  const findUniqueOrThrow = jest
    .fn()
    .mockResolvedValue({ id: overrides.employeeId ?? 'employee-1' });
  const migrationJobUpdate = jest.fn().mockResolvedValue({});
  const migrationJobCreate = jest.fn().mockResolvedValue({ id: 'job-1' });
  const prisma = {
    employee: { findUniqueOrThrow },
    migrationJob: {
      create: migrationJobCreate,
      update: migrationJobUpdate,
    },
  } as unknown as PrismaService;

  const preflightService = {
    runAll: jest.fn().mockResolvedValue({
      canStart: overrides.canStart,
      checks: overrides.canStart
        ? []
        : [
            {
              id: 'LEGACY_DATABASE_CONNECTIVITY',
              label: 'Legacy database connection',
              status: 'FAILED',
              detail: 'not reachable',
            },
          ],
    }),
  } as unknown as MigrationPreflightService;

  return {
    service: new MigrationOrchestratorService(
      prisma,
      preflightService,
      overrides.migrators ?? [],
    ),
    findUniqueOrThrow,
    preflightService,
    migrationJobCreate,
  };
}

describe('MigrationOrchestratorService', () => {
  it('start throws PreconditionFailedException and never creates a job when pre-flight has not all passed', async () => {
    const { service, migrationJobCreate } = createService({ canStart: false });

    await expect(service.start('account-1')).rejects.toBeInstanceOf(
      PreconditionFailedException,
    );
    expect(migrationJobCreate).not.toHaveBeenCalled();
  });

  it('start resolves the Employee business row id and creates a PENDING job when pre-flight passes', async () => {
    const { service, findUniqueOrThrow, migrationJobCreate } = createService({
      canStart: true,
      employeeId: 'employee-42',
    });

    const job = await service.start('account-1');

    expect(findUniqueOrThrow).toHaveBeenCalledWith({
      where: { accountId: 'account-1' },
      select: { id: true },
    });
    expect(migrationJobCreate).toHaveBeenCalledWith({
      data: {
        status: MigrationJobStatus.PENDING,
        triggeredByEmployeeId: 'employee-42',
        totalRecords: 0,
      },
    });
    expect(job).toEqual({ id: 'job-1' });
  });

  it('start sums countTotal() across every registered migrator into totalRecords', async () => {
    const migratorA = {
      domain: 'STAFF_IDENTITY',
      countTotal: jest.fn().mockResolvedValue(3),
      migrate: jest.fn().mockResolvedValue(undefined),
    } as unknown as DomainMigrator;
    const migratorB = {
      domain: 'CUSTOMER_IDENTITY',
      countTotal: jest.fn().mockResolvedValue(7),
      migrate: jest.fn().mockResolvedValue(undefined),
    } as unknown as DomainMigrator;

    const { service, migrationJobCreate } = createService({
      canStart: true,
      migrators: [migratorA, migratorB],
    });

    await service.start('account-1');

    expect(migrationJobCreate).toHaveBeenCalledWith({
      data: {
        status: MigrationJobStatus.PENDING,
        triggeredByEmployeeId: 'employee-1',
        totalRecords: 10,
      },
    });
  });
});
