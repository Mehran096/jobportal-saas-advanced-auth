import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
  ]),
 {
    rules: {
      "react-hooks/set-state-in-effect": "warn", // error -> warning
      "react-hooks/exhaustive-deps": "warn",     // error -> warning
      "@typescript-eslint/no-explicit-any": "warn" // error -> warning
    }
  }
]);

export default eslintConfig;
