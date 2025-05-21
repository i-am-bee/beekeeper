import { expect } from "vitest";
import { timeFormats, TimeNode } from "./time.js";

export type PatternNode =
  | { type: "text"; value: string }
  | { type: "price"; amount: number; currency: string }
  | TimeNode
  | { type: "percent"; value: number }
  | { type: "not"; pattern: PatternNode }
  | { type: "alt"; options: PatternNode[] }
  | { type: "all"; patterns: PatternNode[] }
  | { type: "seq"; patterns: PatternNode[] }
  | { type: "wildcard" }
  | { type: "raw"; value: string };

const builder = (value: string | PatternBuilder) => {
  if (typeof value === "string") {
    return PatternBuilder.create().text(value);
  }
  return value;
};

export class PatternBuilder {
  private ast: PatternNode = { type: "seq", patterns: [] };

  static create() {
    return new PatternBuilder();
  }

  private add(node: PatternNode): this {
    (this.ast as any).patterns.push(node);
    return this;
  }

  text(value: string) {
    return this.add({ type: "text", value });
  }

  raw(value: string) {
    return this.add({ type: "raw", value });
  }

  price(amount: number, currency = "€") {
    return this.add({ type: "price", amount, currency });
  }

  time(hour: number, minute?: number, second?: number) {
    return this.add({ type: "time", hour, minute, second });
  }

  percent(value: number) {
    return this.add({ type: "percent", value });
  }

  not(pattern: string | PatternBuilder) {
    return this.add({
      type: "not",
      pattern: builder(pattern).ast,
    });
  }

  alt(...patterns: (string | PatternBuilder)[]) {
    return this.add({
      type: "alt",
      options: patterns.map((p) => builder(p).ast),
    });
  }

  all(...patterns: (string | PatternBuilder)[]) {
    return this.add({
      type: "all",
      patterns: patterns.map((p) => builder(p).ast),
    });
  }

  seq(...patterns: (string | PatternBuilder)[]) {
    return this.add({
      type: "seq",
      patterns: patterns.map((p) => builder(p).ast),
    });
  }

  sep() {
    return this.add({ type: "wildcard" });
  }

  explain(): string {
    return this.describe(this.ast);
  }

  getFailureReason(str: string): string | null {
    const lc = str.toLowerCase();
    const reason = this.checkFailure(this.ast, lc);
    return reason ?? null;
  }

  private checkFailure(node: PatternNode, str: string): string | undefined {
    switch (node.type) {
      case "text":
        return str.includes(node.value.toLowerCase())
          ? undefined
          : `Missing required text: "${node.value}"`;
      case "price": {
        const a = node.amount.toString();
        if (
          str.includes(`${node.currency}${a}`) ||
          str.includes(`${a}${node.currency}`)
        ) {
          return;
        }
        return `Missing price: ${node.currency}${node.amount}`;
      }
      case "percent":
        return str.includes(`${node.value}%`)
          ? undefined
          : `Missing percent: ${node.value}%`;
      case "raw":
        return new RegExp(node.value, "i").test(str)
          ? undefined
          : `Missing raw pattern: /${node.value}/`;
      case "wildcard":
        return undefined;
      case "not":
        return this.evaluate(node.pattern, str)
          ? `Disallowed pattern found`
          : undefined;
      case "alt": {
        const allReasons = node.options.map((opt) =>
          this.checkFailure(opt, str),
        );
        return allReasons.every(Boolean)
          ? `None of the alternatives matched`
          : undefined;
      }
      case "all": {
        for (const p of node.patterns) {
          const reason = this.checkFailure(p, str);
          if (reason) {
            return reason;
          }
        }
        return;
      }
      case "seq": {
        let cursor = 0;
        for (const part of node.patterns) {
          let found = false;
          for (let i = cursor; i <= str.length; i++) {
            const slice = str.slice(i);
            if (this.evaluate(part, slice)) {
              const matchLength = this.findMatchLength(part, slice);
              if (matchLength === -1) {
                continue;
              }
              cursor = i + matchLength;
              found = true;
              break;
            }
          }
          if (!found) {
            return `Sequence item not found: ${this.describe(part, 0)}`;
          }
        }
        return;
      }
    }
  }

  private describe(node: PatternNode, indent = 0): string {
    const pad = "  ".repeat(indent);
    switch (node.type) {
      case "text":
        return `${pad}- Must contain text: "${node.value}"`;
      case "price":
        return `${pad}- Must contain price: ${node.currency}${node.amount}`;
      case "time": {
        const parts = [`${node.hour}`];
        if (node.minute !== undefined) {
          parts.push(`${node.minute}`);
        }
        if (node.second !== undefined) {
          parts.push(`${node.second}`);
        }
        return `${pad}- Must match time: ${parts.join(":")}`;
      }
      case "percent":
        return `${pad}- Must contain percent: ${node.value}%`;
      case "wildcard":
        return `${pad}- Any content`;
      case "raw":
        return `${pad}- Raw pattern: ${node.value}`;
      case "not":
        return `${pad}- Must NOT contain:\n${this.describe(node.pattern, indent + 1)}`;
      case "alt":
        return `${pad}- Must match ONE of:\n${node.options.map((opt) => this.describe(opt, indent + 1)).join("\n")}`;
      case "all":
        return `${pad}- Must match ALL of:\n${node.patterns.map((p) => this.describe(p, indent + 1)).join("\n")}`;
      case "seq":
        return `${pad}- Must follow sequence:\n${node.patterns.map((p) => this.describe(p, indent + 1)).join("\n")}`;
    }
  }

  matches(str: string): boolean {
    return this.evaluate(this.ast, str.toLowerCase());
  }

  private evaluate(node: PatternNode, str: string): boolean {
    switch (node.type) {
      case "text":
        return str.includes(node.value.toLowerCase());

      case "price": {
        const a = node.amount.toString();
        return (
          str.includes(`${node.currency}${a}`) ||
          str.includes(`${a}${node.currency}`)
        );
      }

      case "percent":
        return str.includes(`${node.value}%`);

      case "time": {
        return timeFormats(node).some((fmt) => str.includes(fmt.toLowerCase()));
      }
      case "raw":
        return new RegExp(node.value, "i").test(str);

      case "wildcard":
        return true;

      case "not":
        return !this.evaluate(node.pattern, str);

      case "alt":
        return node.options.some((option) => this.evaluate(option, str));

      case "all":
        return node.patterns.every((pattern) => this.evaluate(pattern, str));

      case "seq": {
        let cursor = 0;
        const input = str.toLowerCase();

        for (const part of node.patterns) {
          let found = false;

          // Patterns that must match strictly at the current cursor (no scanning)
          const strictMatch = part.type === "not" || part.type === "wildcard";

          if (strictMatch) {
            const slice = input.slice(cursor);
            if (this.evaluate(part, slice)) {
              const len = this.findMatchLength(part, slice);
              if (len === -1) {
                return false;
              }
              cursor += Math.max(len, 1); // advance at least 1
              found = true;
            }
          } else {
            // Sliding window for normal patterns
            for (let i = cursor; i <= input.length; i++) {
              const slice = input.slice(i);
              if (this.evaluate(part, slice)) {
                const len = this.findMatchLength(part, slice);
                if (len === -1) {
                  continue;
                }
                cursor = i + len;
                found = true;
                break;
              }
            }
          }

          if (!found) {
            return false;
          }
        }

        return true;
      }
    }
  }

  private findMatchLength(node: PatternNode, str: string): number {
    const lower = str.toLowerCase();

    switch (node.type) {
      case "text": {
        const idx = lower.indexOf(node.value.toLowerCase());
        return idx === 0 ? node.value.length : -1;
      }

      case "price": {
        const a = node.amount.toString();
        const a1 = `${node.currency}${a}`;
        const a2 = `${a}${node.currency}`;
        if (lower.startsWith(a1.toLowerCase())) {
          return a1.length;
        }
        if (lower.startsWith(a2.toLowerCase())) {
          return a2.length;
        }
        return -1;
      }

      case "percent": {
        const p = `${node.value}%`;
        return lower.startsWith(p.toLowerCase()) ? p.length : -1;
      }

      case "raw": {
        const m = lower.match(new RegExp("^" + node.value, "i"));
        return m ? m[0].length : -1;
      }

      case "wildcard":
        return 1;

      case "not": {
        // Test if negated pattern matches at this position
        const doesMatch = this.evaluate(node.pattern, str);
        return doesMatch ? -1 : 0; // consume 0 characters if it passes (does NOT match)
      }

      case "alt": {
        for (const opt of node.options) {
          const len = this.findMatchLength(opt, str);
          if (len !== -1) {
            return len;
          }
        }
        return -1;
      }

      case "time": {
        const variants = timeFormats(node);
        for (const fmt of variants) {
          if (lower.startsWith(fmt.toLowerCase())) {
            return fmt.length;
          }
        }

        return -1;
      }

      case "all":
      case "seq":
        return 0; // these are containers — no standalone length
    }
  }
}

export const pb = () => PatternBuilder.create();

// ---------------- Vitest Matcher Integration ----------------

expect.extend({
  toMatchPattern(received: string, pattern: PatternBuilder) {
    const pass = pattern.matches(received);
    const reason = pass ? null : pattern.getFailureReason(received);

    return {
      pass,
      message: () =>
        !pass
          ? `❌ Pattern match failed:\n→ ${reason ?? "Unknown reason"}\n↳ Input: «${received}»`
          : `❌ Pattern matched but was expected NOT to match:\n↳ Input: «${received}»\n↳ Pattern: ${pattern.explain()}`,
    };
  },
});

declare module "vitest" {
  interface Assertion<T = any> {
    toMatchPattern(pattern: PatternBuilder): T;
  }
}
