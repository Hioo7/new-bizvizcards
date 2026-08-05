import type { CustomerAuthenticatedRequest } from '../../common/guards/customer-auth.guard';
import type { CustomersService } from '../customers/services/customers.service';
import { OrganisationExchangeContactFormTemplateController } from './organisation-exchange-contact-form-template.controller';
import type { OrganisationExchangeContactFormTemplateService } from './services/organisation-exchange-contact-form-template.service';

function makeRequest(accountId = 'account-1'): CustomerAuthenticatedRequest {
  return {
    customerSession: { user: { id: accountId } },
  } as unknown as CustomerAuthenticatedRequest;
}

describe('OrganisationExchangeContactFormTemplateController', () => {
  describe('get', () => {
    it('resolves the caller and delegates to getForMember', async () => {
      const getByAccountId = jest.fn().mockResolvedValue({ id: 'customer-1' });
      const getForMember = jest.fn().mockResolvedValue({ id: 'form-1' });
      const controller = new OrganisationExchangeContactFormTemplateController(
        {
          getForMember,
        } as unknown as OrganisationExchangeContactFormTemplateService,
        { getByAccountId } as unknown as CustomersService,
      );

      const result = await controller.get(makeRequest(), 'org-1');

      expect(getByAccountId).toHaveBeenCalledWith('account-1');
      expect(getForMember).toHaveBeenCalledWith('customer-1', 'org-1');
      expect(result).toEqual({ id: 'form-1' });
    });
  });

  describe('update', () => {
    it('resolves the caller and delegates to upsertForSpoc', async () => {
      const getByAccountId = jest.fn().mockResolvedValue({ id: 'customer-1' });
      const upsertForSpoc = jest
        .fn()
        .mockResolvedValue({ form: { id: 'form-1' }, forked: false });
      const controller = new OrganisationExchangeContactFormTemplateController(
        {
          upsertForSpoc,
        } as unknown as OrganisationExchangeContactFormTemplateService,
        { getByAccountId } as unknown as CustomersService,
      );

      const result = await controller.update(makeRequest(), 'org-1', {
        name: 'Org template',
        fields: [],
      });

      expect(getByAccountId).toHaveBeenCalledWith('account-1');
      expect(upsertForSpoc).toHaveBeenCalledWith('customer-1', 'org-1', {
        name: 'Org template',
        fields: [],
      });
      expect(result).toEqual({ form: { id: 'form-1' }, forked: false });
    });
  });

  describe('delete', () => {
    it('resolves the caller and delegates to deleteForSpoc', async () => {
      const getByAccountId = jest.fn().mockResolvedValue({ id: 'customer-1' });
      const deleteForSpoc = jest.fn().mockResolvedValue(undefined);
      const controller = new OrganisationExchangeContactFormTemplateController(
        {
          deleteForSpoc,
        } as unknown as OrganisationExchangeContactFormTemplateService,
        { getByAccountId } as unknown as CustomersService,
      );

      await controller.delete(makeRequest(), 'org-1');

      expect(getByAccountId).toHaveBeenCalledWith('account-1');
      expect(deleteForSpoc).toHaveBeenCalledWith('customer-1', 'org-1');
    });
  });
});
