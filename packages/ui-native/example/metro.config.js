const { getDefaultConfig } = require("expo/metro-config");
const { withNativeWind } = require("nativewind/metro");
const path = require("path");

const projectRoot = __dirname;
const workspaceRoot = path.resolve(projectRoot, "../.."); // packages/

const config = getDefaultConfig(projectRoot);

// npm workspace: deps are hoisted to packages/node_modules. Watch the whole
// workspace and add the hoisted node_modules as a resolution root. Hierarchical
// lookup stays ON (Metro's default) so nested deps that aren't hoisted — e.g.
// react-native-reanimated's own semver@7 when babel pins semver@6 at the root —
// still resolve from their package's own node_modules. The workspace hoist
// already guarantees a single react / react-native copy.
config.watchFolders = [workspaceRoot];
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, "node_modules"),
  path.resolve(workspaceRoot, "node_modules"),
];

module.exports = withNativeWind(config, {
  input: require.resolve("@bizvizcards/ui-native/global.css"),
});
