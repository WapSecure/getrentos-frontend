// Metro config for a pnpm monorepo.
//
// We deliberately do NOT watch the whole repo root — that pulls apps/web,
// apps/backoffice and their .next/.turbo build dirs into the file crawl, which
// makes the initial Watchman query huge. We watch only the workspace packages
// this app imports, plus the shared node_modules store.
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

// pnpm's non-hoisted layout: follow symlinks to the real package dirs.
config.resolver.unstable_enableSymlinks = true;
config.resolver.disableHierarchicalLookup = false;

// Keep the sibling web apps and their build output out of the file map.
// Scoped to those app dirs only — must NOT match node_modules/**/dist.
const escape = (p) => p.replace(/[/\\^$*+?.()|[\]{}]/g, '\\$&');
config.resolver.blockList = [
  new RegExp(`${escape(path.resolve(workspaceRoot, 'apps/web'))}/.*`),
  new RegExp(`${escape(path.resolve(workspaceRoot, 'apps/backoffice'))}/.*`),
  new RegExp(`${escape(workspaceRoot)}/(apps|packages)/[^/]+/\\.next/.*`),
  new RegExp(`${escape(workspaceRoot)}/(apps|packages)/[^/]+/\\.turbo/.*`),
];

// A root .watchmanconfig so Watchman skips heavy VCS/build dirs (never node_modules).
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

// The Sentry serializer requires release credentials. Keep local and pull-request
// exports deterministic; protected EAS builds still receive source-map handling.
module.exports = hasSentryBuildConfig
  ? withSentryConfig(config, {
      annotateReactComponents: false,
      includeWebReplay: false,
    })
  : config;
