import { clone } from "remeda";
import { AgentAvailableTool } from "../../dto.js";

/** Raw list so it’s easy to append in PRs */
export const TOOL_ENTRIES = [
  {
    toolName: "arxiv_search",
    description:
      "Search arXiv preprints by keyword, subject area, and date; returns title, authors, abstract, and PDF link.",
  },
  {
    toolName: "bing",
    description:
      "Query the web via the Bing Search API to retrieve recent, high-quality results with snippets and source links.",
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
    toolName: "duckduckgo_search",
    description:
      "Use the DuckDuckGo Search API to find current web content with a focus on privacy and relevance; returns key results with titles, links, and short summaries.",
  },
  {
    toolName: "flight_price_tracker",
    description:
      "Track airfare quotes for specific routes and dates; supports hourly polling.",
  },
  {
    toolName: "google_maps",
    description:
      "Searches for geographic locations, businesses, and directions using Google Maps data.",
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
    toolName: "here_maps_search",
    description:
      "Search for places, addresses, and geographic features using HERE Maps API; returns precise location data with rich place attributes.",
  },
  {
    toolName: "historical_sites_search_api",
    description:
      "Purpose-built lookup for *place-based* heritage queries. Give it any neighborhood, city, or lat/long (e.g., “Back Bay”) and it returns structured JSON for each matching historic or archaeological site: official name, era, brief significance, coordinates, jurisdiction, and citation links from authoritative registers (UNESCO, U.S. National Register, state inventories, etc.). **Use this tool whenever the user wants to *find, list, or map* historic sites at a location—no generic web search needed.**",
  },
  {
    toolName: "mapbox_places",
    description:
      "Use Mapbox Places API to look up addresses and place names, returning geocoded location data and contextual metadata.",
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
    toolName: "openstreetmap_search",
    description:
      "Query the OpenStreetMap database to find geographic locations, landmarks, and detailed mapping information.",
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
    toolName: "tavily_search_api",
    description:
      "Perform fast and relevant web searches using the Tavily API, returning concise summaries of top-ranked results.",
  },
  {
    toolName: "tavily_page_extract",
    description:
      "A focused content-retrieval endpoint that fetches the full readable text (and, where available, metadata such as title, author, publish date, alt-text, and canonical URL) from one or more specific webpages you already know the addresses of; invoke it after a search—or whenever the user supplies or requests exact URLs—when you must quote, summarize, fact-check, extract tables/code/snippets, or reason over details that are not reliably captured in snippets alone, while skipping it if (a) the question can be answered from your own knowledge or search snippets, (b) the site is pay-walled, requires login, or hosts dynamic content that scraping would miss, or (c) the user forbids browsing; call it with a JSON object whose urls field is a list of absolute URLs (add optional max_chars, include_images, or selector keys if supported) and then parse the returned plain text or structured data, keeping network calls minimal by batching related URLs, respecting copyright, and citing any extracted material.",
  },
  {
    toolName: "weather_alert_feed",
    description:
      "Stream National Weather Service alerts with geolocation filters.",
  },
] as const;

export type ToolName = (typeof TOOL_ENTRIES)[number]["toolName"];

const TOOLS_MAP = new Map<ToolName, AgentAvailableTool>(
  TOOL_ENTRIES.map((e) => [e.toolName, e]),
);

export function tool<Name extends ToolName>(name: Name) {
  return clone(TOOLS_MAP.get(name)!);
}
