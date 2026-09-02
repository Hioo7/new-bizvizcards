import { z } from 'zod';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { LEAD_REFERENCE_NOTE_CONTENT_MAX_LENGTH } from '../../../leads/leads.constants';
import type { LeadReferenceNotesService } from '../../../leads/services/lead-reference-notes.service';
import { textResult } from '../../mcp-tool-result.util';

const listLeadNotesInputSchema = z.object({ leadId: z.string().uuid() });
const addLeadNoteInputSchema = z.object({
  leadId: z.string().uuid(),
  content: z.string().trim().min(1).max(LEAD_REFERENCE_NOTE_CONTENT_MAX_LENGTH),
});

export async function listLeadNotesHandler(
  service: LeadReferenceNotesService,
  customerId: string,
  args: z.infer<typeof listLeadNotesInputSchema>,
) {
  const notes = await service.list(customerId, args.leadId);
  return textResult(notes);
}

export async function addLeadNoteHandler(
  service: LeadReferenceNotesService,
  customerId: string,
  args: z.infer<typeof addLeadNoteInputSchema>,
) {
  const { leadId, ...dto } = args;
  const note = await service.create(customerId, leadId, dto);
  return textResult(note);
}

export function registerLeadNoteTools(
  server: McpServer,
  deps: { leadReferenceNotesService: LeadReferenceNotesService },
  customerId: string,
): void {
  server.registerTool(
    'list_lead_notes',
    {
      title: 'List Lead Notes',
      description: 'List reference notes on a lead.',
      inputSchema: listLeadNotesInputSchema,
      annotations: {
        title: 'List Lead Notes',
        readOnlyHint: true,
        openWorldHint: false,
      },
    },
    (args) =>
      listLeadNotesHandler(deps.leadReferenceNotesService, customerId, args),
  );

  server.registerTool(
    'add_lead_note',
    {
      title: 'Add Lead Note',
      description: 'Add a reference note to a lead (e.g. a call summary).',
      inputSchema: addLeadNoteInputSchema,
      annotations: {
        title: 'Add Lead Note',
        readOnlyHint: false,
        destructiveHint: false,
        openWorldHint: false,
      },
    },
    (args) =>
      addLeadNoteHandler(deps.leadReferenceNotesService, customerId, args),
  );
}
