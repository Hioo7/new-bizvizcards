import type { LeadReferenceNotesService } from '../../../leads/services/lead-reference-notes.service';
import { addLeadNoteHandler, listLeadNotesHandler } from './lead-notes.tools';

describe('lead notes MCP tool handlers', () => {
  it('listLeadNotesHandler lists notes for the given lead scoped to the customer', async () => {
    const list = jest.fn().mockResolvedValue([]);
    const service = { list } as unknown as LeadReferenceNotesService;

    await listLeadNotesHandler(service, 'customer-1', { leadId: 'lead-1' });

    expect(list).toHaveBeenCalledWith('customer-1', 'lead-1');
  });

  it('addLeadNoteHandler creates a note scoped to the customer and lead', async () => {
    const create = jest
      .fn()
      .mockResolvedValue({ id: 'note-1', content: 'Called' });
    const service = { create } as unknown as LeadReferenceNotesService;

    const result = await addLeadNoteHandler(service, 'customer-1', {
      leadId: 'lead-1',
      content: 'Called',
    });

    expect(create).toHaveBeenCalledWith('customer-1', 'lead-1', {
      content: 'Called',
    });
    expect(result.content[0].text).toContain('note-1');
  });
});
