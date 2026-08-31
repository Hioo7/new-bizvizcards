import { useNavigate } from "react-router-dom";
import { ScanLine } from "lucide-react";
import { ROUTES } from "@config/routes";

/** Icon-only button next to "Add Lead" — opens the full-screen card scanner. */
export default function ScanCardButton() {
  const navigate = useNavigate();
  return (
    <button
      type="button"
      onClick={() => navigate(ROUTES.userScanCard)}
      aria-label="Scan a business card"
      className="flex h-8 min-h-[44px] w-11 items-center justify-center rounded-full border border-base-300 text-base-content/70 transition-colors hover:bg-base-200 active:scale-95"
    >
      <ScanLine className="h-4 w-4" aria-hidden="true" />
    </button>
  );
}
