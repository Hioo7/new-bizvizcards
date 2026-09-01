module.exports = {
  preset: "jest-expo",
  rootDir: ".",
  setupFilesAfterEnv: ["<rootDir>/jest.setup.ts"],
  testMatch: ["<rootDir>/src/**/*.test.{ts,tsx}"],
  transformIgnorePatterns: [
    "node_modules/(?!((jest-)?react-native|@react-native(-community)?|expo(nent)?|@expo(nent)?/.*|@expo-google-fonts/.*|react-navigation|@react-navigation/.*|@unimodules/.*|unimodules|sentry-expo|native-base|react-native-svg|nativewind|react-native-css-interop|@legendapp/motion|@gluestack-ui/.*|@bizvizcards/.*|react-native-worklets))",
  ],
};
