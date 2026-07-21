import { EmployeeOrganisationsController } from './employee-organisations.controller';
import type { OrganisationEcardTemplateService } from './services/organisation-ecard-template.service';
import type { OrganisationMembersService } from './services/organisation-members.service';
import type { OrganisationsService } from './services/organisations.service';

function makeController(
  organisationsService: Partial<OrganisationsService> = {},
  organisationMembersService: Partial<OrganisationMembersService> = {},
  organisationEcardTemplateService: Partial<OrganisationEcardTemplateService> = {},
) {
  return new EmployeeOrganisationsController(
    organisationsService as OrganisationsService,
    organisationMembersService as OrganisationMembersService,
    organisationEcardTemplateService as OrganisationEcardTemplateService,
  );
}

describe('EmployeeOrganisationsController', () => {
  it('list forwards the parsed query to the service', async () => {
    const listAllForEmployee = jest.fn().mockResolvedValue({
      organisations: [],
      total: 0,
      page: 1,
      pageSize: 20,
    });
    const controller = makeController({ listAllForEmployee });

    const query = { page: 1, pageSize: 20 };
    await controller.list(query);

    expect(listAllForEmployee).toHaveBeenCalledWith(query);
  });

  it('create splits customerId from the dto, delegates to create, then re-fetches the employee summary', async () => {
    const create = jest.fn().mockResolvedValue({
      organisation: { id: 'org-1' },
      membership: { id: 'member-1' },
    });
    const getByIdForEmployee = jest
      .fn()
      .mockResolvedValue({ id: 'org-1', logoUrl: null });
    const controller = makeController({ create, getByIdForEmployee });

    const result = await controller.create({
      customerId: 'customer-1',
      name: 'Acme Inc',
    });

    expect(create).toHaveBeenCalledWith('customer-1', { name: 'Acme Inc' });
    expect(getByIdForEmployee).toHaveBeenCalledWith('org-1');
    expect(result).toEqual({
      organisation: { id: 'org-1', logoUrl: null },
      membership: { id: 'member-1' },
    });
  });

  it('addMembers forwards the organisationId and parsed dto', async () => {
    const addMembersForEmployee = jest
      .fn()
      .mockResolvedValue([{ id: 'member-1' }]);
    const controller = makeController({}, { addMembersForEmployee });

    const dto = {
      customerIds: ['customer-1', 'customer-2'],
      role: 'MEMBER' as const,
    };
    await controller.addMembers('org-1', dto);

    expect(addMembersForEmployee).toHaveBeenCalledWith('org-1', dto);
  });

  it('updateMember forwards the id and parsed dto', async () => {
    const updateForEmployee = jest.fn().mockResolvedValue({ id: 'member-1' });
    const controller = makeController({}, { updateForEmployee });

    const dto = { role: 'SPOC' as const };
    await controller.updateMember('member-1', dto);

    expect(updateForEmployee).toHaveBeenCalledWith('member-1', dto);
  });

  it('removeMember delegates to removeForEmployee', async () => {
    const removeForEmployee = jest.fn().mockResolvedValue(undefined);
    const controller = makeController({}, { removeForEmployee });

    await controller.removeMember('member-1');

    expect(removeForEmployee).toHaveBeenCalledWith('member-1');
  });

  it('update forwards the id and parsed dto to updateForEmployee', async () => {
    const updateForEmployee = jest.fn().mockResolvedValue({ id: 'org-1' });
    const controller = makeController({ updateForEmployee });

    const dto = { name: 'New Name' };
    await controller.update('org-1', dto);

    expect(updateForEmployee).toHaveBeenCalledWith('org-1', dto);
  });

  it('removeLogo delegates to removeLogo and shapes the response', async () => {
    const removeLogo = jest.fn().mockResolvedValue({ logoMediaId: null });
    const controller = makeController({ removeLogo });

    const result = await controller.removeLogo('org-1');

    expect(removeLogo).toHaveBeenCalledWith('org-1');
    expect(result).toEqual({ logoMediaId: null });
  });

  it('remove delegates to removeForEmployee', async () => {
    const removeForEmployee = jest.fn().mockResolvedValue(undefined);
    const controller = makeController({ removeForEmployee });

    await controller.remove('org-1');

    expect(removeForEmployee).toHaveBeenCalledWith('org-1');
  });

  it('getEcardTemplate forwards the organisationId', async () => {
    const getByOrganisationId = jest.fn().mockResolvedValue(null);
    const controller = makeController({}, {}, { getByOrganisationId });

    const result = await controller.getEcardTemplate('org-1');

    expect(getByOrganisationId).toHaveBeenCalledWith('org-1');
    expect(result).toBeNull();
  });

  it('updateEcardTemplate parses the multipart data field and forwards it with the files', async () => {
    const upsertForEmployee = jest.fn().mockResolvedValue({ id: 'template-1' });
    const controller = makeController({}, {}, { upsertForEmployee });
    const files = [
      {
        fieldname: 'heroProfilePhoto',
        originalname: 'photo.png',
        mimetype: 'image/png',
        size: 100,
      } as Express.Multer.File,
    ];

    const result = await controller.updateEcardTemplate(
      'org-1',
      files,
      JSON.stringify({ heroCompanyName: 'Acme Corp', components: [] }),
    );

    expect(upsertForEmployee).toHaveBeenCalledWith(
      'org-1',
      { heroCompanyName: 'Acme Corp', components: [] },
      files,
    );
    expect(result).toEqual({ id: 'template-1' });
  });

  it('deleteEcardTemplate delegates to deleteForEmployee', async () => {
    const deleteForEmployee = jest.fn().mockResolvedValue(undefined);
    const controller = makeController({}, {}, { deleteForEmployee });

    await controller.deleteEcardTemplate('org-1');

    expect(deleteForEmployee).toHaveBeenCalledWith('org-1');
  });
});
