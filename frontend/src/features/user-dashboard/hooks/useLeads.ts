import { useState, useCallback } from "react";
import { userDashboardService } from "@features/user-dashboard/services/UserDashboardService";
import type {
  Lead,
  LeadFolder,
  CreateLeadPayload,
  UpdateLeadPayload,
} from "@features/user-dashboard/types";

interface UseLeadsReturn {
  leads: Lead[];
  folders: LeadFolder[];
  defaultFolderId: string | null;
  loading: boolean;
  error: string | null;
  loadAll: () => Promise<void>;
  createLead: (payload: CreateLeadPayload) => Promise<void>;
  updateLead: (id: string, payload: UpdateLeadPayload) => Promise<void>;
  deleteLead: (id: string) => Promise<void>;
  createFolder: (name: string) => Promise<void>;
  renameFolder: (id: string, name: string) => Promise<void>;
  deleteFolder: (id: string, mode: "move" | "delete") => Promise<void>;
  setDefaultFolder: (folderId: string | null) => Promise<void>;
}

export function useLeads(): UseLeadsReturn {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [folders, setFolders] = useState<LeadFolder[]>([]);
  const [defaultFolderId, setDefaultFolderId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadAll = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [fetchedLeads, fetchedFolders, defaultFolderRes] =
        await Promise.all([
          userDashboardService.listLeads(),
          userDashboardService.listFolders(),
          userDashboardService.getDefaultFolder(),
        ]);
      setLeads(fetchedLeads);
      setFolders(fetchedFolders);
      setDefaultFolderId(defaultFolderRes.defaultLeadFolderId);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load data");
    } finally {
      setLoading(false);
    }
  }, []);

  const createLead = useCallback(
    async (payload: CreateLeadPayload) => {
      const newLead = await userDashboardService.createLead(payload);
      setLeads((prev) => [newLead, ...prev]);
      await loadAll();
    },
    [loadAll],
  );

  const updateLead = useCallback(
    async (id: string, payload: UpdateLeadPayload) => {
      const updated = await userDashboardService.updateLead(id, payload);
      setLeads((prev) => prev.map((l) => (l.id === id ? updated : l)));
      await loadAll();
    },
    [loadAll],
  );

  const deleteLead = useCallback(
    async (id: string) => {
      setLeads((prev) => prev.filter((l) => l.id !== id));
      await userDashboardService.deleteLead(id);
      await loadAll();
    },
    [loadAll],
  );

  const createFolder = useCallback(
    async (name: string) => {
      await userDashboardService.createFolder({ name });
      await loadAll();
    },
    [loadAll],
  );

  const renameFolder = useCallback(
    async (id: string, name: string) => {
      await userDashboardService.renameFolder(id, name);
      await loadAll();
    },
    [loadAll],
  );

  const deleteFolder = useCallback(
    async (id: string, mode: "move" | "delete") => {
      await userDashboardService.deleteFolder(id, mode);
      await loadAll();
    },
    [loadAll],
  );

  const setDefaultFolder = useCallback(async (folderId: string | null) => {
    const res = await userDashboardService.setDefaultFolder(folderId);
    setDefaultFolderId(res.defaultLeadFolderId);
  }, []);

  return {
    leads,
    folders,
    defaultFolderId,
    loading,
    error,
    loadAll,
    createLead,
    updateLead,
    deleteLead,
    createFolder,
    renameFolder,
    deleteFolder,
    setDefaultFolder,
  };
}
