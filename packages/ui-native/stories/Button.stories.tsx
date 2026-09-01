import React from "react";
import { View } from "react-native";
import { Plus, ScanLine, Trash2 } from "./_icons";
import { Button } from "@bizvizcards/ui-native";

export default { title: "Actions/Button" };

export const Primary = () => (
  <Button leadingIcon={<Plus size={16} color="#fff" />}>Add lead</Button>
);

export const Variants = () => (
  <View className="gap-2">
    <Button variant="primary">Save</Button>
    <Button variant="secondary">Preview</Button>
    <Button variant="outline">Edit</Button>
    <Button variant="ghost">Cancel</Button>
    <Button variant="error" leadingIcon={<Trash2 size={16} color="#fff" />}>
      Delete
    </Button>
  </View>
);

export const Sizes = () => (
  <View className="gap-2">
    <Button size="sm">Small</Button>
    <Button size="md">Medium</Button>
    <Button size="lg">Large</Button>
  </View>
);

export const BlockCta = () => (
  <View className="w-72">
    <Button block leadingIcon={<ScanLine size={16} color="#fff" />}>
      Scan a business card
    </Button>
  </View>
);

export const Loading = () => (
  <View className="flex-row gap-2">
    <Button isLoading>Saving</Button>
    <Button variant="outline" isDisabled>
      Disabled
    </Button>
  </View>
);
