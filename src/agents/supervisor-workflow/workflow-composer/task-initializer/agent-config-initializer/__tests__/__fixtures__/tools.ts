import { AgentAvailableTool } from "@/agents/supervisor-workflow/dto.js";
import { clone } from "remeda";

/** Raw list so it’s easy to append in PRs */
export const TOOL_ENTRIES = [
  {
    toolName: "arxiv_search",
    description:
      "Search arXiv preprints by keyword, subject area, and date; returns title, authors, abstract, and PDF link.",
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
    toolName: "flight_price_tracker",
    description:
      "Track airfare quotes for specific routes and dates; supports hourly polling.",
  },
  {
    toolName: "google_search",
    description:
      "A lightweight utility that fires off a query to Google Search and returns the top-ranked results (title, URL, snippet, and source site) in a compact JSON array. Ideal for quickly grabbing fresh, relevant links when your LLM needs up-to-date information without crawling the entire web.",
  },
  {
    toolName: "health_inspection_db",
    description:
      "Look up restaurant inspection scores and violations by name or address.",
  },
  {
    toolName: "historical_sites_search_api",
    description:
      "A purpose-built search endpoint that taps authoritative heritage databases (e.g., UNESCO, national registers, archaeological gazetteers) and returns structured JSON for each site: name, era, coordinates, jurisdiction, brief description, and citation links. Ideal when an LLM needs precise, geo-tagged information on historical or archaeological sites without piecing together data from scattered sources.",
  },
  {
    toolName: "movie_db_search",
    description:
      "Query upcoming and past film releases, including cast, synopsis, and release dates.",
  },
  {
    toolName: "news_search",
    description:
      "Query a curated index of newspapers, magazines, and wire-services for articles that match a keyword or topic. Supports source and date filters, returning structured results with headline, outlet, publication date, snippet, and article URL.",
  },
  {
    toolName: "phrase_generator",
    description:
      "Generate vocabulary lists and example sentences on chosen topics (e.g. inspiration, history etc.) and in chosen style for supported languages.",
  },
  {
    toolName: "podcast_search",
    description:
      "Search a catalogue of podcast episodes by keyword and date; returns title, show, release date, and audio URL.",
  },
  {
    toolName: "sec_filings_search",
    description:
      "Query the SEC EDGAR database for U.S. public-company filings. Accepts filters for ticker or CIK, form type (8-K, 10-K, 10-Q, S-1, 13D/G, 4, etc.), keyword, and filing-date range.",
  },
  {
    toolName: "weather_alert_feed",
    description:
      "Stream National Weather Service alerts with geolocation filters.",
  },
  {
    toolName: "google_maps",
    description:
      "Searches for geographic locations, businesses, and directions using Google Maps data.",
  },
] as const;

export type ToolName = (typeof TOOL_ENTRIES)[number]["toolName"];

const TOOLS_MAP = new Map<ToolName, AgentAvailableTool>(
  TOOL_ENTRIES.map((e) => [e.toolName, e]),
);

export function tool<Name extends ToolName>(name: Name) {
  return clone(TOOLS_MAP.get(name)!);
}
