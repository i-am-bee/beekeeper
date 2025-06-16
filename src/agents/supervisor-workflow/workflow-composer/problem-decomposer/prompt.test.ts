import { describe, expect, it } from "vitest";
import { agentConfig } from "../task-initializer/agent-config-initializer/__tests__/__fixtures__/agent-configs.js";
import { tool } from "../task-initializer/agent-config-initializer/__tests__/__fixtures__/tools.js";
import { prompt } from "./prompt.js";
import { readFileSync } from "fs";
import { resolve } from "path";

describe(`Prompt`, () => {
  it(`Sample`, () => {
    const p = prompt({
      request: "",
      availableTools: [
        tool("arxiv_search"),
        tool("google_search"),
        tool("google_maps"),
      ],
      existingAgents: [agentConfig("weather_tornado_immediate")],
    });

    expect(p).toEqual(readFileSync(resolve(__dirname, "prompt.txt"), "utf-8"));
  });
});
