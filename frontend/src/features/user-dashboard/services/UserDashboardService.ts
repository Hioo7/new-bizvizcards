import { apiRequest } from "@services/apiClient";
import { DASHBOARD_API } from "@features/user-dashboard/config";
import type {
  Lead,
  LeadFolder,
  DefaultLeadFolderResponse,
  CreateLeadPayload,
  UpdateLeadPayload,
  CreateLeadFolderPayload,
} from "@features/user-dashboard/types";

export class UserDashboardService {
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
}

export const userDashboardService = new UserDashboardService();
