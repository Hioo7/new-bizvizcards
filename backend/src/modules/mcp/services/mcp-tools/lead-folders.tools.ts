import { z } from 'zod';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import type { LeadFoldersService } from '../../../leads/services/lead-folders.service';
import type { LeadFolderModel } from '../../../../generated/prisma/models';
import { textResult } from '../../mcp-tool-result.util';

const listLeadFoldersInputSchema = z.object({});

// Same trimming rationale as leads.tools.ts's toLeadSummary — drop
// customerId (implicit) and updatedAt (not meaningful for a folder).
function toLeadFolderSummary(folder: LeadFolderModel) {
  return {
    id: folder.id,
    name: folder.name,
    createdAt: folder.createdAt,
  };
}

export async function listLeadFoldersHandler(
  service: LeadFoldersService,
  customerId: string,
) {
  const folders = await service.list(customerId);
  return textResult(folders.map(toLeadFolderSummary));
}

export function registerLeadFolderTools(
  server: McpServer,
  deps: { leadFoldersService: LeadFoldersService },
  customerId: string,
): void {
  server.registerTool(
    'list_lead_folders',
    {
      title: 'List Lead Folders',
      description:
        "List the caller's lead folders. Use a returned folder's id as " +
        "list_leads's folderId to scope results to that folder.",
      inputSchema: listLeadFoldersInputSchema,
      annotations: {
        title: 'List Lead Folders',
        readOnlyHint: true,
        openWorldHint: false,
      },
    },
    () => listLeadFoldersHandler(deps.leadFoldersService, customerId),
  );
}
