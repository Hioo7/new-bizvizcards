import React from "react";
import { View, Text } from "react-native";

export default { title: "_Canary" };

export const Swatch = () => (
  <View className="rounded-box bg-primary-500 p-4">
    <Text className="font-semibold text-typography-0">bizviz primary #2D2DE0</Text>
  </View>
);

export const Neutrals = () => (
  <View className="gap-2">
    <View className="rounded-field bg-background-50 p-3">
      <Text className="text-typography-900">background-50 / typography-900</Text>
    </View>
    <View className="rounded-field border border-outline-100 p-3">
      <Text className="text-typography-500">outline-100 border / typography-500</Text>
    </View>
  </View>
);
