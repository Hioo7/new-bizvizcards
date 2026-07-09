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
});
