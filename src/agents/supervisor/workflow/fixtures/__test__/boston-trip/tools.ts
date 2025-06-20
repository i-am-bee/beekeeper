import { AgentAvailableTool } from "@/agents/supervisor/workflow/workflow-composer/task-initializer/agent-config-initializer/dto.js";
import { createFixtures } from "../../base/fixtures.js";

const ENTRIES = [
  {
    toolName: "tavily_search_api",
    description:
      "Perform fast and relevant web searches, returning concise summaries of top-ranked results.",
    toolInput:
      '{"query":"<string e.g. best-preserved Roman aqueducts in Spain>","numResults":<integer e.g. 5>}',
  },
  {
    toolName: "tavily_page_extract",
    description:
      "A focused content-retrieval endpoint that fetches the full readable text (and, where available, metadata such as title, author, publish date, alt-text, and canonical URL) from one or more specific webpages you already know the addresses of; invoke it after a search—or whenever the user supplies or requests exact URLs—when you must quote, summarize, fact-check, extract tables/code/snippets, or reason over details that are not reliably captured in snippets alone, while skipping it if (a) the question can be answered from your own knowledge or search snippets, (b) the site is pay-walled, requires login, or hosts dynamic content that scraping would miss, or (c) the user forbids browsing; call it with a JSON object whose urls field is a list of absolute URLs (add optional max_chars, include_images, or selector keys if supported) and then parse the returned plain text or structured data, keeping network calls minimal by batching related URLs, respecting copyright, and citing any extracted material.",
    toolInput:
      '{"urls":["<string e.g. https://example.com/article>"],"max_chars":<integer optional>,"include_images":<boolean optional>,"selector":"<string optional CSS selector>"}',
  },
  {
    toolName: "historical_sites_search_api",
    description:
      "Purpose-built lookup for *place-based* heritage queries. Give it any neighborhood, city, or lat/long (e.g., “Back Bay”) and it returns structured JSON for each matching historic or archaeological site: official name, era, brief significance, coordinates, jurisdiction, and citation links from authoritative registers (UNESCO, U.S. National Register, state inventories, etc.). **Use this tool whenever the user wants to *find, list, or map* historic sites at a location—no generic web search needed.**",
    toolInput: '{"location":"<string e.g. Back Bay or 40.7128,-74.0060>"}',
  },
] as const satisfies AgentAvailableTool[];

export default createFixtures(ENTRIES, ({ toolName }) => toolName);
