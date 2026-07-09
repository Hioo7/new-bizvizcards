import { ForbiddenException } from '@nestjs/common';
import type { EmployeeAuthenticatedRequest } from '../../common/guards/employee-auth.guard';
import { EMPLOYEE_ROLE } from '../../common/constants/roles.constants';
import { StaffController } from './staff.controller';
import type { StaffService } from './services/staff.service';

function createRequest(
  actorId: string,
  role: string | null,
): EmployeeAuthenticatedRequest {
  return {
    employeeSession: { user: { id: actorId, role } },
    headers: { cookie: 'staff.session_token=fake' },
  } as unknown as EmployeeAuthenticatedRequest;
}

describe('StaffController', () => {
  it('list forwards the parsed query to the service', async () => {
    const list = jest
      .fn()
      .mockResolvedValue({ staff: [], total: 0, page: 1, pageSize: 20 });
    const controller = new StaffController({ list } as unknown as StaffService);

    const query = { page: 1, pageSize: 20 };
    await controller.list(query);

    expect(list).toHaveBeenCalledWith(query);
  });

  it('create passes the actor role and request headers to the service', async () => {
    const create = jest.fn().mockResolvedValue({ id: 'new-staff' });
    const controller = new StaffController({
      create,
    } as unknown as StaffService);
    const dto = {
      email: 'new@example.com',
      name: 'New',
      role: EMPLOYEE_ROLE.EMPLOYEE,
    };

    await controller.create(createRequest('actor-1', EMPLOYEE_ROLE.ADMIN), dto);

    expect(create).toHaveBeenCalledWith(
      EMPLOYEE_ROLE.ADMIN,
      expect.any(Headers),
      dto,
    );
  });

  it('updateName forwards actor role, headers, target id, and dto', async () => {
    const updateName = jest.fn().mockResolvedValue({ id: 'target-1' });
    const controller = new StaffController({
      updateName,
    } as unknown as StaffService);
    const dto = { name: 'Renamed' };

    await controller.updateName(
      createRequest('actor-1', EMPLOYEE_ROLE.SUPER_ADMIN),
      'target-1',
      dto,
    );

    expect(updateName).toHaveBeenCalledWith(
      EMPLOYEE_ROLE.SUPER_ADMIN,
      expect.any(Headers),
      'target-1',
      dto,
    );
  });

  it('setRole forwards the actor id, actor role, headers, target id, and dto', async () => {
    const setRole = jest.fn().mockResolvedValue({ id: 'target-1' });
    const controller = new StaffController({
      setRole,
    } as unknown as StaffService);
    const dto = { role: EMPLOYEE_ROLE.ADMIN };

    await controller.setRole(
      createRequest('actor-1', EMPLOYEE_ROLE.SUPER_ADMIN),
      'target-1',
      dto,
    );

    expect(setRole).toHaveBeenCalledWith(
      'actor-1',
      EMPLOYEE_ROLE.SUPER_ADMIN,
      expect.any(Headers),
      'target-1',
      dto,
    );
  });

  it('ban forwards actor role, headers, target id, and dto', async () => {
    const ban = jest.fn().mockResolvedValue({ id: 'target-1', banned: true });
    const controller = new StaffController({ ban } as unknown as StaffService);
    const dto = { banReason: 'policy violation' };

    await controller.ban(
      createRequest('actor-1', EMPLOYEE_ROLE.ADMIN),
      'target-1',
      dto,
    );

    expect(ban).toHaveBeenCalledWith(
      EMPLOYEE_ROLE.ADMIN,
      expect.any(Headers),
      'target-1',
      dto,
    );
  });

  it('unban forwards actor role, headers, and target id', async () => {
    const unban = jest
      .fn()
      .mockResolvedValue({ id: 'target-1', banned: false });
    const controller = new StaffController({
      unban,
    } as unknown as StaffService);

    await controller.unban(
      createRequest('actor-1', EMPLOYEE_ROLE.ADMIN),
      'target-1',
    );

    expect(unban).toHaveBeenCalledWith(
      EMPLOYEE_ROLE.ADMIN,
      expect.any(Headers),
      'target-1',
    );
  });

  it('remove forwards actor role, headers, and target id', async () => {
    const remove = jest.fn().mockResolvedValue({ success: true });
    const controller = new StaffController({
      remove,
    } as unknown as StaffService);

    await controller.remove(
      createRequest('actor-1', EMPLOYEE_ROLE.SUPER_ADMIN),
      'target-1',
    );

    expect(remove).toHaveBeenCalledWith(
      EMPLOYEE_ROLE.SUPER_ADMIN,
      expect.any(Headers),
      'target-1',
    );
  });

  it('rejects when the session has no recognized role', () => {
    const create = jest.fn();
    const controller = new StaffController({
      create,
    } as unknown as StaffService);
    const dto = {
      email: 'new@example.com',
      name: 'New',
      role: EMPLOYEE_ROLE.EMPLOYEE,
    };

    expect(() =>
      controller.create(createRequest('actor-1', null), dto as never),
    ).toThrow(ForbiddenException);
    expect(create).not.toHaveBeenCalled();
  });
});
