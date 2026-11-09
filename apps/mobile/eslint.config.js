const { defineConfig, globalIgnores } = require('eslint/config');
const expoConfig = require('eslint-config-expo/flat');

module.exports = defineConfig([
  expoConfig,
  // Icons come from @sureground/icons/native (our own set, naira-only: it has no dollar icons).
  {
    rules: {
      'no-restricted-imports': [
        'error',
        {
          paths: [
            {
              name: 'lucide-react-native',
              message:
                'Use @sureground/icons/native (same icon names). Run pnpm icons:migrate to move a file over.',
            },
          ],
        },
      ],
    },
  },
  globalIgnores(['.expo/**', 'dist/**', 'android/**', 'ios/**']),
]);
