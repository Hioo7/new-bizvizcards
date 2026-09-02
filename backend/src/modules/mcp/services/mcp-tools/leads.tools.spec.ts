import { NotFoundException } from '@nestjs/common';
import type { LeadsService } from '../../../leads/services/leads.service';
import {
  createLeadHandler,
  getLeadHandler,
  listLeadsHandler,
  updateLeadHandler,
} from './leads.tools';

describe('leads MCP tool handlers', () => {
  describe('listLeadsHandler', () => {
    it('scopes the list to the given customerId', async () => {
      const list = jest.fn().mockResolvedValue([]);
      const leadsService = { list } as unknown as LeadsService;

      await listLeadsHandler(leadsService, 'customer-1', {});

      expect(list).toHaveBeenCalledWith('customer-1', {});
    });
  });

  describe('getLeadHandler', () => {
    it('returns lead detail scoped to the customer', async () => {
      const getById = jest
        .fn()
        .mockResolvedValue({ id: 'lead-1', name: 'Ada', formAnswers: [] });
      const leadsService = { getById } as unknown as LeadsService;

      const result = await getLeadHandler(leadsService, 'customer-1', {
        leadId: 'lead-1',
      });

      expect(getById).toHaveBeenCalledWith('customer-1', 'lead-1');
      expect(result.content[0].text).toContain('Ada');
    });

    it('propagates NotFoundException for a lead the customer does not own', async () => {
      const getById = jest
        .fn()
        .mockRejectedValue(new NotFoundException('Lead not found'));
      const leadsService = { getById } as unknown as LeadsService;

      await expect(
        getLeadHandler(leadsService, 'customer-1', { leadId: 'lead-2' }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('createLeadHandler', () => {
    it('creates a lead scoped to the customer', async () => {
      const create = jest.fn().mockResolvedValue({ id: 'lead-1', name: 'Ada' });
      const leadsService = { create } as unknown as LeadsService;

      const result = await createLeadHandler(leadsService, 'customer-1', {
        name: 'Ada',
      });

      expect(create).toHaveBeenCalledWith('customer-1', { name: 'Ada' });
      expect(result.content[0].text).toContain('lead-1');
    });
  });

  describe('updateLeadHandler', () => {
    it('updates a lead scoped to the customer', async () => {
      const update = jest
        .fn()
        .mockResolvedValue({ id: 'lead-1', stage: 'QUALIFIED_LEAD' });
      const leadsService = { update } as unknown as LeadsService;

      const result = await updateLeadHandler(leadsService, 'customer-1', {
        leadId: 'lead-1',
        stage: 'QUALIFIED_LEAD',
      });

      expect(update).toHaveBeenCalledWith('customer-1', 'lead-1', {
        stage: 'QUALIFIED_LEAD',
      });
      expect(result.content[0].text).toContain('QUALIFIED_LEAD');
    });
  });
});
