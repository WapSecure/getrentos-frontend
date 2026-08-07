import path from 'node:path';

// ESLint's flat config is resolved per-package (apps/web, apps/backoffice each
// have their own eslint.config.mjs), so staged files must be linted from
// within their own package directory rather than the workspace root.
const scopedEslint = (pkgDir, pkgName) => (files) => {
  const relativeFiles = files
    .map((file) => path.relative(pkgDir, file))
    .filter((file) => !file.startsWith('..'));
  if (relativeFiles.length === 0) return [];
  const quoted = relativeFiles.map((file) => JSON.stringify(file)).join(' ');
  return [`pnpm --filter ${pkgName} exec eslint --fix ${quoted}`];
};

export default {
  'apps/web/**/*.{js,jsx,ts,tsx}': scopedEslint('apps/web', 'web'),
  'apps/backoffice/**/*.{js,jsx,ts,tsx}': scopedEslint('apps/backoffice', 'backoffice'),
  '*.{js,jsx,ts,tsx,json,md,yml,yaml}': ['prettier --write --ignore-unknown'],
};
