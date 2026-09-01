import type { StorybookConfig } from "@storybook/react-native-web-vite";

const config: StorybookConfig = {
  stories: ["../stories/**/*.stories.@(ts|tsx)"],
  addons: [],
  framework: {
    name: "@storybook/react-native-web-vite",
    options: {},
  },
  // The vendored gluestack sources have heavy generics — react-docgen parsing
  // them blows the heap. We don't need auto-generated prop tables for the
  // screenshot-review pass.
  typescript: {
    reactDocgen: false,
  },
  core: {
    disableTelemetry: true,
  },
};

export default config;
