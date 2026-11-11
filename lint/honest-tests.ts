import { definePlugin, defineRule } from "@oxlint/plugins";
import type { Comment, Context, ESTree } from "@oxlint/plugins";

type Node = ESTree.Node;

type Call = ESTree.CallExpression;

const SNAPSHOT_MATCHERS = new Set([
  "toMatchSnapshot",
  "toMatchInlineSnapshot",
  "toMatchFileSnapshot",
  "toThrowErrorMatchingSnapshot",
  "toThrowErrorMatchingInlineSnapshot",
]);

const CALL_COUNT_MATCHERS = new Set([
  "toHaveBeenCalledTimes",
  "toHaveBeenNthCalledWith",
]);

/**
 * The matchers whose expected value is a claim, and the position of that
 * value in the call. `toHaveLength` is left out on purpose: a length is
 * structure, not a figure.
 */
const EXPECTED_ARGUMENT = new Map([
  ["toBe", 0],
  ["toEqual", 0],
  ["toStrictEqual", 0],
  ["toBeCloseTo", 0],
  ["toMatchObject", 0],
  ["toContain", 0],
  ["toContainEqual", 0],
  ["toBeGreaterThan", 0],
  ["toBeGreaterThanOrEqual", 0],
  ["toBeLessThan", 0],
  ["toBeLessThanOrEqual", 0],
  ["toHaveProperty", 1],
]);

/**
 * What counts as a source. A test, an enclosing describe or a comment on or
 * above the assertion, the test or the describe names one of these, matched
 * case-insensitively as a whole word. Each entry is a regular expression
 * fragment; one that ends in `-` or `/` also matches what follows it.
 *
 * - Scientific references: NIST, IUPAC, a DOI, an arXiv paper, a table or
 *   an annex of one.
 * - Public standards: RFC, W3C, OWASP, WHATWG, ISO.
 * - Our own fixed contracts: regression (a named bug), contract, spec, and a
 *   path into our living docs (docs/reference/pricing.md).
 */
export const SOURCE_PATTERNS = [
  "NIST",
  "IUPAC",
  "DOI",
  "arXiv",
  "tables?",
  "annex(?:es)?",
  "RFC",
  "W3C",
  "OWASP",
  "WHATWG",
  "ISO",
  "regressions?",
  "contracts?",
  "specs?",
  "specification",
  "docs/",
];

const WORD_START = String.raw`(?<![\p{L}\p{N}])`;
const WORD_END = String.raw`(?![\p{L}\p{N}])`;

const SOURCE = new RegExp(
  SOURCE_PATTERNS.map(
    (pattern) =>
      `${WORD_START}${pattern}${/[-/]$/u.test(pattern) ? "" : WORD_END}`
  ).join("|"),
  "iu"
);

/**
 * HTTP status codes are a published contract (RFC 9110) wherever they appear
 * in an expected value, so none of these needs a citation: in an API test a
 * number this size is a status.
 */
const HTTP_STATUSES = new Set([
  200, 201, 202, 204, 301, 302, 304, 400, 401, 402, 403, 404, 405, 409, 410,
  413, 415, 422, 429, 500, 502, 503,
]);

/** Values that assert almost nothing: zero, one and minus one. */
const TRIVIAL_FIGURES = new Set([0, 1, -1]);

/** What `expect(x.status)` and `expect(list.length)` read: no figure to cite. */
const STRUCTURAL_PROPERTIES = new Set([
  "status",
  "statusCode",
  "length",
  "size",
]);

const TEST_CALLEES = new Set(["it", "test"]);
const GROUP_CALLEES = new Set(["describe", "suite"]);
const ASYMMETRIC_MATCHERS = new Set(["objectContaining", "arrayContaining"]);

/**
 * A string that reads as an amount, a count or a quantity: digits with a
 * decimal part or thousands separators ("1284.50", "1.284,50"), a currency
 * sign ("$12"), or a short whole number ("10"). Zero-padded strings ("001",
 * "000000123") and long ones (RUCs, access keys) are identifiers.
 */
const AMOUNT_STRING =
  /^[-+]?(?:[$€]\s?)?(?:[1-9]\d{0,5}|\d{1,3}(?:[.,]\d{3})+(?:[.,]\d+)?|\d+[.,]\d+)$/u;

const QUOTE_START = /^["'`]/u;
const NUMBER_START = /^[-+]?\.?\d/u;

const figureOfText = (text: string): number =>
  Number(text.replaceAll(/[$€\s]/gu, "").replace(",", "."));

/** The call chain's first identifier: `it.each(rows)` and `it.only` give `it`. */
const rootName = (node: Node): string | undefined => {
  let current: Node = node;

  for (;;) {
    if (current.type === "Identifier") {
      return current.name;
    }

    if (current.type === "MemberExpression") {
      current = current.object;
    } else if (current.type === "CallExpression") {
      current = current.callee;
    } else {
      return undefined;
    }
  }
};

const unwrap = (node: Node): Node =>
  node.type === "TSAsExpression" ||
  node.type === "TSSatisfiesExpression" ||
  node.type === "TSNonNullExpression" ||
  node.type === "ParenthesizedExpression"
    ? unwrap(node.expression)
    : node;

/** The text of a string literal, or of a template literal with no holes. */
const stringOf = (node: Node): string | undefined => {
  if (node.type === "Literal" && QUOTE_START.test(node.raw ?? "")) {
    return String(node.value);
  }

  if (node.type === "TemplateLiteral" && node.expressions.length === 0) {
    return node.quasis.map((part) => part.value.cooked ?? "").join("");
  }

  return undefined;
};

/** The signed number a node spells out, when it is only a number literal. */
const figureOf = (node: Node): number | undefined => {
  if (node.type === "Literal" && NUMBER_START.test(node.raw ?? "")) {
    return Number(String(node.raw).replaceAll("_", ""));
  }

  if (
    node.type === "UnaryExpression" &&
    (node.operator === "-" || node.operator === "+")
  ) {
    const figure = figureOf(unwrap(node.argument));

    return figure !== undefined && node.operator === "-" ? -figure : figure;
  }

  return undefined;
};

const claimsFigure = (figure: number): boolean =>
  !(TRIVIAL_FIGURES.has(figure) || HTTP_STATUSES.has(figure));

const claimsText = (text: string): boolean =>
  AMOUNT_STRING.test(text) && !TRIVIAL_FIGURES.has(figureOfText(text));

/** What an expected value holds: elements, property values, matcher arguments. */
const partsOf = (value: Node): Node[] => {
  const parts: Node[] = [];

  if (value.type === "ArrayExpression") {
    for (const element of value.elements) {
      if (element !== null && element.type !== "SpreadElement") {
        parts.push(element);
      }
    }
  } else if (value.type === "ObjectExpression") {
    for (const property of value.properties) {
      if (property.type === "Property") {
        parts.push(property.value);
      }
    }
  } else if (
    value.type === "CallExpression" &&
    value.callee.type === "MemberExpression" &&
    value.callee.object.type === "Identifier" &&
    value.callee.object.name === "expect" &&
    value.callee.property.type === "Identifier" &&
    ASYMMETRIC_MATCHERS.has(value.callee.property.name)
  ) {
    for (const argument of value.arguments) {
      if (argument.type !== "SpreadElement") {
        parts.push(argument);
      }
    }
  }

  return parts;
};

/** The first literal in an expected value that claims a figure. */
const claimIn = (node: Node): Node | undefined => {
  const value = unwrap(node);
  const figure = figureOf(value);

  if (figure !== undefined) {
    return claimsFigure(figure) ? value : undefined;
  }

  const text = stringOf(value);

  if (text !== undefined) {
    return claimsText(text) ? value : undefined;
  }

  return partsOf(value)
    .map((part) => claimIn(part))
    .find((claim) => claim !== undefined);
};

const matcherName = (call: Call): string | undefined => {
  const { callee } = call;

  return callee.type === "MemberExpression" &&
    !callee.computed &&
    callee.property.type === "Identifier"
    ? callee.property.name
    : undefined;
};

/** The value under test when the call is a matcher on `expect(...)`. */
const subjectOf = (call: Call): Node | undefined => {
  let current: Node | undefined =
    call.callee.type === "MemberExpression" ? call.callee.object : undefined;

  while (current?.type === "MemberExpression") {
    current = current.object;
  }

  if (current?.type !== "CallExpression") {
    return undefined;
  }

  const { callee } = current;

  const isExpect =
    (callee.type === "Identifier" && callee.name === "expect") ||
    (callee.type === "MemberExpression" &&
      callee.object.type === "Identifier" &&
      callee.object.name === "expect");

  return isExpect ? current.arguments[0] : undefined;
};

const isStructural = (subject: Node | undefined): boolean => {
  const member =
    subject?.type === "ChainExpression" ? subject.expression : subject;

  return (
    member?.type === "MemberExpression" &&
    !member.computed &&
    member.property.type === "Identifier" &&
    STRUCTURAL_PROPERTIES.has(member.property.name)
  );
};

const titleOf = (call: Call): string => {
  const [title] = call.arguments;

  return title === undefined || title.type === "SpreadElement"
    ? ""
    : (stringOf(title) ?? "");
};

/** The statement a node lives in, so comments are read around it. */
const statementOf = (node: Node): Node => {
  let current: Node = node;

  while (
    current.parent !== null &&
    current.parent.type !== "BlockStatement" &&
    current.parent.type !== "Program"
  ) {
    current = current.parent;
  }

  return current;
};

/**
 * The comments in the unbroken run of comment lines right above a node and on
 * its first line, and, for an assertion, anywhere inside it.
 */
const commentsAround = (
  node: Node,
  context: Context,
  withInside: boolean
): Comment[] => {
  const { text } = context.sourceCode;

  const standsAlone = (comment: Comment) =>
    text
      .slice(text.lastIndexOf("\n", comment.start - 1) + 1, comment.start)
      .trim() === "";

  const found: Comment[] = [];
  let above = node.loc.start.line - 1;

  for (const comment of context.sourceCode.getAllComments().toReversed()) {
    const first = comment.loc.start.line;
    const last = comment.loc.end.line;

    const onNode = withInside
      ? first <= node.loc.end.line && last >= node.loc.start.line
      : first === node.loc.start.line;

    if (onNode) {
      found.push(comment);
    } else if (last === above && standsAlone(comment)) {
      found.push(comment);
      above = first - 1;
    }
  }

  return found;
};

const citesSource = (text: string): boolean => SOURCE.test(text);

/** The tests and describes an assertion sits in. */
const enclosingGroups = (assertion: Node): Call[] => {
  const groups: Call[] = [];
  let current: Node | null = assertion.parent;

  while (current !== null) {
    const name =
      current.type === "CallExpression" ? rootName(current.callee) : undefined;

    if (
      current.type === "CallExpression" &&
      name !== undefined &&
      (TEST_CALLEES.has(name) || GROUP_CALLEES.has(name))
    ) {
      groups.push(current);
    }

    ({ parent: current } = current);
  }

  return groups;
};

/** Whether a title or a comment around the assertion names a source. */
const hasSource = (assertion: Node, context: Context): boolean => {
  const groups = enclosingGroups(assertion);

  const near = (node: Node, withInside: boolean) =>
    commentsAround(node, context, withInside).some((comment) =>
      citesSource(comment.value)
    );

  return (
    groups.some((group) => citesSource(titleOf(group))) ||
    near(statementOf(assertion), true) ||
    groups.some((group) => near(statementOf(group), false))
  );
};

const noSnapshots = defineRule({
  create: (context) => ({
    CallExpression: (node) => {
      const matcher = matcherName(node);

      if (matcher !== undefined && SNAPSHOT_MATCHERS.has(matcher)) {
        context.report({ data: { matcher }, messageId: "snapshot", node });
      }
    },
  }),
  meta: {
    docs: {
      description:
        "A snapshot records whatever the code did; it never says what is right.",
    },
    messages: {
      snapshot:
        "{{ matcher }} records the code's own output, so it passes whatever the code does. Assert the properties that matter against an independent oracle (a Hegel property or a model written separately), or assert a fixed value that cites its source.",
    },
    schema: [],
    type: "problem",
  },
});

const noCallCounts = defineRule({
  create: (context) => ({
    CallExpression: (node) => {
      const matcher = matcherName(node);

      if (matcher !== undefined && CALL_COUNT_MATCHERS.has(matcher)) {
        context.report({ data: { matcher }, messageId: "callCount", node });
      }
    },
  }),
  meta: {
    docs: {
      description:
        "A mock's call count restates how the code is wired, not what it did.",
    },
    messages: {
      callCount:
        "{{ matcher }} pins how often the code calls its collaborator, so a refactor breaks it and a bug can still pass it. Use a recording fake and assert on what happened: the entries it holds, in order.",
    },
    schema: [],
    type: "problem",
  },
});

const literalNeedsSource = defineRule({
  create: (context) => ({
    CallExpression: (node) => {
      const matcher = matcherName(node);

      const position =
        matcher === undefined ? undefined : EXPECTED_ARGUMENT.get(matcher);

      const subject = subjectOf(node);

      const expected =
        position === undefined ? undefined : node.arguments[position];

      if (
        expected === undefined ||
        expected.type === "SpreadElement" ||
        subject === undefined ||
        isStructural(subject)
      ) {
        return;
      }

      const claim = claimIn(expected);

      if (claim !== undefined && !hasSource(node, context)) {
        context.report({ messageId: "literal", node: claim });
      }
    },
  }),
  meta: {
    docs: {
      description:
        "A figure a test expects must cite where it comes from, or the test should be a property.",
    },
    messages: {
      literal:
        "This expects a bare figure, which usually echoes what the code printed. Replace it with a Hegel property checked against an independent oracle, or cite the source (NIST, IUPAC, a DOI, an arXiv paper, a table, RFC, W3C, OWASP, WHATWG, ISO, a named regression or contract) in the test or describe title, or in a comment on or above the assertion.",
    },
    schema: [],
    type: "problem",
  },
});

export default definePlugin({
  meta: { name: "honest-tests" },
  rules: {
    "literal-needs-source": literalNeedsSource,
    "no-call-counts": noCallCounts,
    "no-snapshots": noSnapshots,
  },
});
