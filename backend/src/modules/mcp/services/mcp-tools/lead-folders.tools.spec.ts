import type { LeadFoldersService } from '../../../leads/services/lead-folders.service';
import { listLeadFoldersHandler } from './lead-folders.tools';

describe('lead folders MCP tool handlers', () => {
  it('listLeadFoldersHandler lists folders scoped to the customer, trimmed to id/name/createdAt', async () => {
    const createdAt = new Date('2026-01-01T00:00:00.000Z');
    const list = jest.fn().mockResolvedValue([
      {
        id: 'folder-1',
        customerId: 'customer-1',
        name: 'Conference 2026',
        createdAt,
        updatedAt: createdAt,
      },
    ]);
    const service = { list } as unknown as LeadFoldersService;

    const result = await listLeadFoldersHandler(service, 'customer-1');

    expect(list).toHaveBeenCalledWith('customer-1');
    const parsed = JSON.parse(result.content[0].text) as Array<
      Record<string, unknown>
    >;
    expect(parsed).toEqual([
      {
        id: 'folder-1',
        name: 'Conference 2026',
        createdAt: createdAt.toISOString(),
      },
    ]);
  });
});
