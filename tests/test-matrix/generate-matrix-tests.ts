// tests/helpers/generateMatrixTests.ts
import { LLMCall } from "@/agents/supervisor-workflow/base/llm-call.js";
import { ChatModel } from "beeai-framework";
import { describe, it, expect } from "vitest";
import { TestMatrix } from "./test-matrix.js";
import { Cell, Coord, TestCase } from "./types.js";

interface RunnerOptions<
  CaseT extends TestCase,
  InputT extends { task: string },
  ParsedT = any,
  OutputT = any,
> {
  matrix: TestMatrix<any, CaseT>;
  llm: ChatModel;
  llmCall: LLMCall<any, InputT, OutputT>; // any protocol, generic input/output
  /**
   * Transforms the stored `CaseT` into whatever `InputT`
   * your LLMCall implementation wants.
   */
  mapCaseToInput: (c: CaseT) => InputT;
  /**
   * Optional custom assertion (defaults to .toMatchObject()).
   */
  assertParsed?: (parsed: ParsedT, expected: CaseT["expected"]) => void;
  fullMatrixPopulationCheck?: false;
}

export function generateMatrixTests<
  CaseT extends TestCase,
  InputT extends { task: string },
  ParsedT = any,
  OutputT = any,
>({
  matrix,
  llm,
  llmCall,
  mapCaseToInput,
  assertParsed = (parsed, expected) =>
    // @ts-ignore – ParsedT is usually an object; this keeps it generic
    expect(parsed).toMatchObject(expected),
  // fullMatrixPopulationCheck,
}: RunnerOptions<CaseT, InputT, ParsedT, OutputT>) {
  matrix.walk((coord: Coord<any>, cell: Cell<any, CaseT[]>) => {
    const { value: cases } = cell;

    if (cases.length === 0) {
      return;
    } // allow sparse grids if you wish

    describe(coord.join(" · "), () => {
      cases.forEach((c) => {
        const testName =
          c.name ??
          (typeof c.input === "string"
            ? c.input
            : ((c.input as any).task ?? "case"));

        it(testName, async () => {
          const input = mapCaseToInput(c);
          const { result } = await llmCall.callLLM(
            { data: input, userMessage: input.task },
            { llm, agentId: "supervisor:boss[1]:1", onUpdate: () => ({}) },
          );

          if (result.type === "ERROR") {
            throw new Error(`LLM call failed: ${result.explanation}`);
          }

          // 1) structural / protocol-level matcher
          assertParsed(
            result.result.parsed as ParsedT,
            c.expected as CaseT["expected"],
          );

          // 2) optional fine-grained assertions (PatternBuilder, etc.)
          c.assert?.(result.result.parsed, result);
        });
      });
    });
  });
}
