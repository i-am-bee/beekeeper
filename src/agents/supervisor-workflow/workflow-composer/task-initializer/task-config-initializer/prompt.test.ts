import { describe, expect, it } from "vitest";
import { prompt } from "./prompt.js";
import { readFileSync } from "fs";
import { resolve } from "path";

describe(`Prompt`, () => {
  it(`Sample`, () => {
    const p = prompt({
      previousSteps: [],
      resources: {
        tools: [],
        agents: [],
        tasks: [],
        taskRuns: [],
      },
    });

    expect(p).toEqual(readFileSync(resolve(__dirname, "prompt.txt"), "utf-8"));
  });
});
