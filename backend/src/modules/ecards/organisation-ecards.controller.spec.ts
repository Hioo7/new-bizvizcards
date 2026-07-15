import type { CustomerAuthenticatedRequest } from '../../common/guards/customer-auth.guard';
import type { CustomersService } from '../customers/services/customers.service';
import type { EcardAnalyticsService } from '../ecard-analytics/services/ecard-analytics.service';
import { OrganisationEcardsController } from './organisation-ecards.controller';
import type { EcardsService } from './services/ecards.service';

function makeRequest(accountId = 'account-1'): CustomerAuthenticatedRequest {
  return {
    customerSession: { user: { id: accountId } },
  } as unknown as CustomerAuthenticatedRequest;
}

describe('OrganisationEcardsController', () => {
  describe('list', () => {
    it('resolves the caller and delegates to listForOrganisationSpoc', async () => {
      const getByAccountId = jest.fn().mockResolvedValue({ id: 'customer-1' });
      const listForOrganisationSpoc = jest
        .fn()
        .mockResolvedValue({ ecards: [], total: 0, page: 1, pageSize: 20 });
      const controller = new OrganisationEcardsController(
        { listForOrganisationSpoc } as unknown as EcardsService,
        { getByAccountId } as unknown as CustomersService,
        {} as unknown as EcardAnalyticsService,
      );

      const result = await controller.list(makeRequest(), 'org-1', {
        page: 1,
        pageSize: 20,
      });

      expect(getByAccountId).toHaveBeenCalledWith('account-1');
      expect(listForOrganisationSpoc).toHaveBeenCalledWith(
        'customer-1',
        'org-1',
        {
          page: 1,
          pageSize: 20,
        },
      );
      expect(result).toEqual({ ecards: [], total: 0, page: 1, pageSize: 20 });
    });
  });

  describe('getAnalytics', () => {
    it('resolves the linked card via getForOrganisationSpoc and returns its analytics summary', async () => {
      const getByAccountId = jest.fn().mockResolvedValue({ id: 'customer-1' });
      const getForOrganisationSpoc = jest
        .fn()
        .mockResolvedValue({ id: 'ecard-1' });
      const getSummary = jest.fn().mockResolvedValue({
        totalViews: 3,
        dailyCounts: [],
      });
      const controller = new OrganisationEcardsController(
        { getForOrganisationSpoc } as unknown as EcardsService,
        { getByAccountId } as unknown as CustomersService,
        { getSummary } as unknown as EcardAnalyticsService,
      );

      const result = await controller.getAnalytics(
        makeRequest(),
        'org-1',
        'ecard-1',
        {},
      );

      expect(getForOrganisationSpoc).toHaveBeenCalledWith(
        'customer-1',
        'org-1',
        'ecard-1',
      );
      expect(getSummary).toHaveBeenCalledWith('ecard-1', {});
      expect(result).toEqual({ totalViews: 3, dailyCounts: [] });
    });

    it('propagates a ForbiddenException from getForOrganisationSpoc without calling getSummary', async () => {
      const getByAccountId = jest.fn().mockResolvedValue({ id: 'customer-1' });
      const getForOrganisationSpoc = jest
        .fn()
        .mockRejectedValue(
          new Error('Only the organisation SPOC can perform this action'),
        );
      const getSummary = jest.fn();
      const controller = new OrganisationEcardsController(
        { getForOrganisationSpoc } as unknown as EcardsService,
        { getByAccountId } as unknown as CustomersService,
        { getSummary } as unknown as EcardAnalyticsService,
      );

      await expect(
        controller.getAnalytics(makeRequest(), 'org-1', 'ecard-1', {}),
      ).rejects.toThrow('Only the organisation SPOC can perform this action');
      expect(getSummary).not.toHaveBeenCalled();
    });
  });
});
