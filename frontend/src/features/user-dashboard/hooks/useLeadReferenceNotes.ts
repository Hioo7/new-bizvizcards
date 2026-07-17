import { useState, useCallback } from "react";
import { userDashboardService } from "@features/user-dashboard/services/UserDashboardService";
import type {
  LeadReferenceNote,
  CreateLeadReferenceNotePayload,
  UpdateLeadReferenceNotePayload,
} from "@features/user-dashboard/types";

interface UseLeadReferenceNotesReturn {
  notes: LeadReferenceNote[];
  loading: boolean;
  error: string | null;
  load: () => Promise<void>;
  create: (payload: CreateLeadReferenceNotePayload) => Promise<void>;
  update: (
    noteId: string,
    payload: UpdateLeadReferenceNotePayload,
  ) => Promise<void>;
  remove: (noteId: string) => Promise<void>;
}

export function useLeadReferenceNotes(
  leadId: string,
): UseLeadReferenceNotesReturn {
  const [notes, setNotes] = useState<LeadReferenceNote[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await userDashboardService.listReferenceNotes(leadId);
      setNotes(result);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to load notes",
      );
    } finally {
      setLoading(false);
    }
  }, [leadId]);

  const create = useCallback(
    async (payload: CreateLeadReferenceNotePayload) => {
      const note = await userDashboardService.createReferenceNote(
        leadId,
        payload,
      );
      setNotes((prev) => [...prev, note]);
    },
    [leadId],
  );

  const update = useCallback(
    async (noteId: string, payload: UpdateLeadReferenceNotePayload) => {
      const updated = await userDashboardService.updateReferenceNote(
        leadId,
        noteId,
        payload,
      );
      setNotes((prev) => prev.map((n) => (n.id === noteId ? updated : n)));
    },
    [leadId],
  );

  const remove = useCallback(
    async (noteId: string) => {
      await userDashboardService.deleteReferenceNote(leadId, noteId);
      setNotes((prev) => prev.filter((n) => n.id !== noteId));
    },
    [leadId],
  );

  return { notes, loading, error, load, create, update, remove };
}
