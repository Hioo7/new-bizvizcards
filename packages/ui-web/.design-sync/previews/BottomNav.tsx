import { BottomNav } from "@bizvizcards/ui";
import { House, Contact, ChartNoAxesColumn, ShoppingBag, LayoutGrid } from "lucide-react";

const noop = () => {};

const ITEMS = [
  { key: "home", label: "Home", icon: <House className="h-6 w-6" /> },
  { key: "leads", label: "Leads", icon: <Contact className="h-6 w-6" /> },
  { key: "analytics", label: "Analytics", icon: <ChartNoAxesColumn className="h-6 w-6" /> },
  { key: "cart", label: "Cart", icon: <ShoppingBag className="h-6 w-6" /> },
  { key: "apps", label: "Apps", icon: <LayoutGrid className="h-6 w-6" /> },
];

export const LeadsActive = () => (
  <div className="w-96 overflow-hidden rounded-box border border-base-300">
    <BottomNav items={ITEMS} activeKey="leads" onSelect={noop} />
  </div>
);

export const HomeActive = () => (
  <div className="w-96 overflow-hidden rounded-box border border-base-300">
    <BottomNav items={ITEMS} activeKey="home" onSelect={noop} />
  </div>
);
