import { NotFoundException } from '@nestjs/common';
import type { LeadsService } from '../../../leads/services/leads.service';
import {
  createLeadHandler,
  getLeadHandler,
  listLeadsHandler,
  listLeadsInputSchema,
  updateLeadHandler,
} from './leads.tools';

describe('leads MCP tool handlers', () => {
  describe('listLeadsInputSchema', () => {
    it('treats an empty-string folderId as unset, not an invalid UUID', () => {
      // LLM tool callers (observed: ChatGPT) sometimes send folderId: "" to
      // mean "no filter" instead of omitting the field.
      const parsed = listLeadsInputSchema.parse({ folderId: '' });

      expect(parsed.folderId).toBeUndefined();
    });

    it('still rejects a genuinely invalid, non-empty folderId', () => {
      expect(() =>
        listLeadsInputSchema.parse({ folderId: 'not-a-uuid' }),
      ).toThrow();
    });

    it('accepts a real folderId unchanged', () => {
      const folderId = '11111111-1111-4111-8111-111111111111';

      const parsed = listLeadsInputSchema.parse({ folderId });

      expect(parsed.folderId).toBe(folderId);
    });
  });

  describe('listLeadsHandler', () => {
    it('scopes the list to the given customerId and applies the default page size', async () => {
      const list = jest.fn().mockResolvedValue([]);
      const count = jest.fn().mockResolvedValue(0);
      const leadsService = { list, count } as unknown as LeadsService;

      await listLeadsHandler(leadsService, 'customer-1', {});

      expect(list).toHaveBeenCalledWith(
        'customer-1',
        { folderId: undefined },
        { limit: 50, offset: 0 },
      );
      expect(count).toHaveBeenCalledWith('customer-1', { folderId: undefined });
    });

    it('passes through an explicit limit/offset and folderId', async () => {
      const list = jest.fn().mockResolvedValue([]);
      const count = jest.fn().mockResolvedValue(0);
      const leadsService = { list, count } as unknown as LeadsService;

      await listLeadsHandler(leadsService, 'customer-1', {
        folderId: 'folder-1',
        limit: 10,
        offset: 20,
      });

      expect(list).toHaveBeenCalledWith(
        'customer-1',
        { folderId: 'folder-1' },
        { limit: 10, offset: 20 },
      );
      expect(count).toHaveBeenCalledWith('customer-1', {
        folderId: 'folder-1',
      });
    });

    it('reports hasMore true when more leads remain past this page', async () => {
      const list = jest.fn().mockResolvedValue([{ id: 'lead-1', name: 'Ada' }]);
      const count = jest.fn().mockResolvedValue(5);
      const leadsService = { list, count } as unknown as LeadsService;

      const result = await listLeadsHandler(leadsService, 'customer-1', {
        limit: 1,
        offset: 0,
      });

      const parsed = JSON.parse(result.content[0].text) as {
        total: number;
        hasMore: boolean;
      };
      expect(parsed.total).toBe(5);
      expect(parsed.hasMore).toBe(true);
    });

    it('reports hasMore false once the last page is reached', async () => {
      const list = jest.fn().mockResolvedValue([{ id: 'lead-1', name: 'Ada' }]);
      const count = jest.fn().mockResolvedValue(1);
      const leadsService = { list, count } as unknown as LeadsService;

      const result = await listLeadsHandler(leadsService, 'customer-1', {
        limit: 50,
        offset: 0,
      });

      const parsed = JSON.parse(result.content[0].text) as {
        total: number;
        hasMore: boolean;
      };
      expect(parsed.total).toBe(1);
      expect(parsed.hasMore).toBe(false);
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
