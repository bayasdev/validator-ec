import { defineConfig } from "oxlint";
import antiSlop from "ultracite/oxlint/anti-slop";
import core from "ultracite/oxlint/core";
import vitest from "ultracite/oxlint/vitest";

/** Paths nothing here writes by hand. */
export const generated = [
  // Agent worktrees are whole copies of the repository.
  ".claude/**",
  // The published build.
  "dist/**",
];

export default defineConfig({
  extends: [core, vitest, antiSlop],
  ignorePatterns: [...(core.ignorePatterns ?? []), ...generated],
  options: {
    denyWarnings: true,
    reportUnusedDisableDirectives: "error",
    typeAware: true,
  },
  overrides: [
    {
      // A comment goes on the code it explains: never a file header, never
      // above or among the imports.
      files: ["**/*.{ts,mts,cts,js,mjs,cjs}"],
      jsPlugins: [
        { name: "file-comments", specifier: "./lint/file-comments.ts" },
      ],
      rules: { "file-comments/no-head-comments": "error" },
    },
    {
      // Tests assert behavior against an independent oracle, or a fixed value
      // that cites its source; never a snapshot or a mock's call count.
      files: ["**/*.test.ts"],
      jsPlugins: [
        { name: "honest-tests", specifier: "./lint/honest-tests.ts" },
      ],
      rules: {
        "honest-tests/literal-needs-source": "error",
        "honest-tests/no-call-counts": "error",
        "honest-tests/no-snapshots": "error",
      },
    },
  ],
});
