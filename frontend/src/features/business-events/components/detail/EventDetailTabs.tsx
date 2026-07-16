import { Gift, UserCheck, Users } from "lucide-react";

export type EventDetailTab = "members" | "guests" | "trackables";

interface EventDetailTabsProps {
  active: EventDetailTab;
  onChange: (tab: EventDetailTab) => void;
}

export default function EventDetailTabs({
  active,
  onChange,
}: EventDetailTabsProps) {
  return (
    <div role="tablist" className="tabs tabs-box w-full">
      <button
        type="button"
        role="tab"
        aria-selected={active === "members"}
        onClick={() => onChange("members")}
        className={`tab min-h-11 flex-1 gap-2 ${active === "members" ? "tab-active" : ""}`}
      >
        <Users className="h-4 w-4" />
        Members
      </button>
      <button
        type="button"
        role="tab"
        aria-selected={active === "guests"}
        onClick={() => onChange("guests")}
        className={`tab min-h-11 flex-1 gap-2 ${active === "guests" ? "tab-active" : ""}`}
      >
        <UserCheck className="h-4 w-4" />
        Guests
      </button>
      <button
        type="button"
        role="tab"
        aria-selected={active === "trackables"}
        onClick={() => onChange("trackables")}
        className={`tab min-h-11 flex-1 gap-2 ${active === "trackables" ? "tab-active" : ""}`}
      >
        <Gift className="h-4 w-4" />
        Trackables
      </button>
    </div>
  );
}
