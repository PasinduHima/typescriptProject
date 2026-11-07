// @ts-check
import js from "@eslint/js";
import globals from "globals";
import tseslint from "typescript-eslint";
import prettier from "eslint-config-prettier";
import { defineConfig, globalIgnores } from "eslint/config";

export default defineConfig([
  globalIgnores(["dist", "coverage"]),
  {
    files: ["**/*.{ts,js}"],
    extends: [js.configs.recommended, tseslint.configs.strict],
    languageOptions: {
      globals: globals.browser,
    },
  },
  // Must come last: turns off ESLint rules that conflict with Prettier formatting.
  prettier,
]);
