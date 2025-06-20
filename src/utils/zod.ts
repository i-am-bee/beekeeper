// utils/crossProductEnum.ts
import { z } from "zod";

/**
 * Type‑level cartesian product of two Zod enums in the form
 * `"${Left}_${Right}"`.
 *
 * @template L A {@link z.ZodEnum} whose literal values form the **left** half
 * @template R A {@link z.ZodEnum} whose literal values form the **right** half
 *
 * `L["_output"]` / `R["_output"]` expose the literal union of each enum’s
 * values at the type level; the template‑literal type then combines them.
 *
 * @example
 * ```ts
 * // Given NodeKindEnum = z.enum(["foo", "bar"])
 * //       PhaseEnum    = z.enum(["start", "end"])
 * type T = Cross<typeof NodeKindEnum, typeof PhaseEnum>;
 * // → "foo_start" | "foo_end" | "bar_start" | "bar_end"
 * ```
 */
export type Cross<
  L extends z.ZodEnum<[string, ...string[]]>,
  R extends z.ZodEnum<[string, ...string[]]>,
> = `${L["_output"]}_${R["_output"]}`;

/**
 * Runtime + compile‑time helper that returns a new Zod enum whose members are
 * every `${left}_${right}` combination of two input enums.
 *
 * The resulting enum keeps **exact** literal typing, so `z.infer` produces
 * the precise union and `.parse` rejects stray strings.
 *
 * @param left  Zod enum providing the left‑hand fragments
 * @param right Zod enum providing the right‑hand fragments
 *
 * @returns A `z.ZodEnum` instance of the cartesian product, fully typed.
 *
 * @example
 * ```ts
 * const NodePhaseEnum = crossProductEnum(NodeKindEnum, PhaseEnum);
 *
 * type NodePhase = z.infer<typeof NodePhaseEnum>;
 * // "foo_start" | "foo_end" | "bar_start" | "bar_end"
 *
 * NodePhaseEnum.parse("foo_start"); // ✅ OK
 * NodePhaseEnum.parse("foo");       // ❌ ZodError
 * ```
 */
export function crossProductEnum<
  L extends z.ZodEnum<[string, ...string[]]>,
  R extends z.ZodEnum<[string, ...string[]]>,
>(left: L, right: R) {
  /* ──────────────────────────────────────────────────────────────────
   *  Build the runtime list: ["foo_start", "foo_end", ...]           */
  const values = left.options.flatMap((l) =>
    right.options.map((r) => `${l}_${r}`),
  );

  /* ──────────────────────────────────────────────────────────────────
   *  Zod’s `enum()` requires a **non‑empty tuple** of string literals
   *  at compile time, so assert that `values` has that shape.        */
  return z.enum(values as [Cross<L, R>, ...Cross<L, R>[]]);
}
