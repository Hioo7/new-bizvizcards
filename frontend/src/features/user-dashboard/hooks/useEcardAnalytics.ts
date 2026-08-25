import { useEffect, useReducer } from "react";
import { userDashboardService } from "@features/user-dashboard/services/UserDashboardService";
import type { AggregatedEcardAnalytics } from "@features/user-dashboard/types";

interface State {
  data: AggregatedEcardAnalytics | null;
  loading: boolean;
  error: string | null;
}

type Action =
  | { type: "success"; data: AggregatedEcardAnalytics }
  | { type: "error" };

function reducer(_state: State, action: Action): State {
  switch (action.type) {
    case "success":
      return { data: action.data, loading: false, error: null };
    case "error":
      return { data: null, loading: false, error: "Failed to load ecard analytics" };
  }
}

export function useEcardAnalytics(): State {
  const [state, dispatch] = useReducer(reducer, {
    data: null,
    loading: true,
    error: null,
  });

  useEffect(() => {
    let cancelled = false;
    userDashboardService
      .getMyEcardsAnalytics()
      .then((data) => {
        if (!cancelled) dispatch({ type: "success", data });
      })
      .catch(() => {
        if (!cancelled) dispatch({ type: "error" });
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return state;
}
