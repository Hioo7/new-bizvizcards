import { PlansController } from './plans.controller';
import type { PlansService } from './services/plans.service';

function makeController(plansService: Partial<PlansService> = {}) {
  return new PlansController(plansService as PlansService);
}

describe('PlansController', () => {
  it('list forwards the parsed query to the service', async () => {
    const list = jest
      .fn()
      .mockResolvedValue({ plans: [], total: 0, page: 1, pageSize: 20 });
    const controller = makeController({ list });

    const query = { page: 1, pageSize: 20 };
    await controller.list(query);

    expect(list).toHaveBeenCalledWith(query);
  });

  it('get delegates to getByIdOrThrow', async () => {
    const getByIdOrThrow = jest.fn().mockResolvedValue({ id: 'plan-1' });
    const controller = makeController({ getByIdOrThrow });

    await controller.get('plan-1');

    expect(getByIdOrThrow).toHaveBeenCalledWith('plan-1');
  });

  it('create forwards the parsed dto', async () => {
    const create = jest.fn().mockResolvedValue({ id: 'plan-1' });
    const controller = makeController({ create });

    const dto = { name: 'Basic' } as never;
    await controller.create(dto);

    expect(create).toHaveBeenCalledWith(dto);
  });

  it('update forwards the id and parsed dto', async () => {
    const update = jest.fn().mockResolvedValue({ id: 'plan-1' });
    const controller = makeController({ update });

    const dto = { name: 'New Name' };
    await controller.update('plan-1', dto);

    expect(update).toHaveBeenCalledWith('plan-1', dto);
  });

  it('setFallback delegates to setFallbackPlan', async () => {
    const setFallbackPlan = jest.fn().mockResolvedValue({ id: 'plan-1' });
    const controller = makeController({ setFallbackPlan });

    await controller.setFallback('plan-1');

    expect(setFallbackPlan).toHaveBeenCalledWith('plan-1');
  });

  it('remove delegates to the service', async () => {
    const remove = jest.fn().mockResolvedValue(undefined);
    const controller = makeController({ remove });

    await controller.remove('plan-1');

    expect(remove).toHaveBeenCalledWith('plan-1');
  });
});
