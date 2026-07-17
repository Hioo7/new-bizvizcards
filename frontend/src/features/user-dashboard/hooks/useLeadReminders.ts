import { useState, useCallback } from "react";
import { userDashboardService } from "@features/user-dashboard/services/UserDashboardService";
import type {
  LeadReminder,
  CreateLeadReminderPayload,
  UpdateLeadReminderPayload,
} from "@features/user-dashboard/types";

interface UseLeadRemindersReturn {
  reminders: LeadReminder[];
  loading: boolean;
  error: string | null;
  load: () => Promise<void>;
  create: (payload: CreateLeadReminderPayload) => Promise<void>;
  update: (
    reminderId: string,
    payload: UpdateLeadReminderPayload,
  ) => Promise<void>;
  remove: (reminderId: string) => Promise<void>;
}

export function useLeadReminders(leadId: string): UseLeadRemindersReturn {
  const [reminders, setReminders] = useState<LeadReminder[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await userDashboardService.listReminders(leadId);
      setReminders(result);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to load reminders",
      );
    } finally {
      setLoading(false);
    }
  }, [leadId]);

  const create = useCallback(
    async (payload: CreateLeadReminderPayload) => {
      const reminder = await userDashboardService.createReminder(
        leadId,
        payload,
      );
      setReminders((prev) => [...prev, reminder]);
    },
    [leadId],
  );

  const update = useCallback(
    async (reminderId: string, payload: UpdateLeadReminderPayload) => {
      const updated = await userDashboardService.updateReminder(
        leadId,
        reminderId,
        payload,
      );
      setReminders((prev) =>
        prev.map((r) => (r.id === reminderId ? updated : r)),
      );
    },
    [leadId],
  );

  const remove = useCallback(
    async (reminderId: string) => {
      await userDashboardService.deleteReminder(leadId, reminderId);
      setReminders((prev) => prev.filter((r) => r.id !== reminderId));
    },
    [leadId],
  );

  return { reminders, loading, error, load, create, update, remove };
}
