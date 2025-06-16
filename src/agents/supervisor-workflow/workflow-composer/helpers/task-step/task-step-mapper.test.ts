import { describe, expect, it } from "vitest";
import boston_trip_fixtures from "../../../fixtures/__test__/boston-trip/index.js";
import { TaskStep } from "./dto.js";
import { TaskStepMapper } from "./task-step-mapper.js";

describe("TaskStepMapper", () => {
  describe("parse", () => {
    it("should parse task step with tools resource", () => {
      const taskStepString =
        "Find upcoming hockey/basketball game schedules in Boston (input: sport [from Step 1], location; output: game list) [tools: concert_schedule_api, sports_schedule_api]";

      const parsed = TaskStepMapper.parse(taskStepString, 1, {
        tools: [
          {
            toolName: "concert_schedule_api",
            description: "Concert schedule API",
          },
          {
            toolName: "sports_schedule_api",
            description: "Sports schedule API",
          },
        ],
        agents: [],
        tasks: [],
        taskRuns: [],
      });
      expect(parsed).toEqual({
        no: 1,
        step: "Find upcoming hockey/basketball game schedules in Boston",
        inputOutput: "input: sport [from Step 1], location; output: game list",
        resource: {
          type: "tools",
          tools: ["concert_schedule_api", "sports_schedule_api"],
        },

        dependencies: [1],
      } satisfies TaskStep);
    });
    it("should parse task step with agent resource", () => {
      const taskStepString =
        "Find upcoming hockey/basketball game schedules in Boston (input: sport [from Step 1], location [from Step 2]; output: game list) [agent: game_scheduler]";
      const parsed = TaskStepMapper.parse(taskStepString, 1, {
        tools: [],
        agents: [boston_trip_fixtures.agents.get("game_scheduler")],
        tasks: [],
        taskRuns: [],
      });
      expect(parsed).toEqual({
        no: 1,
        step: "Find upcoming hockey/basketball game schedules in Boston",
        inputOutput:
          "input: sport [from Step 1], location [from Step 2]; output: game list",
        resource: {
          type: "agent",
          agent: boston_trip_fixtures.agents.get("game_scheduler"),
        },

        dependencies: [1, 2],
      } satisfies TaskStep);
    });
    it("should parse task step with llm resource", () => {
      const taskStepString =
        "Compile a comprehensive 5-day itinerary using the flights, hotels, conference details, and activities (input: flights [from Step 1], hotels [from Step 2], conference details [from Step 3], activities [from Step 4]; output: final itinerary) [LLM]";
      const parsed = TaskStepMapper.parse(taskStepString, 1, {
        tools: [],
        agents: [],
        tasks: [],
        taskRuns: [],
      });
      expect(parsed).toEqual({
        no: 1,
        step: "Compile a comprehensive 5-day itinerary using the flights, hotels, conference details, and activities",
        inputOutput:
          "input: flights [from Step 1], hotels [from Step 2], conference details [from Step 3], activities [from Step 4]; output: final itinerary",
        resource: {
          type: "llm",
        },
        dependencies: [1, 2, 3, 4],
      } satisfies TaskStep);
    });
    it("inner commas - should parse task step with llm resource correctly", () => {
      const taskStepString =
        "Categorize each park and nature reserve by type (e.g., national park, nature reserve) using the list from Step 1 (input: list of parks and nature reserves [from Step 1]; output: categorized list) [LLM]";
      const parsed = TaskStepMapper.parse(taskStepString, 1, {
        tools: [],
        agents: [],
        tasks: [],
        taskRuns: [],
      });
      expect(parsed).toEqual({
        no: 1,
        step: "Categorize each park and nature reserve by type (e.g., national park, nature reserve) using the list from Step 1",
        inputOutput:
          "input: list of parks and nature reserves [from Step 1]; output: categorized list",
        resource: {
          type: "llm",
        },

        dependencies: [1],
      } satisfies TaskStep);
    });
    it("steps range should not fail", () => {
      const taskStepString =
        "Create a screenplay scene that merges the four short stories (input: short stories [from Steps 1-4]; output: screenplay scene merging all stories) [LLM]";
      const parsed = TaskStepMapper.parse(taskStepString, 1, {
        tools: [],
        agents: [],
        tasks: [],
        taskRuns: [],
      });
      expect(parsed).toEqual({
        no: 1,
        step: "Create a screenplay scene that merges the four short stories",
        inputOutput:
          "input: short stories [from Steps 1-4]; output: screenplay scene merging all stories",
        resource: {
          type: "llm",
        },

        dependencies: [1, 2, 3, 4],
      } satisfies TaskStep);
    });
  });

  describe("format", () => {
    it("should format task step with tools resource", () => {
      const taskStep: TaskStep = {
        no: 1,
        step: "Find upcoming hockey/basketball game schedules in Boston",
        inputOutput: "input: sport, location; output: game list",
        resource: {
          type: "tools",
          tools: ["concert_schedule_api", "sports_schedule_api"],
        },
      };
      const formatted = TaskStepMapper.format(taskStep);
      expect(formatted).toBe(
        "Find upcoming hockey/basketball game schedules in Boston (input: sport, location; output: game list) [tools: concert_schedule_api,sports_schedule_api]",
      );
    });
    it("should format task step with agent resource", () => {
      const taskStep: TaskStep = {
        no: 1,
        step: "Find upcoming hockey/basketball game schedules in Boston",
        inputOutput: "input: sport, location; output: game list",
        resource: {
          type: "agent",
          agent: boston_trip_fixtures.agents.get("game_scheduler"),
        },

      };
      const formatted = TaskStepMapper.format(taskStep);
      expect(formatted).toBe(
        "Find upcoming hockey/basketball game schedules in Boston (input: sport, location; output: game list) [agent: game_scheduler]",
      );
    });
    it("should format task step with llm resource", () => {
      const taskStep: TaskStep = {
        no: 1,
        step: "Create a balanced 3-day itinerary incorporating historical sites, games, and dining suggestions",
        inputOutput:
          "input: historical sites [from Step 1], games [from Step 2], dining suggestions [from Step 3]; output: detailed itinerary",
        resource: {
          type: "llm",
        },
      };
      const formatted = TaskStepMapper.format(taskStep);
      expect(formatted).toBe(
        "Create a balanced 3-day itinerary incorporating historical sites, games, and dining suggestions (input: historical sites [from Step 1], games [from Step 2], dining suggestions [from Step 3]; output: detailed itinerary) [LLM]",
      );
    });
  });
});
