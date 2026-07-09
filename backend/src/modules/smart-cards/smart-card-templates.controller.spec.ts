import { SmartCardTemplateKey } from '../../generated/prisma/client';
import { SmartCardTemplatesController } from './smart-card-templates.controller';
import type { SmartCardTemplatesService } from './services/smart-card-templates.service';

describe('SmartCardTemplatesController', () => {
  it('list forwards to the service', async () => {
    const list = jest.fn().mockResolvedValue([]);
    const controller = new SmartCardTemplatesController({
      list,
    } as unknown as SmartCardTemplatesService);

    await controller.list();

    expect(list).toHaveBeenCalledWith();
  });

  it('get forwards the parsed template key to the service', async () => {
    const getByKey = jest.fn().mockResolvedValue({});
    const controller = new SmartCardTemplatesController({
      getByKey,
    } as unknown as SmartCardTemplatesService);

    await controller.get(SmartCardTemplateKey.INTERIOR_DESIGN_TEMPLATE);

    expect(getByKey).toHaveBeenCalledWith(
      SmartCardTemplateKey.INTERIOR_DESIGN_TEMPLATE,
    );
  });
});
