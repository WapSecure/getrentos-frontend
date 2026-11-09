const { defineConfig, globalIgnores } = require('eslint/config');
const expoConfig = require('eslint-config-expo/flat');

module.exports = defineConfig([
  expoConfig,
  // Naira-only product: no icon that draws a dollar sign.
  {
    rules: {
      'no-restricted-imports': [
        'error',
        {
          paths: [
            {
              name: 'lucide-react-native',
              importNames: [
                'DollarSign',
                'BadgeDollarSign',
                'CircleDollarSign',
                'SquareDollarSign',
                'Receipt',
              ],
              message:
                'Draws a dollar sign. Sureground is naira-only: use NairaSign from @sureground/ui or ReceiptText.',
            },
          ],
        },
      ],
    },
  },
  globalIgnores(['.expo/**', 'dist/**', 'android/**', 'ios/**']),
]);
