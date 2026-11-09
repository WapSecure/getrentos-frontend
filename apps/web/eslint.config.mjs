import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Naira-only product: no icon that draws a dollar sign.
  {
    rules: {
      "no-restricted-imports": [
        "error",
        {
          paths: [
            {
              name: "lucide-react",
              importNames: ["DollarSign", "BadgeDollarSign", "CircleDollarSign", "SquareDollarSign", "Receipt"],
              message:
                "Draws a dollar sign. Sureground is naira-only: use NairaSign from @sureground/ui or ReceiptText.",
            },
          ],
        },
      ],
    },
  },
  globalIgnores([
    ".next*/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
  ]),
]);

export default eslintConfig;
