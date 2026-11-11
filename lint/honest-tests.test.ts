import { RuleTester } from "oxlint/plugins-dev";
import { describe, it } from "vitest";
import plugin from "./honest-tests.ts";

// SAFETY: Vitest's `describe` and `it` return their suite and test, which the
// tester ignores; it only wants functions with these parameters.
RuleTester.describe = describe as RuleTester.DescribeFn;

// SAFETY: as above.
RuleTester.it = it as RuleTester.ItFn;

const tester = new RuleTester();
const filename = "money.test.ts";

const valid = (code: string) => ({ code, filename });

const invalid = (code: string, messageId: string, count = 1) => ({
  code,
  errors: Array.from({ length: count }, () => ({ messageId })),
  filename,
});

const rule = (name: string) => {
  const found = plugin.rules?.[name];

  if (found === undefined) {
    throw new Error(`honest-tests has no rule ${name}`);
  }

  return found;
};

tester.run("no-snapshots", rule("no-snapshots"), {
  invalid: [
    invalid("it('a', () => { expect(x).toMatchSnapshot(); });", "snapshot"),
    invalid(
      "it('a', () => { expect(x).toMatchInlineSnapshot(); });",
      "snapshot"
    ),
    invalid(
      "it('a', () => { expect(x).toMatchFileSnapshot('x.txt'); });",
      "snapshot"
    ),
    invalid(
      "it('a', () => { expect(() => f()).toThrowErrorMatchingSnapshot(); });",
      "snapshot"
    ),
    invalid(
      "it('a', () => { expect(() => f()).toThrowErrorMatchingInlineSnapshot(); });",
      "snapshot"
    ),
    invalid(
      "it('a', async () => { await expect(p).resolves.toMatchSnapshot(); });",
      "snapshot"
    ),
  ],
  valid: [
    valid("it('adds', () => { expect(add(2, 3)).toBe(add(3, 2)); });"),
    valid(
      "it('names the field', () => { expect(error.path).toStrictEqual(['a']); });"
    ),
  ],
});

tester.run("no-call-counts", rule("no-call-counts"), {
  invalid: [
    invalid(
      "it('a', () => { expect(send).toHaveBeenCalledTimes(2); });",
      "callCount"
    ),
    invalid(
      "it('a', () => { expect(send).not.toHaveBeenCalledTimes(0); });",
      "callCount"
    ),
    invalid(
      "it('a', () => { expect(send).toHaveBeenNthCalledWith(1, 'a'); });",
      "callCount"
    ),
  ],
  valid: [
    valid(
      "it('a', () => { expect(sent).toStrictEqual([{ to: 'a@b.ec' }]); });"
    ),
    valid("it('a', () => { expect(send).toHaveBeenCalledWith('a'); });"),
    valid("it('a', () => { expect(send).toHaveBeenCalledOnce(); });"),
  ],
});

tester.run("literal-needs-source", rule("literal-needs-source"), {
  invalid: [
    invalid("it('totals', () => { expect(total).toBe(249); });", "literal"),
    invalid(
      "it('totals', () => { expect(total).toBe('1284.50'); });",
      "literal"
    ),
    invalid(
      "it('totals', () => { expect(delta).toStrictEqual(-3); });",
      "literal"
    ),
    invalid(
      "it('totals', () => { expect(avg).toBeCloseTo(1.75); });",
      "literal"
    ),
    invalid(
      "it('totals', () => { expect(avg).toBeCloseTo(1.75, 2); });",
      "literal"
    ),
    invalid("it('totals', () => { expect(total).toBe(25_000); });", "literal"),
    invalid("it('totals', () => { expect(total).not.toBe(249); });", "literal"),
    invalid(
      "it('totals', async () => { await expect(total()).resolves.toBe(249); });",
      "literal"
    ),
    invalid(
      "it('totals', () => { expect(total).toBe('1.284,50'); });",
      "literal"
    ),
    invalid("it('totals', () => { expect(total).toBe('$12'); });", "literal"),
    invalid("it('totals', () => { expect(count).toBe('10'); });", "literal"),
    invalid(
      "it('totals', () => { expect(total).toBeGreaterThan(100); });",
      "literal"
    ),
    invalid(
      "it('totals', () => { expect(total).toBeLessThanOrEqual(7); });",
      "literal"
    ),
    invalid("it('totals', () => { expect(list).toContain(5); });", "literal"),
    invalid(
      "it('totals', () => { expect(obj).toHaveProperty('total', 249); });",
      "literal"
    ),
    // Figures inside an expected array or object.
    invalid(
      "it('totals', () => { expect(totals).toStrictEqual([12, 30]); });",
      "literal"
    ),
    invalid(
      "it('totals', () => { expect(totals).toEqual([[1, 2], [3, 4]]); });",
      "literal"
    ),
    invalid(
      "it('totals', () => { expect(doc).toMatchObject({ total: 249 }); });",
      "literal"
    ),
    invalid(
      "it('totals', () => { expect(doc).toStrictEqual({ lines: [{ qty: 3 }] }); });",
      "literal"
    ),
    invalid(
      "it('totals', () => { expect(doc).toMatchObject({ total: '12.50', ok: true }); });",
      "literal"
    ),
    invalid(
      "it('totals', () => { expect(doc).toEqual(expect.objectContaining({ total: 249 })); });",
      "literal"
    ),
    invalid(
      "it('totals', () => { expect(list).toEqual(expect.arrayContaining([249])); });",
      "literal"
    ),
    invalid(
      "it('totals', () => { expect(doc).toStrictEqual({ total: 249 as number }); });",
      "literal"
    ),
    // A bare test or assertion outside any title, and a source that is not a word of its own.
    invalid("expect(total).toBe(249);", "literal"),
    invalid(
      "it('is isolated from the other tests', () => { expect(total).toBe(249); });",
      "literal"
    ),
    invalid(
      "it('totals', () => {\n  // the total of the usual order\n  expect(total).toBe(249);\n});",
      "literal"
    ),
    invalid(
      "it('totals', () => {\n  // table 3\n\n  expect(total).toBe(249);\n});",
      "literal"
    ),
    invalid(
      "it('totals', () => {\n  const x = 1; // table\n  expect(total).toBe(249);\n});",
      "literal"
    ),
    invalid(
      "// table\nit('first', () => {\n  expect(a).toBe(1);\n});\nit('second', () => {\n  expect(total).toBe(249);\n});",
      "literal"
    ),
    invalid(
      "it('a', () => { expect(a).toBe(249); expect(b).toBe(7); });",
      "literal",
      2
    ),
  ],
  valid: [
    // Properties and values computed by an oracle carry no literal.
    valid("it('a', () => { expect(total(lines)).toBe(sumInCents(lines)); });"),
    valid("it('a', () => { expect(total).toBe(expected); });"),
    // Trivial figures and structure.
    valid(
      "it('a', () => { expect(count).toBe(0); expect(count).toBe(1); expect(delta).toBe(-1); });"
    ),
    valid(
      "it('a', () => { expect(flag).toBe(true); expect(name).toBe(''); });"
    ),
    valid("it('a', () => { expect(rows).toHaveLength(3); });"),
    valid(
      "it('a', () => { expect(rows.length).toBe(3); expect(set.size).toBe(2); });"
    ),
    valid("it('a', () => { expect(rows?.length).toBeGreaterThan(10); });"),
    valid(
      "it('a', () => { expect(zero).toBe('0'); expect(one).toBe('1.00'); });"
    ),
    // HTTP statuses, anywhere in an expected value.
    valid("it('a', () => { expect(response.status).toBe(201); });"),
    valid("it('a', () => { expect(response.status).toBe(418); });"),
    valid("it('a', () => { expect(answer).toBe(404); });"),
    valid(
      "it('a', () => { expect(answers).toStrictEqual([201, 409, 422]); });"
    ),
    valid(
      "it('a', () => { expect(result).toStrictEqual({ status: 403, body: { type: 'forbidden' } }); });"
    ),
    // Identifiers and text are not figures.
    valid(
      "it('a', () => { expect(series).toBe('001'); expect(ruc).toBe('1792146739001'); });"
    ),
    valid(
      "it('a', () => { expect(name).toBe('Ferretería El Sol'); expect(date).toBe('2024-03-01'); });"
    ),
    // A title that cites its source.
    valid(
      "it('is the rate in NIST table 16', () => { expect(rate).toBe(15); });"
    ),
    valid(
      "it('rejects a shift above the IUPAC limit', () => { expect(limit).toBe('100.00'); });"
    ),
    valid("it('follows arXiv 2605.02003', () => { expect(days).toBe(20); });"),
    valid(
      "it('matches RFC 9110 Retry-After', () => { expect(wait).toBe('10'); });"
    ),
    valid(
      "it('keeps the regression of the 2024 rounding bug', () => { expect(total).toBe('249.00'); });"
    ),
    valid("it('is a contract', () => { expect(fee).toBe(299); });"),
    // A describe title that cites its source, even for a nested test.
    valid(
      "describe('annex 3', () => { describe('rows', () => { it('a', () => { expect(code).toBe(5); }); }); });"
    ),
    valid(
      "describe('ISO 8601', () => { it.each(rows)('a', (row) => { expect(row).toBe(7); }); });"
    ),
    // A comment on the assertion, above it, above the test, or above the describe.
    valid(
      "it('a', () => {\n  // Annex 7: the rounding.\n  expect(total).toBe('12.35');\n});"
    ),
    valid("it('a', () => {\n  expect(total).toBe('12.35'); // table 24\n});"),
    valid(
      "it('a', () => {\n  expect(total).toStrictEqual([\n    // spec 4.2\n    12,\n  ]);\n});"
    ),
    valid(
      "// Spec: the plan prices in docs/reference/pricing.md.\nit('a', () => {\n  expect(price).toBe(29);\n});"
    ),
    valid(
      "// OWASP: the limit\n// continues here\nit('a', () => {\n  expect(limit).toBe(10);\n});"
    ),
    valid(
      "// W3C ARIA\ndescribe('meter', () => {\n  it('a', () => {\n    expect(now).toBe('3');\n  });\n});"
    ),
    // Not an assertion on expect(...).
    valid("it('a', () => { check(total).toBe(249); });"),
    valid("it('a', () => { expect(total).toBeDefined(); });"),
    valid("it('a', () => { expect(total).toBeCloseTo(expected, 2); });"),
  ],
});
