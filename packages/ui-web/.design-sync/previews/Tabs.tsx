import { Tabs } from "@bizvizcards/ui";
import { ChartNoAxesColumn, Users, Eye } from "lucide-react";

const noop = () => {};

export const Plain = () => (
  <div className="w-80">
    <Tabs
      activeKey="overview"
      onSelect={noop}
      items={[
        { key: "overview", label: "Overview" },
        { key: "activity", label: "Activity" },
        { key: "settings", label: "Settings" },
      ]}
    />
  </div>
);

export const WithIconsBlock = () => (
  <div className="w-80">
    <Tabs
      activeKey="views"
      onSelect={noop}
      block
      items={[
        { key: "views", label: "Views", icon: <Eye className="h-4 w-4" /> },
        { key: "contacts", label: "Contacts", icon: <Users className="h-4 w-4" /> },
        { key: "trend", label: "Trend", icon: <ChartNoAxesColumn className="h-4 w-4" /> },
      ]}
    />
  </div>
);
