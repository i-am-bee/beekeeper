import { describe, expect, it } from "vitest";
import { TaskStep } from "./dto.js";
import { TaskStepMapper } from "./task-step-mapper.js";

describe("TaskStepMapper", () => {
  describe("parse", () => {
    it("should parse task step with tools resource", () => {
      const taskStepString =
        "Find upcoming hockey/basketball game schedules in Boston (input: sport, location; output: game list) [tools: concert_schedule_api, sports_schedule_api]";

      const parsed = TaskStepMapper.parse(taskStepString);
      expect(parsed).toEqual({
        step: "Find upcoming hockey/basketball game schedules in Boston",
        inputOutput: "input: sport, location; output: game list",
        resource: {
          type: "tools",
          tools: ["concert_schedule_api", "sports_schedule_api"],
        },
      } satisfies TaskStep);
    });
    it("should parse task step with agent resource", () => {
      const taskStepString =
        "Find upcoming hockey/basketball game schedules in Boston (input: sport, location; output: game list) [agent: game_searcher]";
      const parsed = TaskStepMapper.parse(taskStepString);
      expect(parsed).toEqual({
        step: "Find upcoming hockey/basketball game schedules in Boston",
        inputOutput: "input: sport, location; output: game list",
        resource: {
          type: "agent",
          agentType: "game_searcher",
        },
      } satisfies TaskStep);
    });
    it("should parse task step with llm resource", () => {
      const taskStepString =
        "Create a balanced 3-day itinerary incorporating historical sites, games, and dining suggestions (input: outputs from Steps 1–3; output: detailed itinerary) [LLM]";
      const parsed = TaskStepMapper.parse(taskStepString);
      expect(parsed).toEqual({
        step: "Create a balanced 3-day itinerary incorporating historical sites, games, and dining suggestions",
        inputOutput:
          "input: outputs from Steps 1–3; output: detailed itinerary",
        resource: {
          type: "llm",
        },
      } satisfies TaskStep);
    });
  });

  describe("format", () => {
    it("should format task step with tools resource", () => {
      const taskStep: TaskStep = {
        step: "Find upcoming hockey/basketball game schedules in Boston",
        inputOutput: "input: sport, location; output: game list",
        resource: {
          type: "tools",
          tools: ["concert_schedule_api", "sports_schedule_api"],
        },
      };
      const formatted = TaskStepMapper.format(taskStep);
      expect(formatted).toBe(
        "Find upcoming hockey/basketball game schedules in Boston (input: sport, location; output: game list) [tools: concert_schedule_api, sports_schedule_api]",
      );
    });
    it("should format task step with agent resource", () => {
      const taskStep: TaskStep = {
        step: "Find upcoming hockey/basketball game schedules in Boston",
        inputOutput: "input: sport, location; output: game list",
        resource: {
          type: "agent",
          agentType: "game_searcher",
        },
      };
      const formatted = TaskStepMapper.format(taskStep);
      expect(formatted).toBe(
        "Find upcoming hockey/basketball game schedules in Boston (input: sport, location; output: game list) [agent: game_searcher]",
      );
    });
    it("should format task step with llm resource", () => {
      const taskStep: TaskStep = {
        step: "Create a balanced 3-day itinerary incorporating historical sites, games, and dining suggestions",
        inputOutput:
          "input: outputs from Steps 1–3; output: detailed itinerary",
        resource: {
          type: "llm",
        },
      };
      const formatted = TaskStepMapper.format(taskStep);
      expect(formatted).toBe(
        "Create a balanced 3-day itinerary incorporating historical sites, games, and dining suggestions (input: outputs from Steps 1–3; output: detailed itinerary) [LLM]",
      );
    });
  });
});
