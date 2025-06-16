import { clone } from "remeda";
import { AgentAvailableTool } from "../../workflow-composer/task-initializer/agent-config-initializer/dto.js";

export const TOOL_ENTRIES = [
  {
    toolName: "arxiv_search",
    description:
      "Search arXiv preprints by keyword, subject area, and date; returns title, authors, abstract, and PDF link.",
  },
  {
    toolName: "astronomy_search_api",
    description:
      "Search for celestial objects by location, time, and other filters. Returns object names, descriptions, and visibility details.",
  },
  {
    toolName: "audiobook_catalog_api",
    description: "Search for audiobooks by genre and location.",
  },
  {
    toolName: "book_catalog_api",
    description: "Search for books by genre and location.",
  },
  {
    toolName: "city_events_search",
    description:
      "Query municipal event listings with filters for date, venue, and category; returns structured JSON.",
  },
  {
    toolName: "crypto_price_feed",
    description:
      "Stream current and historical cryptocurrency prices for major exchanges.",
  },
  {
    toolName: "exercise_database",
    description:
      "Provides a database of exercises categorized by muscle group, difficulty level, and equipment required.",
  },
  {
    toolName: "f1_data_api",
    description: "Search for Formula 1 race data by season, team, and driver.",
  },
  {
    toolName: "flight_price_tracker",
    description:
      "Track airfare quotes for specific routes and dates; supports hourly polling.",
  },
  {
    toolName: "fishing_schedule_api",
    description: "Search for fishing schedules by fishing type and location.",
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
  {
    toolName: "hotel_search_api",
    description:
      "Search for hotels by location, price range, and amenities. Returns hotel names, descriptions, and booking links.",
  },
  {
    toolName: "itinerary_planner_api",
    description:
      "Plan travel itineraries by location, duration, and interests. Returns structured itineraries with activities, timings, and locations.",
  },
  {
    toolName: "movie_search_api",
    description:
      "Search for movies by genre, release date, and other criteria. Returns movie titles, descriptions, and ratings.",
  },
  {
    toolName: "movie_info_api",
    description:
      "Retrieve detailed information about a specific movie, including cast, crew, plot summary, and reviews.",
  },
  {
    toolName: "news_search",
    description:
      "Query a curated index of newspapers, magazines, and wire-services for articles that match a keyword or topic. Supports source and date filters, returning structured results with headline, outlet, publication date, snippet, and article URL.",
  },
  {
    toolName: "nutrition_analysis_api",
    description:
      "Analyze recipes for nutritional content, providing details like calories, macronutrients, and allergens.",
  },
  {
    toolName: "phrase_generator",
    description:
      "Generate vocabulary lists and example sentences on chosen topics (e.g. inspiration, history etc.) and in chosen style for supported languages.",
  },
  {
    toolName: "recipe_catalog_api",
    description:
      "Search for recipes by cuisine, dietary preferences, and other criteria. Returns recipe names, ingredients, and instructions.",
  },
  {
    toolName: "sports_schedule_api",
    description:
      "Search for sports schedules by team, league, and date range; returns game times, locations, and matchups.",
  },
  {
    toolName: "sound_generator",
    description: "Create sound from natural-language prompts.",
  },
  {
    toolName: "weather_alert_feed",
    description:
      "Provides structured severe weather alerts (e.g., watches, warnings) by location and event type. Returns geographic area, issue time, expiration, and full alert text.",
  },
  {
    toolName: "web_extract",
    description:
      "Extracts structured data from web pages using CSS selectors or XPath queries; returns results in JSON format.",
  },
] as const;

export type ToolName = (typeof TOOL_ENTRIES)[number]["toolName"];

const TOOLS_MAP = new Map<ToolName, AgentAvailableTool>(
  TOOL_ENTRIES.map((e) => [e.toolName, e]),
);

export function toolPrompt<Name extends ToolName>(name: Name) {
  return clone(TOOLS_MAP.get(name)!);
}
