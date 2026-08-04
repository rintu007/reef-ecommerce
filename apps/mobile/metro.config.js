const { getDefaultConfig } = require("expo/metro-config");
const { withNativeWind } = require("nativewind/metro");
const path = require("path");

const projectRoot = __dirname;
const workspaceRoot = path.resolve(projectRoot, "../..");

const config = getDefaultConfig(projectRoot);

// Monorepo resolution: watch the workspace root so changes to
// packages/shared trigger Metro rebuilds, and let it fall back to the
// workspace root's node_modules too. Hoisted pnpm linking (see root
// .npmrc) does the heavy lifting for resolving nested transitive deps —
// Metro doesn't handle pnpm's default strict/symlinked layout well.
config.watchFolders = [workspaceRoot];
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, "node_modules"),
  path.resolve(workspaceRoot, "node_modules"),
];

module.exports = withNativeWind(config, { input: "./src/global.css" });
