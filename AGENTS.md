# Repository Guidelines

validator-ec validates Ecuadorian cédulas, RUCs and postal codes, following the rules the SRI publishes. It is a small, zero-dependency TypeScript library, published to npm as an ES module for Node.js 22 or later. The README and the CHANGELOG are in Spanish, for its users; code identifiers and these guidelines are in English.

## Rules

Every rule cites where it comes from, in a comment beside the code: the SRI's ficha técnica, an SRI notice, or a named real case. When the SRI no longer guarantees a check (the modulo 11 digit of public and company RUCs, since 2021), the library checks the shape only and says why. It never invents a check digit, and never accepts a value only because a test needed it.

## Checks

`pnpm check` (format, lint and unused code), `pnpm check-types`, `pnpm test`, `pnpm build` and `pnpm check-package` (publint and attw) pass before every commit. CI runs all of them on every push. `pnpm fix` writes the formatting and the safe fixes. Never disable a lint rule to pass it.

## Tests

Tautological tests are harmful. For each test, name a production change that would make it fail; otherwise delete it. Assert observable behavior against independent expectations, never an echo of a fixture, mock response or the production arithmetic itself.

Prefer property-based tests, with [Hegel](https://hegel.dev/). The oracle in `tests/oracle.ts` is written from the SRI's rule, independently of `src`. Keep example-based tests for fixed contracts and known regressions. A fixed figure in an assertion cites where it comes from, in the test's title or a comment beside it; `pnpm check` refuses an uncited one (`honest-tests/literal-needs-source`), along with snapshots and mock call counts. Never cite a source the value doesn't come from to get past it.

## Comments

A comment sits on the code it explains: never a file header, never above or among the imports (`file-comments/no-head-comments`).

## Changes

Every change reaches `main` through a pull request, merged with a squash once CI passes; `main` is protected and nobody pushes to it directly. A commit message is a short plain subject that says what changed, with no body.

## Releases

Bump `version` in `package.json` and add its entry to `CHANGELOG.md`, then push a `vX.Y.Z` tag that matches. `.github/workflows/publish.yml` publishes it with npm's trusted publishing and a provenance statement; no token is stored anywhere. The workflow has three jobs with one permission each: the job that runs the toolchain can't publish, and the job that publishes runs none of the project's code. The publish job runs in the `release` environment, so it waits for the maintainer's approval on GitHub before anything reaches npm. Every action in a workflow is pinned to a full commit SHA, with its version in a comment; Dependabot moves them. A breaking change to what any function accepts is a major version.
