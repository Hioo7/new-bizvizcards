import type { Preview } from "@storybook/react-native-web-vite";
import React from "react";
import { View } from "react-native";
import { ThemeRoot } from "../src/provider/ThemeRoot";
import "../src/global.css";

const preview: Preview = {
  parameters: {
    layout: "centered",
    controls: { disable: true },
  },
  decorators: [
    (Story) => (
      <ThemeRoot>
        <View style={{ padding: 16, minWidth: 320 }}>
          <Story />
        </View>
      </ThemeRoot>
    ),
  ],
};

export default preview;
