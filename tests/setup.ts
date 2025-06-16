import { expect } from "vitest";
import { PatternBuilder } from "./helpers/pattern-builder.js";

// 2-a  symmetric matcher  →  expect(x).toMatchPattern(pb())
expect.extend({
  toMatchPattern(received: string, pattern: PatternBuilder) {
    const pass = pattern.matches(received);
    const reason = pass ? null : pattern.getFailureReason(received);

    return {
      pass,
      message: () =>
        pass
          ? `❌ Pattern matched but was expected NOT to match.\nInput: «${received}»`
          : `❌ Pattern match failed:\n→ ${reason ?? "Unknown reason"}\n↳ Input: «${received}»`,
    };
  },
});

const asymSym = Symbol.for("jest.asymmetricMatcher");

// 2-b  asymmetric helper  →  expect.matchPattern(pb())
function matchPattern(pattern: PatternBuilder) {
  return {
    $$typeof: asymSym,
    asymmetricMatch(received: unknown) {
      return typeof received === "string" && pattern.matches(received);
    },
    /* pretty-printing helpers */
    toAsymmetricMatcher() {
      return `\nPattern builder:\n\`\`\`\n${pattern.explain()}\n\`\`\``;
    },
    toString() {
      return "matchPattern";
    },
    getExpectedType() {
      return "string";
    },
    // optional: makes diff output nicer
    sample() {
      return pattern.explain();
    },
  };
}

// hang it off the global expect
(expect as unknown as { matchPattern: typeof matchPattern }).matchPattern =
  matchPattern;
