import React from "react";
import { View } from "react-native";
import { House, Contact, ChartNoAxesColumn, ShoppingBag, LayoutGrid, Eye, Users } from "./_icons";
import { BottomNav, Tabs } from "@bizvizcards/ui-native";

export default { title: "Navigation" };
const noop = () => {};

const NAV = [
  { key: "home", label: "Home", icon: <House size={24} color="#2D2DE0" /> },
  { key: "leads", label: "Leads", icon: <Contact size={24} color="#2D2DE0" /> },
  {
    key: "analytics",
    label: "Analytics",
    icon: <ChartNoAxesColumn size={24} color="#2D2DE0" />,
  },
  { key: "cart", label: "Cart", icon: <ShoppingBag size={24} color="#2D2DE0" /> },
  { key: "apps", label: "Apps", icon: <LayoutGrid size={24} color="#2D2DE0" /> },
];

export const BottomNav_LeadsActive = () => (
  <View className="w-96 overflow-hidden rounded-box border border-outline-100">
    <BottomNav items={NAV} activeKey="leads" onSelect={noop} />
  </View>
);
export const BottomNav_HomeActive = () => (
  <View className="w-96 overflow-hidden rounded-box border border-outline-100">
    <BottomNav items={NAV} activeKey="home" onSelect={noop} />
  </View>
);

export const Tabs_Plain = () => (
  <View className="w-80">
    <Tabs
      activeKey="overview"
      onSelect={noop}
      items={[
        { key: "overview", label: "Overview" },
        { key: "activity", label: "Activity" },
        { key: "settings", label: "Settings" },
      ]}
    />
  </View>
);
export const Tabs_WithIcons = () => (
  <View className="w-80">
    <Tabs
      block
      activeKey="views"
      onSelect={noop}
      items={[
        { key: "views", label: "Views", icon: <Eye size={16} color="#2D2DE0" /> },
        {
          key: "contacts",
          label: "Contacts",
          icon: <Users size={16} color="#64748b" />,
        },
        {
          key: "trend",
          label: "Trend",
          icon: <ChartNoAxesColumn size={16} color="#64748b" />,
        },
      ]}
    />
  </View>
);
