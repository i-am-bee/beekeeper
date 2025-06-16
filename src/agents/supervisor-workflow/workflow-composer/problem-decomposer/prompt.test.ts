import { readFileSync } from "fs";
import { resolve } from "path";
import { describe, expect, it } from "vitest";
import boston_trip_fixtures from "@/agents/supervisor-workflow/fixtures/__test__/boston-trip/index.js";
import { prompt } from "./prompt.js";

describe(`Prompt`, () => {
  it(`should not change`, () => {
    const fixtures = boston_trip_fixtures;
    const p = prompt({
      request: fixtures.request,
      resources: {
        tools: fixtures.tools.values,
        agents: fixtures.agents.values,
        tasks: fixtures.tasks.values,
        taskRuns: [],
      },
    });

    expect(p).toEqual(readFileSync(resolve(__dirname, "prompt.txt"), "utf-8"));
  });
});
