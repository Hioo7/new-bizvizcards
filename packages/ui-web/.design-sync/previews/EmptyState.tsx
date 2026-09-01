import { EmptyState, Button } from "@bizvizcards/ui";
import { Inbox, Plus, ScanLine, WifiOff } from "lucide-react";

const noop = () => {};

export const NoLeads = () => (
  <div className="w-80">
    <EmptyState
      icon={<Inbox className="h-6 w-6" />}
      title="No leads yet"
      description="Scan a business card or add one by hand to get started."
      action={
        <Button leadingIcon={<Plus className="h-4 w-4" />} onClick={noop}>
          Add lead
        </Button>
      }
    />
  </div>
);

export const NoResults = () => (
  <div className="w-80">
    <EmptyState
      icon={<ScanLine className="h-6 w-6" />}
      title="No matches"
      description="No leads match “bengaluru”. Try a different search."
    />
  </div>
);

export const OfflineError = () => (
  <div className="w-80">
    <EmptyState
      icon={<WifiOff className="h-6 w-6" />}
      title="Couldn't load your leads"
      description="Check your connection and try again."
      action={
        <Button variant="outline" onClick={noop}>
          Retry
        </Button>
      }
    />
  </div>
);
