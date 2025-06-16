import { clone } from "remeda";
import { AgentConfigMinimal } from "../../dto.js";

export const AGENT_CONFIG_ENTRIES = [
  {
    agentType: "arxiv_rl_daily",
    description: "Daily RL arXiv digest.",
    instructions:
      "At 07:00 Prague time search arxiv_search for new submissions tagged " +
      "cs.LG or cs.AI whose abstract mentions “reinforcement learning” and send " +
      "a three-sentence summary for each paper.",
    tools: ["arxiv_search"],
    agentConfigId: "operator:arxiv_rl_daily:1",
    agentConfigVersion: 1,
  },
  {
    agentType: "city_events_weekend",
    description: "Weekend family events.",
    instructions:
      "Every Thursday query city_events_search for family-friendly events in " +
      "the user’s city scheduled for the coming weekend (Fri-Sun). Return name, " +
      "venue, start time and ticket price.",
    tools: ["city_events_search"],
    agentConfigId: "operator:city_events_search:2",
    agentConfigVersion: 2,
  },
  {
    agentType: "crypto_price_tracker_hourly",
    description: "Tracks BTC & ETH prices every hour.",
    instructions:
      "Fetch Bitcoin and Ethereum spot prices every hour with crypto_price_feed and alert on > 3 % moves.",
    tools: ["crypto_price_feed"],
    agentConfigId: "operator:crypto_price_tracker_hourly:3",
    agentConfigVersion: 3,
  },
  {
    agentType: "flight_tracker_daily",
    description: "Monitors PRG→NRT fares once per day.",
    instructions:
      "Query fare once per day and alert on drops below €750 using flight_price_tracker.",
    tools: ["flight_price_tracker"],
    agentConfigId: "operator:flight_tracker_daily:1",
    agentConfigVersion: 1,
  },
  {
    agentType: "flight_price_tracker_weekly",
    description: "Weekly flight-deal monitor.",
    instructions:
      "Once a week on Monday at 6 AM track round-trip fares on user-defined routes with " +
      "flight_price_tracker and alert when the price drops below the user’s " +
      "target threshold.",
    tools: ["flight_price_tracker"],
    agentConfigId: "operator:flight_price_tracker_weekly:1",
    agentConfigVersion: 1,
  },
  {
    agentType: "historical_sites_search",
    description: "Agent for searching historical sites in a city.",
    instructions:
      "Context: You are an agent specialized in finding historical sites in a given city. You have access to web search tools to gather information about popular historical landmarks, museums, and sites of interest. Users will provide the city and any specific interests they have. Objective: Provide a list of historical sites to visit, including brief descriptions and any relevant visiting information such as opening hours or ticket prices. Response format: Present the information in a list format with each site having a name, description, and visiting details.",
    tools: ["historical_sites_search_api"],
    agentConfigId: "operator:historical_sites_search:1",
    agentConfigVersion: 1,
  },
  {
    agentType: "news_headlines",
    description: "Gathers news headlines.",
    instructions: `You are an agent specializing in collecting news headlines. You have access to a news_search tool that allows you to find articles based on keywords and time filters. Users will provide a time frame and one or more search terms for the news they want collected.

Objective: Collect news headlines that contain the user-supplied keywords within the requested time window. Use the news_search tool to execute the query, filtering results to match the specified period. Provide a list of headline URLs together with concise summaries.

Response format: Begin with a brief sentence that restates the search terms and time frame. Then list each headline on its own line, showing the URL first and a short summary after an em-dash or colon. For example:

News headlines matching “<keywords>” from the [time_window]:  
1. URL: [headline_url_1] — Summary: [headline_summary_1]  
2. URL: [headline_url_2] — Summary: [headline_summary_2]`,
    tools: ["news_search"],
    agentConfigId: "operator:news_headlines:1",
    agentConfigVersion: 1,
  },
  {
    agentType: "phrase_generator",
    description: "Daily vocabulary exercise agent.",
    instructions:
      "Every weekday at 07:00 Prague time, generate a Spanish ‘word of the day’ " +
      "with part-of-speech, IPA pronunciation, an English translation and one " +
      "example sentence. Finish with a short multiple-choice quiz. Use the " +
      "phrase_generator tool only.",
    tools: ["phrase_generator"],
    agentConfigId: "operator:phrase_generator:1",
    agentConfigVersion: 1,
  },
  {
    agentType: "podcast_ai_weekly",
    description: "Weekly AI-podcast digest.",
    instructions:
      "Every Friday at 18:00 Prague time, query podcast_search for AI-related " +
      "episodes published in the last 7 days and send a three-sentence summary " +
      "for each.",
    tools: ["podcast_search"],
    agentConfigId: "operator:podcast_ai_weekly:1",
    agentConfigVersion: 1,
  },
  {
    agentType: "scifi_movies_weekly",
    description: "Upcoming sci-fi releases digest.",
    instructions:
      "Each Monday compile a list of new or upcoming science-fiction movies " +
      "releasing in the next 30 days using movie_db_search, including synopsis " +
      "and release date.",
    tools: ["movie_db_search"],
    agentConfigId: "operator:scifi_movies_weekly:1",
    agentConfigVersion: 1,
  },
  {
    agentType: "weather_tornado_immediate",
    description: "Instant tornado warnings.",
    instructions:
      "Continuously monitor weather_alert_feed for tornado watches or " +
      "warnings within 50 km of the user’s coordinates and notify immediately.",
    tools: ["weather_alert_feed"],
    agentConfigId: "operator:weather_tornado_immediate:1",
    agentConfigVersion: 1,
  },
  {
    agentType: "game_searcher",
    description: "Instant tornado warnings.",
    instructions:
      "Continuously monitor weather_alert_feed for tornado watches or " +
      "warnings within 50 km of the user’s coordinates and notify immediately.",
    tools: ["sports_schedule_api"],
    agentConfigId: "operator:weather_tornado_immediate:1",
    agentConfigVersion: 1,
  },
] as const satisfies AgentConfigMinimal[];

export type AgentConfigType =
  (typeof AGENT_CONFIG_ENTRIES)[number]["agentType"];

const CONFIGS_MAP = new Map<AgentConfigType, AgentConfigMinimal>(
  AGENT_CONFIG_ENTRIES.map((c) => [c.agentType, c]),
);

export function agentConfig<Name extends AgentConfigType>(name: Name) {
  return clone(CONFIGS_MAP.get(name)!);
}
