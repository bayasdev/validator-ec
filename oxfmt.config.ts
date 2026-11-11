import { defineConfig } from "oxfmt";
import ultracite from "ultracite/oxfmt";
import { generated } from "./oxlint.config.ts";

export default defineConfig({
  ...ultracite,
  ignorePatterns: [...(ultracite.ignorePatterns ?? []), ...generated],
  // Ultracite's order, with import groups kept together.
  sortImports: { ignoreCase: true, newlinesBetween: false, order: "asc" },
});
