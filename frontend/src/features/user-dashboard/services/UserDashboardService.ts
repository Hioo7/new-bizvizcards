import { apiRequest } from "@services/apiClient";
import { DASHBOARD_API } from "@features/user-dashboard/config";
import type {
  Lead,
  LeadFolder,
  DefaultLeadFolderResponse,
  CreateLeadPayload,
  UpdateLeadPayload,
  CreateLeadFolderPayload,
  Organisation,
  OrganisationWithMembership,
  CreateOrganisationPayload,
  OrgMemberListItem,
  OrgInvite,
  InviteMemberPayload,
  UpdateMemberPayload,
  LeadReferenceNote,
  CreateLeadReferenceNotePayload,
  UpdateLeadReferenceNotePayload,
  LeadReminder,
  CreateLeadReminderPayload,
  UpdateLeadReminderPayload,
  OrgEcard,
  OrgEcardListResponse,
  UpdateOrgEcardPayload,
} from "@features/user-dashboard/types";

export class UserDashboardService {
  // ── Leads ──────────────────────────────────────────────────────────────────

  async listLeads(folderId?: string): Promise<Lead[]> {
    const url = folderId
      ? `${DASHBOARD_API.leads}?folderId=${encodeURIComponent(folderId)}`
      : DASHBOARD_API.leads;
    return apiRequest<Lead[]>(url);
  }

  async getLead(id: string): Promise<Lead> {
    return apiRequest<Lead>(DASHBOARD_API.lead(id));
  }

  async createLead(payload: CreateLeadPayload): Promise<Lead> {
    return apiRequest<Lead>(DASHBOARD_API.leads, {
      method: "POST",
      body: JSON.stringify(payload),
    });
  }

  async updateLead(id: string, payload: UpdateLeadPayload): Promise<Lead> {
    return apiRequest<Lead>(DASHBOARD_API.lead(id), {
      method: "PATCH",
      body: JSON.stringify(payload),
    });
  }

  async deleteLead(id: string): Promise<void> {
    await apiRequest<void>(DASHBOARD_API.lead(id), {
      method: "DELETE",
    });
  }

  // ── Lead Folders ───────────────────────────────────────────────────────────

  async listFolders(): Promise<LeadFolder[]> {
    return apiRequest<LeadFolder[]>(DASHBOARD_API.leadFolders);
  }

  async createFolder(payload: CreateLeadFolderPayload): Promise<LeadFolder> {
    return apiRequest<LeadFolder>(DASHBOARD_API.leadFolders, {
      method: "POST",
      body: JSON.stringify(payload),
    });
  }

  async renameFolder(id: string, name: string): Promise<LeadFolder> {
    return apiRequest<LeadFolder>(DASHBOARD_API.leadFolder(id), {
      method: "PATCH",
      body: JSON.stringify({ name }),
    });
  }

  async deleteFolder(id: string, mode: "move" | "delete"): Promise<void> {
    await apiRequest<void>(`${DASHBOARD_API.leadFolder(id)}?mode=${mode}`, {
      method: "DELETE",
    });
  }

  async getDefaultFolder(): Promise<DefaultLeadFolderResponse> {
    return apiRequest<DefaultLeadFolderResponse>(
      DASHBOARD_API.leadFolderDefault,
    );
  }

  async setDefaultFolder(
    folderId: string | null,
  ): Promise<DefaultLeadFolderResponse> {
    return apiRequest<DefaultLeadFolderResponse>(
      DASHBOARD_API.leadFolderDefault,
      {
        method: "PUT",
        body: JSON.stringify({ folderId }),
      },
    );
  }

  // ── Organisation ───────────────────────────────────────────────────────────

  async getOrganisation(): Promise<OrganisationWithMembership | null> {
    const results = await apiRequest<OrganisationWithMembership[]>(
      DASHBOARD_API.organisation,
    );
    return results[0] ?? null;
  }

  async createOrganisation(
    payload: CreateOrganisationPayload,
  ): Promise<OrganisationWithMembership> {
    return apiRequest<OrganisationWithMembership>(DASHBOARD_API.organisations, {
      method: "POST",
      body: JSON.stringify(payload),
    });
  }

  async updateOrganisation(name: string): Promise<Organisation> {
    return apiRequest<Organisation>(DASHBOARD_API.organisation, {
      method: "PATCH",
      body: JSON.stringify({ name }),
    });
  }

  // ── Organisation Members ────────────────────────────────────────────────────

  async listOrgMembers(organisationId: string): Promise<OrgMemberListItem[]> {
    return apiRequest<OrgMemberListItem[]>(DASHBOARD_API.orgMembers(organisationId));
  }

  async updateOrgMember(id: string, payload: UpdateMemberPayload): Promise<void> {
    await apiRequest<unknown>(DASHBOARD_API.orgMember(id), {
      method: "PATCH",
      body: JSON.stringify(payload),
    });
  }

  async removeOrgMember(id: string): Promise<void> {
    await apiRequest<void>(DASHBOARD_API.orgMember(id), { method: "DELETE" });
  }

  // ── Organisation Invites ────────────────────────────────────────────────────

  async listOrgInvites(organisationId: string): Promise<OrgInvite[]> {
    return apiRequest<OrgInvite[]>(DASHBOARD_API.orgInvites(organisationId));
  }

  async inviteOrgMember(
    organisationId: string,
    payload: InviteMemberPayload,
  ): Promise<OrgInvite> {
    return apiRequest<OrgInvite>(DASHBOARD_API.orgInvites(organisationId), {
      method: "POST",
      body: JSON.stringify(payload),
    });
  }

  async revokeOrgInvite(id: string): Promise<void> {
    await apiRequest<void>(DASHBOARD_API.orgInvite(id), { method: "DELETE" });
  }

  async acceptOrgInvite(token: string): Promise<OrgInvite> {
    return apiRequest<OrgInvite>(DASHBOARD_API.acceptOrgInvite(token), {
      method: "POST",
    });
  }

  // ── Lead Reference Notes ────────────────────────────────────────────────────

  async listReferenceNotes(leadId: string): Promise<LeadReferenceNote[]> {
    return apiRequest<LeadReferenceNote[]>(
      DASHBOARD_API.leadReferenceNotes(leadId),
    );
  }

  async createReferenceNote(
    leadId: string,
    payload: CreateLeadReferenceNotePayload,
  ): Promise<LeadReferenceNote> {
    return apiRequest<LeadReferenceNote>(
      DASHBOARD_API.leadReferenceNotes(leadId),
      { method: "POST", body: JSON.stringify(payload) },
    );
  }

  async updateReferenceNote(
    leadId: string,
    noteId: string,
    payload: UpdateLeadReferenceNotePayload,
  ): Promise<LeadReferenceNote> {
    return apiRequest<LeadReferenceNote>(
      DASHBOARD_API.leadReferenceNote(leadId, noteId),
      { method: "PATCH", body: JSON.stringify(payload) },
    );
  }

  async deleteReferenceNote(leadId: string, noteId: string): Promise<void> {
    await apiRequest<void>(DASHBOARD_API.leadReferenceNote(leadId, noteId), {
      method: "DELETE",
    });
  }

  // ── Lead Reminders ──────────────────────────────────────────────────────────

  async listReminders(leadId: string): Promise<LeadReminder[]> {
    return apiRequest<LeadReminder[]>(DASHBOARD_API.leadReminders(leadId));
  }

  async createReminder(
    leadId: string,
    payload: CreateLeadReminderPayload,
  ): Promise<LeadReminder> {
    return apiRequest<LeadReminder>(DASHBOARD_API.leadReminders(leadId), {
      method: "POST",
      body: JSON.stringify(payload),
    });
  }

  async updateReminder(
    leadId: string,
    reminderId: string,
    payload: UpdateLeadReminderPayload,
  ): Promise<LeadReminder> {
    return apiRequest<LeadReminder>(
      DASHBOARD_API.leadReminder(leadId, reminderId),
      { method: "PATCH", body: JSON.stringify(payload) },
    );
  }

  async deleteReminder(leadId: string, reminderId: string): Promise<void> {
    await apiRequest<void>(DASHBOARD_API.leadReminder(leadId, reminderId), {
      method: "DELETE",
    });
  }

  // ── Org Ecards ──────────────────────────────────────────────────────────────

  async listOrgEcards(organisationId: string): Promise<OrgEcardListResponse> {
    return apiRequest<OrgEcardListResponse>(DASHBOARD_API.orgEcards(organisationId));
  }

  async getOrgEcard(organisationId: string, ecardId: string): Promise<OrgEcard> {
    return apiRequest<OrgEcard>(DASHBOARD_API.orgEcard(organisationId, ecardId));
  }

  async updateOrgEcard(
    organisationId: string,
    ecardId: string,
    payload: UpdateOrgEcardPayload,
  ): Promise<OrgEcard> {
    const formData = new FormData();
    formData.append("data", JSON.stringify(payload));
    return apiRequest<OrgEcard>(DASHBOARD_API.orgEcard(organisationId, ecardId), {
      method: "PATCH",
      body: formData,
    });
  }
}

export const userDashboardService = new UserDashboardService();
