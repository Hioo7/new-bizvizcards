import { useContext } from "react";
import {
  StaffAuthContext,
  type StaffAuthContextValue,
} from "@context/StaffAuthContext";

export function useStaffAuth(): StaffAuthContextValue {
  const context = useContext(StaffAuthContext);
  if (!context) {
    throw new Error("useStaffAuth must be used within a StaffAuthProvider");
  }
  return context;
}
