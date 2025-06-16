import {
  AgentAvailableTool,
  WorkflowMessage,
} from "@/agents/supervisor-workflow/dto.js";
import { getChatLLM } from "@/helpers/llm.js";
import { describe, expect, it } from "vitest";
import * as agentConfigCreator from "./agent-config-creator-raw.js";
import {
  AgentConfigCreatorOutputTypeEnumSchema,
  AgentCreatorOutputTypeEnum,
  ExistingAgentConfig,
} from "./dto.js";

interface TestDataItem {
  name?: string;
  input: string;
  existingConfigs?: ExistingAgentConfig[];
  availableTools?: AgentAvailableTool[];
  history?: WorkflowMessage[];
  expected: {
    type: AgentCreatorOutputTypeEnum;
  };
}

const testGenerator = (dataset: TestDataItem[]) =>
  dataset.map((item) => {
    it(item.name || item.input, async () => {
      const resp = await agentConfigCreator.run(llm, {
        task: item.input,
        history: item.history,
        availableTools: item.availableTools || [],
        existingConfigs: item.existingConfigs || [],
      });

      console.log(`### INPUT`);
      console.log(`${item.input}\n`);
      console.log(`### RESPONSE`);
      console.log(`${resp.explanation}\n`);
      console.log(`${resp.message.content}\n\n`);
      console.log(`${resp.raw}\n\n`);

      expect(resp.type).toEqual(item.expected.type);
      expect(resp.message.content).toBeDefined();
    });
  });

const llm = getChatLLM("supervisor");

describe("Agent config creator - raw", () => {
  describe(
    AgentConfigCreatorOutputTypeEnumSchema.Values.CREATE_AGENT_CONFIG,
    () => {
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
            type: AgentConfigCreatorOutputTypeEnumSchema.Values
              .CREATE_AGENT_CONFIG,
          },
        },
      ]);
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
            type: AgentConfigCreatorOutputTypeEnumSchema.Values
              .UPDATE_AGENT_CONFIG,
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
            type: AgentConfigCreatorOutputTypeEnumSchema.Values
              .UPDATE_AGENT_CONFIG,
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
            type: AgentConfigCreatorOutputTypeEnumSchema.Values
              .SELECT_AGENT_CONFIG,
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
            type: AgentConfigCreatorOutputTypeEnumSchema.Values
              .AGENT_CONFIG_UNAVAILABLE,
          },
        },
      ]);
    },
  );
});
