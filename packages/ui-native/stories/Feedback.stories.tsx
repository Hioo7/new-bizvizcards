import React from "react";
import { View } from "react-native";
import { Inbox, ScanLine, WifiOff, Plus, CircleAlert, CircleCheck, Info, Check } from "./_icons";
import {
  Badge,
  Toast,
  Spinner,
  EmptyState,
  Button,
} from "@bizvizcards/ui-native";

export default { title: "Feedback" };
const noop = () => {};

export const Badge_Tones = () => (
  <View className="flex-row flex-wrap items-center gap-2">
    <Badge tone="neutral">Draft</Badge>
    <Badge tone="primary">Team plan</Badge>
    <Badge tone="info">New</Badge>
    <Badge tone="success">Published</Badge>
    <Badge tone="warning">Payment due</Badge>
    <Badge tone="error">Suspended</Badge>
  </View>
);

export const Badge_Outline = () => (
  <View className="flex-row flex-wrap items-center gap-2">
    <Badge tone="success" outline icon={<Check size={12} color="#16a34a" />}>
      Card Scanner
    </Badge>
    <Badge tone="info" outline>
      Website
    </Badge>
    <Badge tone="neutral" outline>
      Manual entry
    </Badge>
  </View>
);

export const Badge_Sizes = () => (
  <View className="flex-row items-center gap-2">
    <Badge tone="primary" size="sm">
      Small
    </Badge>
    <Badge tone="primary" size="md">
      Medium
    </Badge>
    <Badge tone="primary" size="lg">
      Large
    </Badge>
  </View>
);

export const Toast_AllTones = () => (
  <View className="w-96 gap-2">
    <Toast action="info" icon={<Info size={18} color="#fff" />}>
      Your card link was copied
    </Toast>
    <Toast action="warning" icon={<CircleAlert size={18} color="#fff" />}>
      Scanner is busy — try again in a moment
    </Toast>
    <Toast action="error" icon={<CircleAlert size={18} color="#fff" />}>
      Too many scans — wait a few seconds
    </Toast>
  </View>
);

export const Toast_Success = () => (
  <View className="w-96">
    <Toast
      action="success"
      icon={<CircleCheck size={18} color="#fff" />}
      onDismiss={noop}
    >
      Lead saved to “Trade show 2026”
    </Toast>
  </View>
);

export const Spinner_Sizes = () => (
  <View className="flex-row items-center gap-6">
    <Spinner size="sm" />
    <Spinner size="md" />
    <Spinner size="lg" />
  </View>
);

export const Spinner_WithLabel = () => (
  <Spinner size="lg" label="Reading card…" showLabel />
);

export const Empty_NoLeads = () => (
  <View className="w-80">
    <EmptyState
      icon={<Inbox size={24} color="#94a3b8" />}
      title="No leads yet"
      description="Scan a business card or add one by hand to get started."
      action={
        <Button leadingIcon={<Plus size={16} color="#fff" />} onPress={noop}>
          Add lead
        </Button>
      }
    />
  </View>
);

export const Empty_NoResults = () => (
  <View className="w-80">
    <EmptyState
      icon={<ScanLine size={24} color="#94a3b8" />}
      title="No matches"
      description="No leads match “bengaluru”. Try a different search."
    />
  </View>
);

export const Empty_Offline = () => (
  <View className="w-80">
    <EmptyState
      icon={<WifiOff size={24} color="#94a3b8" />}
      title="Couldn't load your leads"
      description="Check your connection and try again."
      action={
        <Button variant="outline" onPress={noop}>
          Retry
        </Button>
      }
    />
  </View>
);
