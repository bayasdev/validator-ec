import { RuleTester } from "oxlint/plugins-dev";
import { describe, it } from "vitest";
import plugin from "./file-comments.ts";

// SAFETY: Vitest's `describe` and `it` return their suite and test, which the
// tester ignores; it only wants functions with these parameters.
RuleTester.describe = describe as RuleTester.DescribeFn;

// SAFETY: as above.
RuleTester.it = it as RuleTester.ItFn;

const rule = plugin.rules?.["no-head-comments"];

if (rule === undefined) {
  throw new Error("file-comments has no rule no-head-comments");
}

const filename = "module.ts";
const valid = (code: string) => ({ code, filename });

const invalid = (code: string, count = 1) => ({
  code,
  errors: Array.from({ length: count }, () => ({ messageId: "head" as const })),
  filename,
});

new RuleTester().run("no-head-comments", rule, {
  invalid: [
    invalid('// What this file does.\nimport { a } from "a";'),
    invalid('import { a } from "a";\n// Why c.\nimport { c } from "c";'),
    invalid('import {\n  a, // the a\n} from "a";'),
    invalid("// What this file does.\n\nexport const b = 2;"),
    invalid('/* One.\n */\n// Two.\nimport { a } from "a";', 2),
    // A license elsewhere keeps only its own run.
    invalid(
      '// What this file does.\n\n// Copyright (c) 2023 Someone\nimport { a } from "a";'
    ),
  ],
  valid: [
    valid('import { a } from "a";\n\n// Why b is two.\nconst b = 2;'),
    valid("/** What b is. */\nexport const b = 2;"),
    valid('/// <reference types="vite/client" />\nimport { a } from "a";'),
    valid('// @ts-nocheck\nimport { a } from "a";'),
    valid('// @refresh reset\nimport { a } from "a";'),
    valid('import { a } from "a";\nconst b = a; // why'),
    // MIT: "The above copyright notice and this permission notice shall be
    // included in all copies or substantial portions of the Software."
    valid(
      '// Ported from x.\n//\n// MIT License\n//\n// Copyright (c) 2023 Someone\n//\n// Permission is hereby granted.\nimport { a } from "a";'
    ),
    valid('// SPDX-License-Identifier: Apache-2.0\nimport { a } from "a";'),
  ],
});
