import type { EmployeeAuthenticatedRequest } from '../../common/guards/employee-auth.guard';
import { MigrationController } from './migration.controller';
import type { MigrationOrchestratorService } from './services/migration-orchestrator.service';
import type { MigrationJobsService } from './services/migration-jobs.service';
import type { MigrationPreflightService } from './services/migration-preflight.service';

function createRequest(actorAccountId: string): EmployeeAuthenticatedRequest {
  return {
    employeeSession: { user: { id: actorAccountId, role: 'super_admin' } },
    headers: { cookie: 'staff.session_token=fake' },
  } as unknown as EmployeeAuthenticatedRequest;
}

describe('MigrationController', () => {
  it('preflight forwards to the preflight service', async () => {
    const runAll = jest.fn().mockResolvedValue({ checks: [], canStart: true });
    const controller = new MigrationController(
      {} as MigrationOrchestratorService,
      {} as MigrationJobsService,
      { runAll } as unknown as MigrationPreflightService,
    );

    await controller.preflight();

    expect(runAll).toHaveBeenCalledWith();
  });

  it('start forwards the authenticated employee account id to the orchestrator', async () => {
    const start = jest.fn().mockResolvedValue({ id: 'job-1' });
    const controller = new MigrationController(
      { start } as unknown as MigrationOrchestratorService,
      {} as MigrationJobsService,
      {} as MigrationPreflightService,
    );

    await controller.start(createRequest('account-1'));

    expect(start).toHaveBeenCalledWith('account-1');
  });

  it('list forwards the parsed query to the jobs service', async () => {
    const list = jest
      .fn()
      .mockResolvedValue({ items: [], total: 0, page: 1, pageSize: 25 });
    const controller = new MigrationController(
      {} as MigrationOrchestratorService,
      { list } as unknown as MigrationJobsService,
      {} as MigrationPreflightService,
    );

    const query = { page: 1, pageSize: 25 };
    await controller.list(query);

    expect(list).toHaveBeenCalledWith(query);
  });

  it('getById forwards the job id to the jobs service', async () => {
    const getByIdOrThrow = jest.fn().mockResolvedValue({ id: 'job-1' });
    const controller = new MigrationController(
      {} as MigrationOrchestratorService,
      { getByIdOrThrow } as unknown as MigrationJobsService,
      {} as MigrationPreflightService,
    );

    await controller.getById('job-1');

    expect(getByIdOrThrow).toHaveBeenCalledWith('job-1');
  });

  it('listRecords forwards the job id and parsed query to the jobs service', async () => {
    const listRecords = jest
      .fn()
      .mockResolvedValue({ items: [], total: 0, page: 1, pageSize: 25 });
    const controller = new MigrationController(
      {} as MigrationOrchestratorService,
      { listRecords } as unknown as MigrationJobsService,
      {} as MigrationPreflightService,
    );

    const query = { page: 1, pageSize: 25 };
    await controller.listRecords('job-1', query);

    expect(listRecords).toHaveBeenCalledWith('job-1', query);
  });
});
