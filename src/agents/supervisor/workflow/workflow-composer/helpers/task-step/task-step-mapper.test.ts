import { describe, expect, it } from "vitest";
import boston_trip_fixtures from "../../../fixtures/__test__/boston-trip/index.js";
import { TaskStep } from "./dto.js";
import {
  TaskStepMapper,
  TaskStepResourceAssignError,
} from "./task-step-mapper.js";

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
            toolInput: "some concert tool input",
          },
          {
            toolName: "sports_schedule_api",
            description: "Sports schedule API",
            toolInput: "some sports tool input",
          },
        ],
        agents: [],
        tasks: [],
        taskRuns: [],
      });
      expect(parsed).toEqual({
        no: 1,
        step: "Find upcoming hockey/basketball game schedules in Boston",
        resource: {
          type: "tools",
          tools: ["concert_schedule_api", "sports_schedule_api"],
        },
        dependencies: [1],
        inputs: [
          {
            dependencies: [1],
            value: "sport",
          },
          {
            value: "location",
          },
        ],
        output: "game list",
      } satisfies TaskStep);
    });
    it("should parse task step with agent resource", () => {
      const taskStepString =
        "Find upcoming hockey/basketball game schedules in Boston (input: sport [from Step 1], location [from Step 2]; output: game list) [agent: sports_events_searcher]";
      const parsed = TaskStepMapper.parse(taskStepString, 1, {
        tools: [],
        agents: [boston_trip_fixtures.agents.get("sports_events_searcher")],
        tasks: [],
        taskRuns: [],
      });
      expect(parsed).toEqual({
        no: 1,
        step: "Find upcoming hockey/basketball game schedules in Boston",
        resource: {
          type: "agent",
          agent: boston_trip_fixtures.agents.get("sports_events_searcher"),
        },
        dependencies: [1, 2],
        inputs: [
          {
            dependencies: [1],
            value: "sport",
          },
          {
            dependencies: [2],
            value: "location",
          },
        ],
        output: "game list",
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
        resource: {
          type: "llm",
        },

        dependencies: [1, 2, 3, 4],
        inputs: [
          {
            dependencies: [1],
            value: "flights",
          },
          {
            dependencies: [2],
            value: "hotels",
          },
          {
            dependencies: [3],
            value: "conference details",
          },
          {
            dependencies: [4],
            value: "activities",
          },
        ],
        output: "final itinerary",
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
        resource: {
          type: "llm",
        },
        dependencies: [1],
        inputs: [
          {
            dependencies: [1],
            value: "list of parks and nature reserves",
          },
        ],
        output: "categorized list",
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
        resource: {
          type: "llm",
        },
        dependencies: [1, 2, 3, 4],
        inputs: [
          {
            dependencies: [1, 2, 3, 4],
            value: "short stories",
          },
        ],
        output: "screenplay scene merging all stories",
      } satisfies TaskStep);
    });

    it("should parse input with [source: assumed] correctly", () => {
      const taskStepString =
        "Generate quarterly summary report (input: sales data [source: assumed], format: PDF; output: quarterly report) [LLM]";

      const result = TaskStepMapper.parse(taskStepString, 1, {
        tools: [],
        agents: [],
        tasks: [],
        taskRuns: [],
      });

      expect(result).toEqual({
        no: 1,
        step: "Generate quarterly summary report",
        resource: {
          type: "llm",
        },
        dependencies: [],
        inputs: [
          {
            value: "sales data",
            assumed: true,
          },
          {
            value: "format: PDF",
          },
        ],
        output: "quarterly report",
      } satisfies TaskStep);
    });

    it("should return TaskStepResourceAssignError if input contains both [source: assumed] and [from Step ...]", () => {
      const taskStepString =
        "Generate quarterly summary report (input: sales data [from Step 2, source: assumed]; output: quarterly report) [LLM]";

      const result = TaskStepMapper.parse(taskStepString, 1, {
        tools: [],
        agents: [],
        tasks: [],
        taskRuns: [],
      });

      expect(result).toBeInstanceOf(TaskStepResourceAssignError);

      if (result instanceof TaskStepResourceAssignError) {
        expect(result.resourceType).toBe("task");
        expect(result.missingResources).toBe(
          "sales data [from Step 2, source: assumed]",
        );
        expect(result.message).toContain(
          "Input cannot contain both [source: assumed] and [from Step ...] references.",
        );
      }
    });

    it("throws error when [from Step X] and [source: assumed] are in separate brackets", () => {
      const input = "sales data [from Step 2] [source: assumed]";
      const result = TaskStepMapper.parseInput(input);
      expect(result).toBeInstanceOf(TaskStepResourceAssignError);
    });

    it("throws error when [source: assumed] and [from Step X] are reversed", () => {
      const input = "sales data [source: assumed] [from Step 2]";
      const result = TaskStepMapper.parseInput(input);
      expect(result).toBeInstanceOf(TaskStepResourceAssignError);
    });
  });

  describe("format", () => {
    it("should format task step with tools resource", () => {
      const taskStep: TaskStep = {
        no: 1,
        step: "Find upcoming hockey/basketball game schedules in Boston",
        resource: {
          type: "tools",
          tools: ["concert_schedule_api", "sports_schedule_api"],
        },
        inputs: [
          {
            value: "sport",
          },
          {
            value: "location",
          },
        ],
        output: "game list",
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
        inputs: [
          {
            value: "sport",
          },
          {
            value: "location",
          },
        ],
        output: "game list",
        resource: {
          type: "agent",
          agent: boston_trip_fixtures.agents.get("sports_events_searcher"),
        },
      };
      const formatted = TaskStepMapper.format(taskStep);
      expect(formatted).toBe(
        "Find upcoming hockey/basketball game schedules in Boston (input: sport, location; output: game list) [agent: sports_events_searcher]",
      );
    });
    it("should format task step with llm resource", () => {
      const taskStep: TaskStep = {
        no: 1,
        step: "Create a balanced 3-day itinerary incorporating historical sites, games, and dining suggestions",
        resource: {
          type: "llm",
        },
        dependencies: [1, 2, 3],
        inputs: [
          {
            dependencies: [1],
            value: "historical sites",
          },
          {
            dependencies: [2],
            value: "games",
          },
          {
            dependencies: [3],
            value: "dining suggestions",
          },
        ],
        output: "detailed itinerary",
      };
      const formatted = TaskStepMapper.format(taskStep);
      expect(formatted).toBe(
        "Create a balanced 3-day itinerary incorporating historical sites, games, and dining suggestions (input: historical sites [from Step 1], games [from Step 2], dining suggestions [from Step 3]; output: detailed itinerary) [LLM]",
      );
    });

    it("should format task step with inputs and output", () => {
      const taskStep = {
        no: 1,
        step: "Create a screenplay scene that merges the four short stories",
        resource: {
          type: "llm",
        },
        dependencies: [1, 2, 3, 4],
        inputs: [
          {
            dependencies: [1, 2, 3, 4],
            value: "short stories",
          },
          {
            value: "duration 2 minutes",
          },
          {
            dependencies: [5],
            value: "format",
          },
        ],
        output: "screenplay scene merging all stories",
      } satisfies TaskStep;

      const formatted = TaskStepMapper.format(taskStep);
      expect(formatted).toBe(
        "Create a screenplay scene that merges the four short stories (input: short stories [from Steps 1-4], duration 2 minutes, format [from Step 5]; output: screenplay scene merging all stories) [LLM]",
      );
    });
  });
});
