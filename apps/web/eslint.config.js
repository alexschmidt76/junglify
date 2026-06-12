import eslintPluginAstro from "eslint-plugin-astro";
import { config } from "@repo/eslint-config/react";

/** @type {import("eslint").Linter.Config[]} */
export default [
  ...config,
  ...eslintPluginAstro.configs.recommended,
  {
    ignores: [".astro/**", ".vercel/**"],
  },
];
