import { useMemo, useState, useCallback } from "react";
import type { Lead, LeadFolder } from "@features/user-dashboard/types";

export type ExportGroupSelectionState = "unchecked" | "indeterminate" | "checked";

export interface ExportFolderGroup {
  folder: LeadFolder | null; // null = "Uncategorised"
  leads: Lead[];
  state: ExportGroupSelectionState;
}

interface UseExportLeadsSelectionResult {
  groups: ExportFolderGroup[];
  selectedIds: Set<string>;
  selectedCount: number;
  totalCount: number;
  toggleLead: (id: string) => void;
  toggleGroup: (group: ExportFolderGroup) => void;
  selectAll: () => void;
  clear: () => void;
  reset: () => void;
}

function deriveGroupState(
  leads: Lead[],
  selectedIds: Set<string>,
): ExportGroupSelectionState {
  const selectedCount = leads.filter((lead) => selectedIds.has(lead.id)).length;
  if (selectedCount === 0) return "unchecked";
  if (selectedCount === leads.length) return "checked";
  return "indeterminate";
}

export function useExportLeadsSelection(
  leads: Lead[],
  folders: LeadFolder[],
): UseExportLeadsSelectionResult {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const groups = useMemo<ExportFolderGroup[]>(() => {
    const byFolder = new Map<string, Lead[]>();
    const uncategorised: Lead[] = [];

    for (const lead of leads) {
      if (lead.folderId) {
        const existing = byFolder.get(lead.folderId);
        if (existing) existing.push(lead);
        else byFolder.set(lead.folderId, [lead]);
      } else {
        uncategorised.push(lead);
      }
    }

    const folderGroups: ExportFolderGroup[] = folders
      .filter((folder) => byFolder.has(folder.id))
      .map((folder) => {
        const groupLeads = byFolder.get(folder.id)!;
        return {
          folder,
          leads: groupLeads,
          state: deriveGroupState(groupLeads, selectedIds),
        };
      });

    if (uncategorised.length > 0) {
      folderGroups.push({
        folder: null,
        leads: uncategorised,
        state: deriveGroupState(uncategorised, selectedIds),
      });
    }

    return folderGroups;
  }, [leads, folders, selectedIds]);

  const toggleLead = useCallback((id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const toggleGroup = useCallback((group: ExportFolderGroup) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (group.state === "checked") {
        for (const lead of group.leads) next.delete(lead.id);
      } else {
        for (const lead of group.leads) next.add(lead.id);
      }
      return next;
    });
  }, []);

  const selectAll = useCallback(() => {
    setSelectedIds(new Set(leads.map((lead) => lead.id)));
  }, [leads]);

  const clear = useCallback(() => {
    setSelectedIds(new Set());
  }, []);

  return {
    groups,
    selectedIds,
    selectedCount: selectedIds.size,
    totalCount: leads.length,
    toggleLead,
    toggleGroup,
    selectAll,
    clear,
    reset: clear,
  };
}
