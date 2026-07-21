import type { CustomerAuthenticatedRequest } from '../../common/guards/customer-auth.guard';
import type { CustomersService } from '../customers/services/customers.service';
import { OrganisationEcardTemplateController } from './organisation-ecard-template.controller';
import type { OrganisationEcardTemplateService } from './services/organisation-ecard-template.service';

function makeRequest(accountId = 'account-1'): CustomerAuthenticatedRequest {
  return {
    customerSession: { user: { id: accountId } },
  } as unknown as CustomerAuthenticatedRequest;
}

describe('OrganisationEcardTemplateController', () => {
  describe('get', () => {
    it('resolves the caller and delegates to getForMember', async () => {
      const getByAccountId = jest.fn().mockResolvedValue({ id: 'customer-1' });
      const getForMember = jest.fn().mockResolvedValue({ id: 'template-1' });
      const controller = new OrganisationEcardTemplateController(
        { getForMember } as unknown as OrganisationEcardTemplateService,
        { getByAccountId } as unknown as CustomersService,
      );

      const result = await controller.get(makeRequest(), 'org-1');

      expect(getByAccountId).toHaveBeenCalledWith('account-1');
      expect(getForMember).toHaveBeenCalledWith('customer-1', 'org-1');
      expect(result).toEqual({ id: 'template-1' });
    });
  });

  describe('update', () => {
    it('resolves the caller, parses the multipart data field, and delegates to upsertForSpoc', async () => {
      const getByAccountId = jest.fn().mockResolvedValue({ id: 'customer-1' });
      const upsertForSpoc = jest.fn().mockResolvedValue({ id: 'template-1' });
      const controller = new OrganisationEcardTemplateController(
        { upsertForSpoc } as unknown as OrganisationEcardTemplateService,
        { getByAccountId } as unknown as CustomersService,
      );
      const files = [
        {
          fieldname: 'heroProfilePhoto',
          originalname: 'photo.png',
          mimetype: 'image/png',
          size: 100,
        } as Express.Multer.File,
      ];

      const result = await controller.update(
        makeRequest(),
        'org-1',
        files,
        JSON.stringify({ heroCompanyName: 'Acme Corp', components: [] }),
      );

      expect(getByAccountId).toHaveBeenCalledWith('account-1');
      expect(upsertForSpoc).toHaveBeenCalledWith(
        'customer-1',
        'org-1',
        { heroCompanyName: 'Acme Corp', components: [] },
        files,
      );
      expect(result).toEqual({ id: 'template-1' });
    });
  });

  describe('delete', () => {
    it('resolves the caller and delegates to deleteForSpoc', async () => {
      const getByAccountId = jest.fn().mockResolvedValue({ id: 'customer-1' });
      const deleteForSpoc = jest.fn().mockResolvedValue(undefined);
      const controller = new OrganisationEcardTemplateController(
        { deleteForSpoc } as unknown as OrganisationEcardTemplateService,
        { getByAccountId } as unknown as CustomersService,
      );

      await controller.delete(makeRequest(), 'org-1');

      expect(getByAccountId).toHaveBeenCalledWith('account-1');
      expect(deleteForSpoc).toHaveBeenCalledWith('customer-1', 'org-1');
    });
  });
});
