import { getChatLLM } from "@/helpers/llm.js";
import { Logger } from "beeai-framework";
import { describe, expect, it } from "vitest";
import { RequestHandler } from "./request-handler.js";

const logger = Logger.root.child({ name: "agent-config-tests" });
const llm = getChatLLM("supervisor");
const agentId = "supervisor:boss[1]:1";
const onUpdate = () => ({});

describe(`Request Handler`, () => {
  it(`Plan a trip to Boston`, async () => {
    const requestHandler = new RequestHandler(logger, "supervisor:boss[1]:1");

    const request =
      "I'm heading to Boston next week and need help planning a simple 3-day itinerary. I’ll be staying in Back Bay and want to see historical sites, catch a hockey or basketball game, and enjoy great food. Can you recommend one dinner spot each night - Italian, Chinese, and French?";
    const runOutput = await requestHandler.run(
      {
        data: { request },
        userMessage: request,
      },
      { llm, agentId, onUpdate },
    );

    if (runOutput.type === "ERROR") {
      throw new Error(`Request handler failed: ${runOutput.explanation}`);
    }

    expect(runOutput.result).toBe({
      explanation:
        "Multi-component itinerary with sufficient details for planning",
      response: `{
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
}`,
      type: "COMPOSE_WORKFLOW",
    });
  });
  it(`Monitor weather_alert_feed for tornado watches/warnings`, async () => {
    const requestHandler = new RequestHandler(logger, "supervisor:boss[1]:1");

    const request =
      "Monitor weather_alert_feed for tornado watches or warnings within 50 km of the user’s coordinates and notify immediately.";
    const runOutput = await requestHandler.run(
      {
        data: { request },
        userMessage: request,
      },
      { llm, agentId, onUpdate },
    );

    if (runOutput.type === "ERROR") {
      throw new Error(`Request handler failed: ${runOutput.explanation}`);
    }

    expect(runOutput.result).toBe({
      explanation:
        "Requires ongoing monitoring and real-time alert generation, best handled by a dedicated workflow",
      response: `{
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
}`,
      type: "COMPOSE_WORKFLOW",
    });
  });
});
