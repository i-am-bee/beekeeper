import { describe, expect, it } from "vitest";
import { prompt } from "./prompt.js";
import { resolve } from "path";
import { readFileSync } from "fs";
import boston_trip_fixtures from "@/agents/supervisor-workflow/fixtures/__test__/boston-trip/index.js";
import { unwrapTaskStepWithTaskRun } from "@/agents/supervisor-workflow/fixtures/helpers/unwrap-task-step.js";

describe(`Prompt`, () => {
  it(`Sample`, () => {
    const fixtures = boston_trip_fixtures;
    const stepNo = 1;
    const stepIndex = stepNo - 1; // Adjust for zero-based index
    const p = prompt({
      resources: {
        tools: [], //fixtures.tools.values,
        agents: [], //fixtures.agents.values.slice(0, stepIndex),
        tasks: [], //fixtures.tasks.values.slice(0, stepIndex),
        taskRuns: [],
      },
      previousSteps: fixtures.taskSteps.values
        .slice(0, stepIndex)
        .map(unwrapTaskStepWithTaskRun),
    });

    expect(p).toEqual(readFileSync(resolve(__dirname, "prompt.txt"), "utf-8"));
  });
});
