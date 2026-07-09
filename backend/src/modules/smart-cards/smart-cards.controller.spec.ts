import {
  BadRequestException,
  UnsupportedMediaTypeException,
} from '@nestjs/common';
import { SmartCardTemplateKey } from '../../generated/prisma/client';
import type { EmployeeAuthenticatedRequest } from '../../common/guards/employee-auth.guard';
import { SmartCardsController } from './smart-cards.controller';
import type { SmartCardsService } from './services/smart-cards.service';

function createRequest(actorId: string): EmployeeAuthenticatedRequest {
  return {
    employeeSession: { user: { id: actorId } },
  } as unknown as EmployeeAuthenticatedRequest;
}

function makeFile(name: string): Express.Multer.File {
  return {
    fieldname: name,
    originalname: `${name}.png`,
    mimetype: 'image/png',
    buffer: Buffer.from('x'),
  } as Express.Multer.File;
}

describe('SmartCardsController', () => {
  it('list forwards the template key and parsed query to the service', async () => {
    const list = jest.fn().mockResolvedValue({ smartCards: [], total: 0 });
    const controller = new SmartCardsController({
      list,
    } as unknown as SmartCardsService);

    const query = { page: 1, pageSize: 20 };
    await controller.list(SmartCardTemplateKey.INTERIOR_DESIGN_TEMPLATE, query);

    expect(list).toHaveBeenCalledWith(
      SmartCardTemplateKey.INTERIOR_DESIGN_TEMPLATE,
      query,
    );
  });

  it('get forwards the template key and id', async () => {
    const getById = jest.fn().mockResolvedValue({ id: 'card-1' });
    const controller = new SmartCardsController({
      getById,
    } as unknown as SmartCardsService);

    await controller.get(
      SmartCardTemplateKey.INTERIOR_DESIGN_TEMPLATE,
      'card-1',
    );

    expect(getById).toHaveBeenCalledWith(
      SmartCardTemplateKey.INTERIOR_DESIGN_TEMPLATE,
      'card-1',
    );
  });

  it('create parses the JSON data field and forwards actor id + files to the service', async () => {
    const create = jest.fn().mockResolvedValue({ id: 'card-1' });
    const controller = new SmartCardsController({
      create,
    } as unknown as SmartCardsService);
    const dto = {
      endpoint: 'my-card',
      services: [],
      testimonials: [],
      galleries: [],
    };
    const files = [makeFile('profileLogo')];

    await controller.create(
      SmartCardTemplateKey.INTERIOR_DESIGN_TEMPLATE,
      createRequest('actor-1'),
      files,
      JSON.stringify(dto),
    );

    expect(create).toHaveBeenCalledWith(
      SmartCardTemplateKey.INTERIOR_DESIGN_TEMPLATE,
      'actor-1',
      dto,
      files,
    );
  });

  it('create rejects invalid JSON in the data field', async () => {
    const create = jest.fn();
    const controller = new SmartCardsController({
      create,
    } as unknown as SmartCardsService);

    await expect(
      controller.create(
        SmartCardTemplateKey.INTERIOR_DESIGN_TEMPLATE,
        createRequest('actor-1'),
        [],
        '{not valid json',
      ),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(create).not.toHaveBeenCalled();
  });

  it('create rejects a schema-invalid payload', async () => {
    const create = jest.fn();
    const controller = new SmartCardsController({
      create,
    } as unknown as SmartCardsService);

    await expect(
      controller.create(
        SmartCardTemplateKey.INTERIOR_DESIGN_TEMPLATE,
        createRequest('actor-1'),
        [],
        JSON.stringify({ endpoint: 'BAD ENDPOINT!' }),
      ),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(create).not.toHaveBeenCalled();
  });

  it('create rejects a disallowed file extension even with an allowed mimetype', async () => {
    const create = jest.fn();
    const controller = new SmartCardsController({
      create,
    } as unknown as SmartCardsService);
    const badFile = {
      fieldname: 'profileLogo',
      originalname: 'payload.svg',
      mimetype: 'image/png',
      buffer: Buffer.from('x'),
    } as Express.Multer.File;

    await expect(
      controller.create(
        SmartCardTemplateKey.INTERIOR_DESIGN_TEMPLATE,
        createRequest('actor-1'),
        [badFile],
        JSON.stringify({
          endpoint: 'my-card',
          services: [],
          testimonials: [],
          galleries: [],
        }),
      ),
    ).rejects.toBeInstanceOf(UnsupportedMediaTypeException);
    expect(create).not.toHaveBeenCalled();
  });

  it('update parses the data field and forwards id + files to the service (no actor needed)', async () => {
    const update = jest.fn().mockResolvedValue({ id: 'card-1' });
    const controller = new SmartCardsController({
      update,
    } as unknown as SmartCardsService);
    const dto = { services: [], testimonials: [], galleries: [] };

    await controller.update(
      SmartCardTemplateKey.INTERIOR_DESIGN_TEMPLATE,
      'card-1',
      [],
      JSON.stringify(dto),
    );

    expect(update).toHaveBeenCalledWith(
      SmartCardTemplateKey.INTERIOR_DESIGN_TEMPLATE,
      'card-1',
      dto,
      [],
    );
  });

  it('remove forwards the template key and id', async () => {
    const remove = jest.fn().mockResolvedValue({ success: true });
    const controller = new SmartCardsController({
      remove,
    } as unknown as SmartCardsService);

    await controller.remove(
      SmartCardTemplateKey.INTERIOR_DESIGN_TEMPLATE,
      'card-1',
    );

    expect(remove).toHaveBeenCalledWith(
      SmartCardTemplateKey.INTERIOR_DESIGN_TEMPLATE,
      'card-1',
    );
  });
});
