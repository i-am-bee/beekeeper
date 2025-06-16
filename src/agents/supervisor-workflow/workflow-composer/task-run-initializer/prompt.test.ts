import { describe, expect, it } from "vitest";
import { prompt } from "./prompt.js";
import { readFileSync } from "fs";
import { resolve } from "path";

describe(`Prompt`, () => {
  it(`Sample`, () => {
    const p = prompt({
      previousSteps: [
        // {
        //   step: "Identify historical sites in Back Bay",
        //   inputOutput: "input: location; output: list of sites",
        //   resource: { type: "agent", agentType: "historical_sites_identifier" },
        // },
        // {
        //   step: "Find upcoming hockey/basketball game schedules in Boston",
        //   inputOutput: "input: sport, location; output: game list",
        //   resource: { type: "agent", agentType: "game_searcher" },
        // },
      ],
      resources: {
        tools: [],
        agents: [],
        tasks: [],
        taskRuns: [],
      },
      //       existingTaskConfigs: [
      //         {
      //           taskType: "family_events",
      //           taskConfigInput:
      //             '{"budget_max_eur":"<maximum budget in euros>","family_friendly":true,"outdoor_only":true,"fallback_if_rain":"<fallback option: indoor | none>"}',
      //           description:
      //             "Find family‑friendly outdoor events under a user-defined budget for the coming weekend and suggest an indoor alternative if rain is forecast.",
      //           agentType: "city_events_weekend",
      //         },
      //       ],
      //       existingAgentConfigs: [
      //         {
      //           agentType: "historical_sites_identifier",
      //           tools: ["historical_sites_search_api"],
      //           instructions: `Context: You are an agent specializing in identifying historical sites. You are activated by an external task and receive a location as input. You use the historical_sites_search_api tool to retrieve a list of historical sites.

      // Objective: Use the provided location to fetch a list of historical sites. Return the results in a structured format.

      // Response format: List each site with its name and a brief description.`,
      //           description:
      //             "Identifies historical sites in a given location using the historical_sites_search_api tool.",
      //           agentConfigVersion: 1,
      //           agentConfigId: "operator:historical_sites_identifier:1",
      //         },
      //         {
      //           agentType: "game_searcher",
      //           tools: ["sports_schedule_api"],
      //           instructions: `Context: You are an agent specializing in finding sports game schedules. You are activated by an external task and receive sport type and location as input. You use the sports_schedule_api tool to retrieve game schedules.

      // Objective: Use the provided sport type and location to fetch upcoming game schedules. Return the results in a structured format.

      // Response format: List each game with its date, time, and teams.`,
      //           description:
      //             "Finds upcoming sports game schedules in a given location using the sports_schedule_api tool.",
      //           agentConfigVersion: 1,
      //           agentConfigId: "operator:game_searcher:1",
      //         },
      //         {
      //           agentType: "restaurant_recommender",
      //           tools: ["google_search", "web_extract"],
      //           instructions: `Context: You are an agent specializing in recommending restaurants. You are activated by an external task and receive dining preferences and location as input. You use web search tools to gather information about restaurants.

      // Objective: Provide a list of restaurants based on user-defined preferences and location. Include details such as name, description, and contact information.

      // Response format: Present the information in a structured list with each restaurant having a name, description, and contact details.`,
      //           description:
      //             "Recommends restaurants based on user-defined preferences and location using web search tools.",
      //           agentConfigVersion: 1,
      //           agentConfigId: "operator:game_searcher:1",
      //         },
      //         {
      //           agentType: "itinerary_creator",
      //           tools: ["itinerary_planner_api"],
      //           instructions: `Context: You are an agent specializing in creating itineraries. You are activated by an external task and receive inputs such as historical sites, games, and dining suggestions. You use the itinerary_planner_api to generate a detailed itinerary.

      // Objective: Create a balanced 3-day itinerary based on the provided inputs. Include day-by-day activities and details.

      // Response format: Present the itinerary day by day with activities and details.`,
      //           description:
      //             "Creates a balanced 3-day itinerary based on provided inputs such as historical sites, games, and dining suggestions using the itinerary_planner_api tool.",
      //           agentConfigVersion: 1,
      //           agentConfigId: "operator:itinerary_creator:1",
      //         },
      //       ],
    });

    expect(p).toEqual(readFileSync(resolve(__dirname, "prompt.txt"), "utf-8"));
  });
});
