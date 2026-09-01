export type BulkMessageRecipientStatus = "PENDING" | "MESSAGED";

export interface BulkMessageTemplateSummary {
  id: string;
  name: string;
  linkedFormId: string | null;
  linkedFormName: string | null;
  sendCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface BulkMessageTemplateDetail extends BulkMessageTemplateSummary {
  body: string;
}

export interface CreateBulkMessageTemplatePayload {
  name: string;
  body: string;
  linkedFormId?: string | null;
}

export interface UpdateBulkMessageTemplatePayload {
  name?: string;
  body?: string;
  linkedFormId?: string | null;
}

export interface PlaceholderOption {
  token: string;
  label: string;
}

export interface FormPlaceholderOption extends PlaceholderOption {
  fieldType: string;
}

export interface PlaceholdersResponse {
  core: PlaceholderOption[];
  formFields: FormPlaceholderOption[];
}

export interface ValidLeadRow {
  leadId: string;
  name: string;
  email: string | null;
  countryDialCode: string | null;
  phoneNumber: string | null;
  hasUsablePhone: boolean;
}

export interface BulkMessageSendSummary {
  id: string;
  templateNameSnapshot: string;
  linkedFormNameSnapshot: string | null;
  totalRecipients: number;
  messagedCount: number;
  pendingCount: number;
  createdAt: string;
}

export interface BulkMessageRecipient {
  id: string;
  leadId: string | null;
  recipientNameSnapshot: string;
  recipientEmailSnapshot: string | null;
  countryDialCodeSnapshot: string;
  phoneNumberSnapshot: string;
  resolvedMessage: string;
  status: BulkMessageRecipientStatus;
  messagedAt: string | null;
}

export interface BulkMessageSendDetail extends BulkMessageSendSummary {
  bodySnapshot: string;
  recipients: BulkMessageRecipient[];
}

export interface CreateBulkMessageSendPayload {
  templateId: string;
  leadIds: string[];
}
