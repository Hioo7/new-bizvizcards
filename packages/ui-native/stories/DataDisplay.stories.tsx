import React from "react";
import { View } from "react-native";
import { Eye, Users, QrCode, Download, Check, ScanLine, Plus, Filter, X, Trash2 } from "./_icons";
import { Avatar, StatCard, Chip, IconButton } from "@bizvizcards/ui-native";

export default { title: "Data display" };
const noop = () => {};

export const Avatar_Initials = () => (
  <View className="flex-row items-center gap-3">
    <Avatar name="Chitra Narayan" size="sm" />
    <Avatar name="Chitra Narayan" size="md" />
    <Avatar name="Chitra Narayan" size="lg" />
    <Avatar name="Priya" size="md" />
  </View>
);

export const StatCard_Trends = () => (
  <View className="w-[26rem] flex-row flex-wrap gap-3">
    <View className="w-44">
      <StatCard
        label="Card views"
        value={1284}
        icon={<Eye size={20} color="#2D2DE0" />}
        trend="up"
        trendLabel="+12%"
      />
    </View>
    <View className="w-44">
      <StatCard
        label="Contacts exchanged"
        value={92}
        icon={<Users size={20} color="#2D2DE0" />}
        trend="down"
        trendLabel="-4%"
      />
    </View>
    <View className="w-44">
      <StatCard
        label="QR scans"
        value={318}
        icon={<QrCode size={20} color="#2D2DE0" />}
      />
    </View>
    <View className="w-44">
      <StatCard
        label="vCard saves"
        value="1m 12s"
        icon={<Download size={20} color="#2D2DE0" />}
        trend="up"
        trendLabel="+9%"
      />
    </View>
  </View>
);

export const Chip_FilterRow = () => (
  <View className="flex-row flex-wrap gap-2">
    <Chip label="All" selected onPress={noop} />
    <Chip label="New" onPress={noop} />
    <Chip label="Contacted" onPress={noop} />
    <Chip
      label="Verified only"
      selected
      icon={<Check size={14} color="#fff" />}
      onPress={noop}
    />
  </View>
);
export const Chip_Removable = () => (
  <View className="flex-row gap-2">
    <Chip label="Trade show 2026" selected onRemove={noop} />
    <Chip label="Bengaluru" selected onRemove={noop} />
  </View>
);

export const IconButton_Variants = () => (
  <View className="flex-row items-center gap-3">
    <IconButton
      label="Scan a card"
      variant="primary"
      icon={<ScanLine size={20} color="#fff" />}
    />
    <IconButton
      label="Add"
      variant="outline"
      icon={<Plus size={20} color="#2D2DE0" />}
    />
    <IconButton
      label="Filter"
      variant="ghost"
      icon={<Filter size={20} color="#64748b" />}
    />
    <IconButton
      label="Dismiss"
      variant="outline"
      icon={<X size={20} color="#2D2DE0" />}
    />
    <IconButton
      label="Delete"
      variant="error"
      icon={<Trash2 size={20} color="#fff" />}
    />
  </View>
);
