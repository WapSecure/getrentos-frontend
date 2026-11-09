// Watch only the packages this app imports, not the repo root: the sibling apps' .next/.turbo dirs make the Watchman crawl huge.
const { getDefaultConfig } = require('expo/metro-config');
const { withSentryConfig } = require('@sentry/react-native/metro');
const path = require('path');
const fs = require('fs');

const projectRoot = __dirname;
const workspaceRoot = path.resolve(projectRoot, '../..');

const config = getDefaultConfig(projectRoot);

config.watchFolders = [
  path.resolve(workspaceRoot, 'packages/tokens'),
  path.resolve(workspaceRoot, 'packages/ui-native'),
  path.resolve(workspaceRoot, 'packages/shared'),
  path.resolve(workspaceRoot, 'node_modules'),
];

config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, 'node_modules'),
  path.resolve(workspaceRoot, 'node_modules'),
];

config.resolver.disableHierarchicalLookup = false;

// Scoped to the web app dirs only: must NOT match node_modules/**/dist.
const escape = (p) => p.replace(/[/\\^$*+?.()|[\]{}]/g, '\\$&');
config.resolver.blockList = [
  new RegExp(`${escape(path.resolve(workspaceRoot, 'apps/web'))}/.*`),
  new RegExp(`${escape(path.resolve(workspaceRoot, 'apps/backoffice'))}/.*`),
  new RegExp(`${escape(workspaceRoot)}/(apps|packages)/[^/]+/\\.next/.*`),
  new RegExp(`${escape(workspaceRoot)}/(apps|packages)/[^/]+/\\.turbo/.*`),
];

const watchmanConfigPath = path.resolve(workspaceRoot, '.watchmanconfig');
if (!fs.existsSync(watchmanConfigPath)) {
  fs.writeFileSync(
    watchmanConfigPath,
    JSON.stringify({ ignore_dirs: ['.git', '.next', '.turbo', '.expo', 'coverage'] }, null, 2) +
      '\n'
  );
}

const hasSentryBuildConfig = Boolean(
  process.env.SENTRY_AUTH_TOKEN && process.env.SENTRY_ORG && process.env.SENTRY_PROJECT
);

// Sentry's serializer needs release credentials, so local and pull-request exports skip it.
module.exports = hasSentryBuildConfig
  ? withSentryConfig(config, {
      annotateReactComponents: false,
      includeWebReplay: false,
    })
  : config;
