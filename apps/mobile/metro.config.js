// Metro config for a pnpm monorepo: watch the repo root so workspace packages
// (@getrentos/shared, @getrentos/tokens, @getrentos/ui-native) resolve and
// hot-reload, and resolve modules from both the app and the root.
const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const projectRoot = __dirname;
const workspaceRoot = path.resolve(projectRoot, '../..');

const config = getDefaultConfig(projectRoot);

config.watchFolders = [workspaceRoot];
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, 'node_modules'),
  path.resolve(workspaceRoot, 'node_modules'),
];
// pnpm's non-hoisted layout: let Metro follow symlinks to the real package dirs.
config.resolver.unstable_enableSymlinks = true;
config.resolver.disableHierarchicalLookup = false;

module.exports = config;
