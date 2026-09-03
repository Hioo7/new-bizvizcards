import { z } from 'zod';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import {
  LEAD_COMPANY_MAX_LENGTH,
  LEAD_EMAIL_MAX_LENGTH,
  LEAD_EMAIL_REGEX,
  LEAD_NAME_MAX_LENGTH,
  LEAD_NOTE_MAX_LENGTH,
  LEAD_PHONE_DIAL_CODE_MAX_LENGTH,
  LEAD_PHONE_NUMBER_DIGITS_REGEX,
  LEAD_PHONE_NUMBER_MAX_DIGITS,
  LEAD_PHONE_NUMBER_MIN_DIGITS,
  LEAD_PROFESSION_MAX_LENGTH,
} from '../../../leads/leads.constants';
import { opportunityStageSchema } from '../../../leads/dto/opportunity-stage.dto';
import type {
  LeadDetailResponse,
  LeadsService,
} from '../../../leads/services/leads.service';
import type { CreateLeadDto } from '../../../leads/dto/create-lead.dto';
import type { ListLeadsQueryDto } from '../../../leads/dto/list-leads-query.dto';
import type { UpdateLeadDto } from '../../../leads/dto/update-lead.dto';
import type { LeadModel } from '../../../../generated/prisma/models';
import {
  MCP_LEADS_LIST_DEFAULT_LIMIT,
  MCP_LEADS_LIST_MAX_LIMIT,
} from '../../mcp.constants';
import { textResult } from '../../mcp-tool-result.util';

// Trims the full Prisma row down to what an AI agent actually needs to draft
// a personalized follow-up or reason about a lead — drops internal
// bookkeeping (customerId is implicitly the caller; sourcedBy, ecardId,
// seenAt, folderId are UI/attribution-only; raw lat/lng duplicate the
// human-readable `location` string) that a submitted app's tool responses
// shouldn't return per both platforms' directory data-handling guidelines.
function toLeadSummary(lead: LeadModel) {
  return {
    id: lead.id,
    name: lead.name,
    email: lead.email,
    countryDialCode: lead.countryDialCode,
    phoneNumber: lead.phoneNumber,
    company: lead.company,
    profession: lead.profession,
    location: lead.location,
    note: lead.note,
    stage: lead.stage,
    createdAt: lead.createdAt,
    updatedAt: lead.updatedAt,
  };
}

function toLeadDetailSummary(lead: LeadDetailResponse) {
  return {
    ...toLeadSummary(lead),
    formAnswers: lead.formAnswers.map((answer) => ({
      label: answer.label,
      value: answer.value,
    })),
  };
}

const listLeadsInputSchema = z.object({
  folderId: z.string().uuid().optional(),
  limit: z.number().int().min(1).max(MCP_LEADS_LIST_MAX_LIMIT).optional(),
  offset: z.number().int().min(0).optional(),
});

const getLeadInputSchema = z.object({
  leadId: z.string().uuid(),
});

const createLeadInputSchema = z.object({
  name: z.string().trim().min(1).max(LEAD_NAME_MAX_LENGTH),
  email: z
    .string()
    .trim()
    .max(LEAD_EMAIL_MAX_LENGTH)
    .regex(LEAD_EMAIL_REGEX)
    .optional(),
  countryDialCode: z
    .string()
    .trim()
    .min(1)
    .max(LEAD_PHONE_DIAL_CODE_MAX_LENGTH)
    .optional(),
  phoneNumber: z
    .string()
    .trim()
    .regex(LEAD_PHONE_NUMBER_DIGITS_REGEX)
    .min(LEAD_PHONE_NUMBER_MIN_DIGITS)
    .max(LEAD_PHONE_NUMBER_MAX_DIGITS)
    .optional(),
  note: z.string().trim().max(LEAD_NOTE_MAX_LENGTH).optional(),
  company: z.string().trim().max(LEAD_COMPANY_MAX_LENGTH).optional(),
  profession: z.string().trim().max(LEAD_PROFESSION_MAX_LENGTH).optional(),
});

const updateLeadInputSchema = z.object({
  leadId: z.string().uuid(),
  name: z.string().trim().min(1).max(LEAD_NAME_MAX_LENGTH).optional(),
  email: z
    .string()
    .trim()
    .max(LEAD_EMAIL_MAX_LENGTH)
    .regex(LEAD_EMAIL_REGEX)
    .optional(),
  note: z.string().trim().max(LEAD_NOTE_MAX_LENGTH).optional(),
  stage: opportunityStageSchema.optional(),
});

export async function listLeadsHandler(
  leadsService: LeadsService,
  customerId: string,
  args: z.infer<typeof listLeadsInputSchema>,
) {
  const limit = args.limit ?? MCP_LEADS_LIST_DEFAULT_LIMIT;
  const offset = args.offset ?? 0;
  const query: ListLeadsQueryDto = { folderId: args.folderId };

  const [leads, total] = await Promise.all([
    leadsService.list(customerId, query, { limit, offset }),
    leadsService.count(customerId, query),
  ]);

  return textResult({
    leads: leads.map(toLeadSummary),
    total,
    limit,
    offset,
    hasMore: offset + leads.length < total,
  });
}

export async function getLeadHandler(
  leadsService: LeadsService,
  customerId: string,
  args: z.infer<typeof getLeadInputSchema>,
) {
  const lead = await leadsService.getById(customerId, args.leadId);
  return textResult(toLeadDetailSummary(lead));
}

export async function createLeadHandler(
  leadsService: LeadsService,
  customerId: string,
  args: CreateLeadDto,
) {
  const lead = await leadsService.create(customerId, args);
  return textResult(toLeadSummary(lead));
}

export async function updateLeadHandler(
  leadsService: LeadsService,
  customerId: string,
  args: { leadId: string } & UpdateLeadDto,
) {
  const { leadId, ...dto } = args;
  const lead = await leadsService.update(customerId, leadId, dto);
  return textResult(toLeadSummary(lead));
}

export function registerLeadsTools(
  server: McpServer,
  deps: { leadsService: LeadsService },
  customerId: string,
): void {
  server.registerTool(
    'list_leads',
    {
      title: 'List Leads',
      description:
        `List the caller's leads, optionally filtered by folder (use ` +
        `list_lead_folders to find a folder's id). Results are paginated: ` +
        `at most ${MCP_LEADS_LIST_MAX_LIMIT} per call (default ` +
        `${MCP_LEADS_LIST_DEFAULT_LIMIT}). The response includes "total" ` +
        `and "hasMore" — when "hasMore" is true, call again with ` +
        `offset += the number of leads just returned to fetch the next ` +
        `page. Never assume a single call returned every lead.`,
      inputSchema: listLeadsInputSchema,
      annotations: {
        title: 'List Leads',
        readOnlyHint: true,
        openWorldHint: false,
      },
    },
    (args) => listLeadsHandler(deps.leadsService, customerId, args),
  );

  server.registerTool(
    'get_lead',
    {
      title: 'Get Lead',
      description:
        'Fetch full detail for one lead by id, including its custom form answers — use this before drafting a personalized message.',
      inputSchema: getLeadInputSchema,
      annotations: {
        title: 'Get Lead',
        readOnlyHint: true,
        openWorldHint: false,
      },
    },
    (args) => getLeadHandler(deps.leadsService, customerId, args),
  );

  server.registerTool(
    'create_lead',
    {
      title: 'Create Lead',
      description: 'Create a new lead.',
      inputSchema: createLeadInputSchema,
      annotations: {
        title: 'Create Lead',
        readOnlyHint: false,
        destructiveHint: false,
        openWorldHint: false,
      },
    },
    (args) => createLeadHandler(deps.leadsService, customerId, args),
  );

  server.registerTool(
    'update_lead',
    {
      title: 'Update Lead',
      description:
        "Update a lead's fields, including its pipeline stage (status) — e.g. moving it to QUALIFIED_LEAD or CLOSED_WON.",
      inputSchema: updateLeadInputSchema,
      annotations: {
        title: 'Update Lead',
        readOnlyHint: false,
        // Can overwrite existing field values (name, note, stage, etc.), not
        // purely additive — see ToolAnnotations.destructiveHint's doc: this
        // is only meaningful when readOnlyHint is false.
        destructiveHint: true,
        openWorldHint: false,
      },
    },
    (args) => updateLeadHandler(deps.leadsService, customerId, args),
  );
}
