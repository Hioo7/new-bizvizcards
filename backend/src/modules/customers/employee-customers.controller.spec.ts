import { EmployeeCustomersController } from './employee-customers.controller';
import type { CustomersService } from './services/customers.service';

describe('EmployeeCustomersController', () => {
  it('list forwards the parsed query to the service', async () => {
    const list = jest
      .fn()
      .mockResolvedValue({ customers: [], total: 0, page: 1, pageSize: 20 });
    const controller = new EmployeeCustomersController({
      list,
    } as unknown as CustomersService);

    const query = { page: 1, pageSize: 20 };
    await controller.list(query);

    expect(list).toHaveBeenCalledWith(query);
  });

  it('create forwards the parsed dto to the service', async () => {
    const create = jest.fn().mockResolvedValue({ id: 'customer-1' });
    const controller = new EmployeeCustomersController({
      create,
    } as unknown as CustomersService);

    const dto = { name: 'Jane', email: 'jane@example.com', password: 'x' };
    await controller.create(dto);

    expect(create).toHaveBeenCalledWith(dto);
  });

  it('update forwards the id and parsed dto to the service', async () => {
    const updateForEmployee = jest.fn().mockResolvedValue({ id: 'customer-1' });
    const controller = new EmployeeCustomersController({
      updateForEmployee,
    } as unknown as CustomersService);

    const dto = { name: 'New Name' };
    await controller.update('customer-1', dto);

    expect(updateForEmployee).toHaveBeenCalledWith('customer-1', dto);
  });

  it('setPassword forwards the id and parsed dto to the service', async () => {
    const setPasswordForEmployee = jest
      .fn()
      .mockResolvedValue({ id: 'customer-1' });
    const controller = new EmployeeCustomersController({
      setPasswordForEmployee,
    } as unknown as CustomersService);

    const dto = { newPassword: 'new-password' };
    await controller.setPassword('customer-1', dto);

    expect(setPasswordForEmployee).toHaveBeenCalledWith('customer-1', dto);
  });

  it('ban forwards the id and parsed dto to the service', async () => {
    const ban = jest.fn().mockResolvedValue({ id: 'customer-1' });
    const controller = new EmployeeCustomersController({
      ban,
    } as unknown as CustomersService);

    const dto = { banReason: 'test' };
    await controller.ban('customer-1', dto);

    expect(ban).toHaveBeenCalledWith('customer-1', dto);
  });

  it('unban forwards the id to the service', async () => {
    const unban = jest.fn().mockResolvedValue({ id: 'customer-1' });
    const controller = new EmployeeCustomersController({
      unban,
    } as unknown as CustomersService);

    await controller.unban('customer-1');

    expect(unban).toHaveBeenCalledWith('customer-1');
  });
});
