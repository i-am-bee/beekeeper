import { AgentAvailableTool } from "@/agents/supervisor-workflow/workflow-composer/task-initializer/agent-config-initializer/dto.js";
import { createFixtures } from "../../base/fixtures.js";

const ENTRIES = [
  {
    toolName: "map_api",
    description:
      "Lightweight geocoder. Resolves a place name to coordinates and lists points of interest (POIs) within a radius. Returns ONLY {name, category, lat, lon, distance_km}. 𝗗𝗼𝗲𝘀 𝗻𝗼𝘁 include size, accessibility, notable features, or website links.",
    toolInput:
      '{"origin":{"placeName":"<string, e.g. Denver>"}, "searchRadiusKm":<number, e.g. 15>, "categoryFilters":["<string, e.g. park>"], "returnDistanceMode":"straight_line", "maxResults":<number, e.g. 50>}',
  },
  {
    toolName: "web_search",
    description:
      "General web search. Ideal for locating OFFICIAL websites or authoritative pages about a known place or organisation. Returns top-N {title, url, snippet, publish_date}. Use together with web_page_extract for details.",
    toolInput:
      '{"query":"<string, e.g. <POI name> official website>", "resultsLimit":<number, e.g. 5>, "language":"<ISO-2 code, e.g. EN>", "freshnessDays":<number, e.g. 365>}',
  },
  {
    toolName: "web_page_extract",
    description:
      "Fetches a web page by URL and extracts structured data (metadata, headings, lists, tables). Ideal for pulling area/size, opening hours, accessibility info, entry fees, or downloadable resources from an official site.",
    toolInput:
      '{"url":"<string>", "extractFormat":"json", "selectors":{"metadata":["og:title","og:url"], "headings":true, "tables":true}}',
  },
] as const satisfies AgentAvailableTool[];

export default createFixtures(ENTRIES, ({ toolName }) => toolName);
