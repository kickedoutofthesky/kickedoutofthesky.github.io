import { defineConfig } from "eslint/config";
import js from "@eslint/js";
import globals from "globals";

export default defineConfig([
  // Apply eslint recommended config to all files
  js.configs.recommended,

  // Main configuration
  {
    files: ["**/*.js"],
    languageOptions: {
      ecmaVersion: "latest",
      sourceType: "module",
      globals: {
        // Browser environment
        ...globals.browser,
        // Node.js environment
        ...globals.node,
        // Jest testing framework
        ...globals.jest,
      },
    },
    rules: {
      "no-unused-vars": [
        "warn",
        {
          argsIgnorePattern: "^_",
        },
      ],
    },
  },

  // Ignore patterns
  {
    ignores: [
      "**/node_modules/**",
      "**/dist/**",
      "**/build/**",
      "**/.git/**",
      "**/coverage/**",
      "cypress/downloads/**",
      "cypress/screenshots/**",
      "cypress/videos/**",
      "**/temp.js",
    ],
  },
]);
