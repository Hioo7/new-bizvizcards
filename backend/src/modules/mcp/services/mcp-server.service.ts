import { Injectable } from '@nestjs/common';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { LeadsService } from '../../leads/services/leads.service';
import { LeadReferenceNotesService } from '../../leads/services/lead-reference-notes.service';
import { RemindersService } from '../../leads/services/reminders.service';
import { MCP_SERVER_NAME, MCP_SERVER_VERSION } from '../mcp.constants';
import { registerLeadsTools } from './mcp-tools/leads.tools';
import { registerLeadNoteTools } from './mcp-tools/lead-notes.tools';
import { registerLeadReminderTools } from './mcp-tools/lead-reminders.tools';

@Injectable()
export class McpServerService {
  constructor(
    private readonly leadsService: LeadsService,
    private readonly leadReferenceNotesService: LeadReferenceNotesService,
    private readonly remindersService: RemindersService,
  ) {}

  // Builds a fresh server per request, with every tool closure bound to the
  // resolved customerId for that request — matches the transport's stateless
  // mode (see mcp-http-handler.ts), so tool state never leaks across
  // customers.
  createServer(customerId: string): McpServer {
    const server = new McpServer({
      name: MCP_SERVER_NAME,
      version: MCP_SERVER_VERSION,
    });

    registerLeadsTools(server, { leadsService: this.leadsService }, customerId);
    registerLeadNoteTools(
      server,
      { leadReferenceNotesService: this.leadReferenceNotesService },
      customerId,
    );
    registerLeadReminderTools(
      server,
      { remindersService: this.remindersService },
      customerId,
    );

    return server;
  }
}
