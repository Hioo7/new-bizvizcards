import { McpServerService } from './mcp-server.service';
import type { LeadsService } from '../../leads/services/leads.service';
import type { LeadReferenceNotesService } from '../../leads/services/lead-reference-notes.service';
import type { RemindersService } from '../../leads/services/reminders.service';

describe('McpServerService', () => {
  it('creates a connectable server with every leads/notes/reminders tool registered', () => {
    const service = new McpServerService(
      {} as LeadsService,
      {} as LeadReferenceNotesService,
      {} as RemindersService,
    );

    const server = service.createServer('customer-1');

    expect(server).toBeDefined();
    expect(typeof server.connect).toBe('function');

    const registeredNames = Object.keys(
      (server as unknown as { _registeredTools: Record<string, unknown> })
        ._registeredTools,
    );
    expect(registeredNames).toEqual(
      expect.arrayContaining([
        'list_leads',
        'get_lead',
        'create_lead',
        'update_lead',
        'list_lead_notes',
        'add_lead_note',
        'list_lead_reminders',
        'add_lead_reminder',
        'list_due_reminders',
      ]),
    );
  });
});
