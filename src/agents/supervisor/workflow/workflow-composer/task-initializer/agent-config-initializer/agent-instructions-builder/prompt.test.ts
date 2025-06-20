import boston_trip_fixtures from "@/agents/supervisor/workflow/fixtures/__test__/boston-trip/index.js";
import {
  unwrapTaskStepWithAgent,
  unwrapTaskStepWithToolsOrLLM,
} from "@/agents/supervisor/workflow/fixtures/helpers/unwrap-task-step.js";
import { readFileSync } from "fs";
import { resolve } from "path";
import { describe, expect, it } from "vitest";
import { prompt } from "./prompt.js";

describe(`Prompt`, () => {
  it(`Sample`, () => {
    const fixtures = boston_trip_fixtures;
    const stepNo = 1;
    const stepIndex = stepNo - 1; // Adjust for zero-based index
    const p = prompt({
      resources: {
        tools: fixtures.tools.values,
        agents: fixtures.agents.values.slice(0, stepIndex),
        tasks: fixtures.tasks.values.slice(0, stepIndex),
        taskRuns: fixtures.taskRuns.values.slice(0, stepIndex),
      },
      previousSteps: fixtures.taskSteps.values
        .slice(0, stepIndex)
        .map(unwrapTaskStepWithAgent),
      taskStep: unwrapTaskStepWithToolsOrLLM(fixtures.taskSteps.at(stepIndex)),
      agentConfigDraft: unwrapTaskStepWithAgent(
        fixtures.taskSteps.at(stepIndex),
      ).resource.agent,
    });

    expect(p).toEqual(readFileSync(resolve(__dirname, "prompt.txt"), "utf-8"));
  });
});
