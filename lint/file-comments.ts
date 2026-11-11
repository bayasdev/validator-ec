import { definePlugin, defineRule } from "@oxlint/plugins";

/** What a comment may still say above the code: a tool's directive, never prose. */
const DIRECTIVE =
  /^\s*(?:\/|@ts-|eslint-|oxlint-|@vitest-environment|@jsx|biome-ignore|#__PURE__|@refresh)/u;

interface Located {
  end: number;
  start: number;
  type: string;
}

/**
 * Where a file's head ends: after its last leading import, or, without
 * imports, where its first statement starts. A comment before it is a file
 * header or sits among the imports; without imports, one touching the first
 * statement documents that statement and stays.
 */
export const headOf = (
  body: readonly (Located & { directive?: unknown })[],
  text: string
) => {
  let lastImport: Located | undefined;

  for (const statement of body) {
    if (statement.type === "ImportDeclaration") {
      lastImport = statement;
    } else if (
      !(statement.type === "ExpressionStatement" && "directive" in statement)
    ) {
      break;
    }
  }

  if (lastImport !== undefined) {
    return { end: lastImport.end, touching: false };
  }

  const [first] = body;

  return { end: first?.start ?? text.length, touching: true };
};

/** What a license names itself by, which a port must keep with its notice (MIT, Apache, BSD). */
const LICENSE = /Copyright|SPDX-License-Identifier|@license/u;

/**
 * The comments of the runs that carry a license: a run is comments on
 * consecutive lines, so a notice written as many line comments stays whole
 * and a blank line ends it.
 */
const licensed = (
  comments: readonly (Located & { value: string })[],
  text: string
) => {
  const runs: (Located & { value: string })[][] = [];

  for (const comment of comments) {
    const run = runs.at(-1);
    const last = run?.at(-1);

    if (
      run !== undefined &&
      last !== undefined &&
      /^[^\S\n]*\n?[^\S\n]*$/u.test(text.slice(last.end, comment.start))
    ) {
      run.push(comment);
    } else {
      runs.push([comment]);
    }
  }

  return new Set(
    runs
      .filter((run) => run.some((comment) => LICENSE.test(comment.value)))
      .flat()
  );
};

/** Whether only spaces and one line break part a comment from what follows it. */
const touches = (text: string, from: number, to: number) =>
  !/\n[^\S\n]*\n/u.test(text.slice(from, to));

const noHeadComments = defineRule({
  create: (context) => ({
    Program: (node) => {
      const { text } = context.sourceCode;
      const head = headOf(node.body, text);
      const comments = context.sourceCode.getAllComments();
      const kept = licensed(comments, text);

      for (const comment of comments) {
        if (kept.has(comment)) {
          continue;
        }

        const documentsFirst =
          head.touching && touches(text, comment.end, head.end);

        if (
          comment.end <= head.end &&
          !documentsFirst &&
          !DIRECTIVE.test(comment.value)
        ) {
          context.report({ loc: comment.loc, messageId: "head" });
        }
      }
    },
  }),
  meta: {
    docs: {
      description:
        "No comment above or within the import block, and no file header: say why on the code it explains. A license notice stays.",
    },
    messages: {
      head: "Comments go on the code they explain, never above or among a file's imports; move what it says to the declaration it is about, or drop it.",
    },
    schema: [],
    type: "suggestion",
  },
});

export default definePlugin({
  meta: { name: "file-comments" },
  rules: { "no-head-comments": noHeadComments },
});
