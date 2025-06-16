import {
  AgentAvailableTool,
  WorkflowMessage,
} from "@/agents/supervisor-workflow/dto.js";
import { getChatLLM } from "@/helpers/llm.js";
import { ProtocolResult } from "@/laml/index.js";
import { describe, expect, it } from "vitest";
import { AgentConfigCreator } from "./agent-config-creator.js";
import {
  AgentConfigCreatorOutputTypeEnumSchema,
  ExistingAgentConfig,
} from "./dto.js";
import { protocol } from "./protocol.js";

interface TestDataItem {
  name?: string;
  input: string;
  existingConfigs?: ExistingAgentConfig[];
  availableTools?: AgentAvailableTool[];
  history?: WorkflowMessage[];
  expected: Partial<ProtocolResult<typeof protocol>>;
}

const testGenerator = (dataset: TestDataItem[]) => {
  const agentConfigCreator = new AgentConfigCreator();
  dataset.map((item) => {
    it(item.name || item.input, async () => {
      const resp = await agentConfigCreator.run(llm, {
        task: item.input,
        history: item.history,
        availableTools: item.availableTools || [],
        existingConfigs: item.existingConfigs || [],
      });

      expect(resp.parsed).toMatchObject(item.expected);
      expect(resp.message.content).toBeDefined();
    });
  });
};
const llm = getChatLLM("supervisor");

describe("Agent config creator - laml", () => {
  describe(
    AgentConfigCreatorOutputTypeEnumSchema.Values.CREATE_AGENT_CONFIG,
    () => {
      describe(`Straightforward`, () => {
        testGenerator([
          {
            availableTools: [
              {
                name: "news_search",
                description:
                  "Query a curated index of newspapers, magazines, and wire-services for articles that match a keyword or topic. Supports source and date filters, returning structured results with headline, outlet, publication date, snippet, and article URL.",
              },
            ],
            input:
              "Collect news headlines containing related to AI from the past 24 hours.",
            expected: {
              RESPONSE_TYPE: "CREATE_AGENT_CONFIG",
              RESPONSE_CREATE_AGENT_CONFIG: {
                agent_type: expect.any(String),
                description: expect.any(String),
                instructions: expect.any(String),
                tools: ["news_search"],
              },
            },
          },
          {
            availableTools: [
              {
                name: "podcast_search",
                description:
                  "Search a catalogue of podcast episodes by keyword and date; returns title, show, release date, and audio URL.",
              },
            ],
            input:
              "Find podcasts released this week discussing breakthroughs in gene editing and give me concise episode summaries.",
            expected: {
              RESPONSE_TYPE: "CREATE_AGENT_CONFIG",
              RESPONSE_CREATE_AGENT_CONFIG: {
                agent_type: expect.any(String),
                description: expect.any(String),
                instructions: expect.any(String),
                tools: ["podcast_search"],
              },
            },
          },
          {
            availableTools: [
              {
                name: "crypto_price_feed",
                description:
                  "Stream current and historical cryptocurrency prices for major exchanges.",
              },
            ],
            input:
              "Track Bitcoin and Ethereum prices for the next 8 hours and alert me if either moves more than 3 %.",
            expected: {
              RESPONSE_TYPE: "CREATE_AGENT_CONFIG",
              RESPONSE_CREATE_AGENT_CONFIG: {
                agent_type: expect.any(String),
                description: expect.any(String),
                instructions: expect.any(String),
                tools: ["crypto_price_feed"],
              },
            },
          },
          {
            availableTools: [
              {
                name: "city_events_search",
                description:
                  "Query municipal event listings with filters for date, venue, and category; returns structured JSON.",
              },
            ],
            input:
              "List all family-friendly events happening in Central Park this weekend, including start times and ticket info.",
            expected: {
              RESPONSE_TYPE: "CREATE_AGENT_CONFIG",
              RESPONSE_CREATE_AGENT_CONFIG: {
                agent_type: expect.any(String),
                description: expect.any(String),
                instructions: expect.any(String),
                tools: ["city_events_search"],
              },
            },
          },
          {
            availableTools: [
              {
                name: "arxiv_search",
                description:
                  "Search arXiv preprints by keyword, subject area, and date; returns title, authors, abstract, and PDF link.",
              },
            ],
            input:
              "Give me a daily digest of new arXiv papers about reinforcement learning, summarized in 3 sentences each.",
            expected: {
              RESPONSE_TYPE: "CREATE_AGENT_CONFIG",
              RESPONSE_CREATE_AGENT_CONFIG: {
                agent_type: expect.any(String),
                description: expect.any(String),
                instructions: expect.any(String),
                tools: ["arxiv_search"],
              },
            },
          },
          {
            availableTools: [
              {
                name: "health_inspection_db",
                description:
                  "Look up restaurant inspection scores and violations by name or address.",
              },
            ],
            input:
              "Notify me whenever a restaurant in my city scores below 80 in its latest health inspection.",
            expected: {
              RESPONSE_TYPE: "CREATE_AGENT_CONFIG",
              RESPONSE_CREATE_AGENT_CONFIG: {
                agent_type: expect.any(String),
                description: expect.any(String),
                instructions: expect.any(String),
                tools: ["health_inspection_db"],
              },
            },
          },
          {
            availableTools: [
              {
                name: "flight_price_tracker",
                description:
                  "Track airfare quotes for specific routes and dates; supports hourly polling.",
              },
            ],
            input:
              "Monitor round-trip fares from Prague to Tokyo in October and alert when the price drops below €700.",
            expected: {
              RESPONSE_TYPE: "CREATE_AGENT_CONFIG",
              RESPONSE_CREATE_AGENT_CONFIG: {
                agent_type: expect.any(String),
                description: expect.any(String),
                instructions: expect.any(String),
                tools: ["flight_price_tracker"],
              },
            },
          },
          {
            availableTools: [
              {
                name: "sec_filings_search",
                description:
                  "Search recent SEC filings (8-K, 10-K, etc.) by company ticker.",
              },
            ],
            input:
              "Collect announcements of upcoming stock splits for any S&P 500 company and summarize the key details.",
            expected: {
              RESPONSE_TYPE: "CREATE_AGENT_CONFIG",
            },
          },
          {
            availableTools: [
              {
                name: "phrase_generator",
                description:
                  "Generate vocabulary lists and example sentences for supported languages.",
              },
            ],
            input:
              "Create a Spanish word-of-the-day exercise with a short quiz every morning at 7 AM local time.",
            expected: {
              RESPONSE_TYPE: "CREATE_AGENT_CONFIG",
              RESPONSE_CREATE_AGENT_CONFIG: {
                agent_type: expect.any(String),
                description: expect.any(String),
                instructions: expect.any(String),
                tools: ["phrase_generator"],
              },
            },
          },
          {
            availableTools: [
              {
                name: "movie_db_search",
                description:
                  "Query upcoming and past film releases, including cast, synopsis, and release dates.",
              },
            ],
            input:
              "Send me a weekly list of science-fiction movies premiering in theatres or streaming in the next month.",
            expected: {
              RESPONSE_TYPE: "CREATE_AGENT_CONFIG",
              RESPONSE_CREATE_AGENT_CONFIG: {
                agent_type: expect.any(String),
                description: expect.any(String),
                instructions: expect.any(String),
                tools: ["movie_db_search"],
              },
            },
          },
          {
            availableTools: [
              {
                name: "weather_alert_feed",
                description:
                  "Stream National Weather Service alerts with geolocation filters.",
              },
            ],
            input:
              "Set up an agent that warns me immediately if there’s a tornado watch or warning within 50 km of my location.",
            expected: {
              RESPONSE_TYPE: "CREATE_AGENT_CONFIG",
              RESPONSE_CREATE_AGENT_CONFIG: {
                agent_type: expect.any(String),
                description: expect.any(String),
                instructions: expect.any(String),
                tools: ["weather_alert_feed"],
              },
            },
          },
        ]);
      });
    },
  );

  describe(
    AgentConfigCreatorOutputTypeEnumSchema.Values.UPDATE_AGENT_CONFIG,
    () => {
      testGenerator([
        {
          name: "News headline - Agent specialization requirement leads to UPDATE_AGENT_CONFIG",
          existingConfigs: [
            {
              agentType: "news_headlines_24h",
              description: "Gathers news headlines the past 24 hours.",
              instructions: `You are an agent specializing in collecting news headlines. You have access to a news_search tool that allows you to find articles based on keywords and time filters. Users will provide a time frame and one or more search terms for the news they want collected.

Objective: Collect news headlines that contain the user-supplied keywords within the requested time window (default: past 24 hours). Use the news_search tool to execute the query, filtering results to match the specified period. Provide a list of headline URLs together with concise summaries.

Response format: Begin with a brief sentence that restates the search terms and time frame. Then list each headline on its own line, showing the URL first and a short summary after an em-dash or colon. For example:

News headlines matching “<keywords>” from the past 24 hours:  
1. URL: [headline_url_1] — Summary: [headline_summary_1]  
2. URL: [headline_url_2] — Summary: [headline_summary_2]`,
              tools: ["news_search"],
            },
          ],
          availableTools: [
            {
              name: "news_search",
              description:
                "Query a curated index of newspapers, magazines, and wire-services for articles that match a keyword or topic. Supports source and date filters, returning structured results with headline, outlet, publication date, snippet, and article URL.",
            },
          ],
          input: "Search headlines news exclusively focused on US president.",
          expected: {
            RESPONSE_TYPE: "UPDATE_AGENT_CONFIG",
          },
        },
        {
          name: "Historical Sites Search - Direct update request leads to UPDATE_AGENT_CONFIG",
          existingConfigs: [
            {
              agentType: "historical_sites_search",
              description: "Agent for searching historical sites in a city.",
              instructions:
                "Context: You are an agent specialized in finding historical sites in a given city. You have access to web search tools to gather information about popular historical landmarks, museums, and sites of interest. Users will provide the city and any specific interests they have. Objective: Provide a list of historical sites to visit, including brief descriptions and any relevant visiting information such as opening hours or ticket prices. Response format: Present the information in a list format with each site having a name, description, and visiting details.",
              tools: ["historical_sites_search_api"],
            },
          ],
          availableTools: [
            {
              name: "historical_sites_search_api",
              description:
                "A purpose-built search endpoint that taps authoritative heritage databases (e.g., UNESCO, national registers, archaeological gazetteers) and returns structured JSON for each site: name, era, coordinates, jurisdiction, brief description, and citation links. Ideal when an LLM needs precise, geo-tagged information on historical or archaeological sites without piecing together data from scattered sources.",
            },
          ],
          input:
            "Update the historical sites search agent to focus on the 13th–15th centuries.",
          expected: {
            RESPONSE_TYPE: "UPDATE_AGENT_CONFIG",
          },
        },
      ]);
    },
  );

  describe(
    AgentConfigCreatorOutputTypeEnumSchema.Values.SELECT_AGENT_CONFIG,
    () => {
      testGenerator([
        {
          name: "Collect news headlines via existing agent",
          existingConfigs: [
            {
              agentType: "news_headlines_24h",
              description:
                "Gathers news headlines related from the past 24 hours.",
              instructions: `You are an agent specializing in collecting news headlines on chosen topic. You have access to a news_search tool that allows you to find articles based on keywords and time filters. Users will provide a time frame and one or more search terms for the news they want collected.

Objective: Collect news headlines that contain the user-supplied keywords within the requested time window (default: past 24 hours). Use the news_search tool to execute the query, filtering results to match the specified period. Provide a list of headline URLs together with concise summaries.

Response format: Begin with a brief sentence that restates the search terms and time frame. Then list each headline on its own line, showing the URL first and a short summary after an em-dash or colon. For example:

News headlines matching “<keywords>” from the past 24 hours:  
1. URL: [headline_url_1] — Summary: [headline_summary_1]  
2. URL: [headline_url_2] — Summary: [headline_summary_2]`,
              tools: ["news_search"],
            },
          ],
          availableTools: [
            {
              name: "news_search",
              description:
                "Query a curated index of newspapers, magazines, and wire-services for articles that match a keyword or topic. Supports source and date filters, returning structured results with headline, outlet, publication date, snippet, and article URL.",
            },
          ],
          input:
            "Collect news headlines containing related to AI from the past 24 hours.",
          expected: {
            RESPONSE_TYPE: "SELECT_AGENT_CONFIG",
          },
        },
      ]);
    },
  );

  describe(
    AgentConfigCreatorOutputTypeEnumSchema.Values.AGENT_CONFIG_UNAVAILABLE,
    () => {
      testGenerator([
        // {
        //   name: "Collect news headlines is not possible",
        //   existingConfigs: [],
        //   availableTools: [
        //     {
        //       name: "sound_generator",
        //       description: "Create sound from natural-language prompts.",
        //     },
        //   ],
        //   input:
        //     "Collect news headlines containing related to AI from the past 24 hours.",
        //   expected: {
        //     type: AgentConfigCreatorOutputTypeEnumSchema.Values
        //       .AGENT_CONFIG_UNAVAILABLE,
        //   },
        // },
        {
          name: "Text to speech is not possible due to lack of available agent tool",
          existingConfigs: [],
          availableTools: [
            {
              name: "google_search",
              description:
                "A lightweight utility that fires off a query to Google Search and returns the top-ranked results (title, URL, snippet, and source site) in a compact JSON array. Ideal for quickly grabbing fresh, relevant links when your LLM needs up-to-date information without crawling the entire web.",
            },
          ],
          input: "Transform provided text to speech",
          expected: {
            RESPONSE_TYPE: "AGENT_CONFIG_UNAVAILABLE",
          },
        },
      ]);
    },
  );
});
