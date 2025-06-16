import { getChatLLM } from "@/helpers/llm.js";
import { Logger } from "beeai-framework";
import { describe, expect, it } from "vitest";
import { ProblemDecomposer } from "./problem-decomposer.js";

const logger = Logger.root.child({ name: "agent-config-tests" });
const llm = getChatLLM("supervisor");
const agentId = "supervisor:boss[1]:1";
const onUpdate = () => ({});

describe(`Problem Decomposer`, () => {
  it(`Plan a trip to Boston`, async () => {
    const problemDecomposer = new ProblemDecomposer(
      logger,
      "supervisor:boss[1]:1",
    );

    const request = `{
  "requestType": "travel_itinerary",
  "primaryGoal": "Create a 3-day itinerary for Boston visit in Back Bay",
  "userParameters": {
    "stayLocation": "Back Bay",
    "duration": "3 days",
    "interests": ["historical sites", "hockey/basketball game", "food"],
    "diningPreferences": {
      "day1": "Italian",
      "day2": "Chinese",
      "day3": "French"
    }
  },
  "requiredComponents": [
    "identify historical sites in Back Bay",
    "find upcoming hockey/basketball game schedules",
    "recommend Italian, Chinese, and French restaurants in Back Bay",
    "create a balanced daily schedule incorporating all preferences"
  ],
  "expectedDeliverables": "Detailed 3-day itinerary with historical site visits, game recommendations, and dining suggestions"
}`;
    const resp = await problemDecomposer.run(
      {
        data: {
          availableTools: [
            {
              toolName: "weather_alert_feed",
              description:
                "Provides structured severe weather alerts (e.g., watches, warnings) by location and event type. Returns geographic area, issue time, expiration, and full alert text.",
            },
            {
              toolName: "google_search",
              description:
                "A lightweight utility that fires off a query to Google Search and returns the top-ranked results (title, URL, snippet, and source site) in a compact JSON array. Ideal for quickly grabbing fresh, relevant links when your LLM needs up-to-date information without crawling the entire web.",
            },
            {
              toolName: "historical_sites_search_api",
              description:
                "Purpose-built lookup for *place-based* heritage queries. Give it any neighborhood, city, or lat/long (e.g., “Back Bay”) and it returns structured JSON for each matching historic or archaeological site: official name, era, brief significance, coordinates, jurisdiction, and citation links from authoritative registers (UNESCO, U.S. National Register, state inventories, etc.). **Use this tool whenever the user wants to *find, list, or map* historic sites at a location—no generic web search needed.**",
            },
          ],
          existingAgents: [],
          request,
        },
        userMessage: request,
      },
      { llm, agentId, onUpdate },
    );

    expect(resp).toBe({
      output: {
        result: [
          "Identify historical sites in Back Bay (input: location; output: list of sites) [tool: historical_sites_search_api]",
          "Find upcoming hockey/basketball game schedules in Boston (input: sport, location; output: game list) [tool: google_search]",
          "Recommend Italian, Chinese, and French restaurants in Back Bay for each day (input: dining preferences, location; output: restaurant list) [tool: google_search]",
          "Create a balanced 3-day itinerary incorporating historical sites, games, and dining suggestions (input: outputs from Steps 1–3; output: detailed itinerary) [LLM]",
        ],
        type: "SUCCESS",
      },
      parsed: {
        RESPONSE_CHOICE_EXPLANATION:
          "All requested components can be addressed using available tools and agents.",
        RESPONSE_STEP_SEQUENCE: {
          step_sequence: [
            "Identify historical sites in Back Bay (input: location; output: list of sites) [tool: historical_sites_search_api]",
            "Find upcoming hockey/basketball game schedules in Boston (input: sport, location; output: game list) [tool: google_search]",
            "Recommend Italian, Chinese, and French restaurants in Back Bay for each day (input: dining preferences, location; output: restaurant list) [tool: google_search]",
            "Create a balanced 3-day itinerary incorporating historical sites, games, and dining suggestions (input: outputs from Steps 1–3; output: detailed itinerary) [LLM]",
          ],
        },
        RESPONSE_TYPE: "STEP_SEQUENCE",
      },
      raw: `\`\`\`
RESPONSE_CHOICE_EXPLANATION: All requested components can be addressed using available tools and agents.
RESPONSE_TYPE: STEP_SEQUENCE
RESPONSE_STEP_SEQUENCE:
  step_sequence:
    1. Identify historical sites in Back Bay (input: location; output: list of sites) [tool: historical_sites_search_api]
    2. Find upcoming hockey/basketball game schedules in Boston (input: sport, location; output: game list) [tool: google_search]
    3. Recommend Italian, Chinese, and French restaurants in Back Bay for each day (input: dining preferences, location; output: restaurant list) [tool: google_search]
    4. Create a balanced 3-day itinerary incorporating historical sites, games, and dining suggestions (input: outputs from Steps 1–3; output: detailed itinerary) [LLM]
\`\`\``,
    });
  });
  it(`Continuously monitor for tornado watches/warnings`, async () => {
    const requestHandler = new ProblemDecomposer(
      logger,
      "supervisor:boss[1]:1",
    );

    const request = `{
  "requestType": "weather_monitoring",
  "primaryGoal": "Continuously monitor for tornado watches/warnings within 50 km of user's location",
  "userParameters": {
    "alertType": "tornado",
    "radius": 50
  },
  "requiredComponents": [
    "fetch user's current coordinates",
    "set up real-time weather data feed",
    "filter for tornado watches/warnings",
    "trigger immediate notification upon detection"
  ],
  "expectedDeliverables": "Immediate alerts to the user whenever a tornado watch or warning is issued within 50 km of their location"
}`;
    const resp = await requestHandler.run(
      {
        data: {
          availableTools: [
            {
              toolName: "weather_alert_feed",
              description:
                "Provides structured severe weather alerts (e.g., watches, warnings) by location and event type. Returns geographic area, issue time, expiration, and full alert text.",
            },
          ],
          existingAgents: [],
          request,
        },
        userMessage: request,
      },
      { llm, agentId, onUpdate },
    );

    if (resp.type === "ERROR") {
      throw new Error(`Problem decomposer failed: ${resp.explanation}`);
    }

    expect(resp.result).toBe({});
  });
});
