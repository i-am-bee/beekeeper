import {
  AgentAvailableTool,
  WorkflowMessage,
} from "@/agents/supervisor-workflow/dto.js";
import { getChatLLM } from "@/helpers/llm.js";
import { describe, expect, it } from "vitest";
import * as agentConfigCreator from "./agent-config-creator.js";
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

describe("Agent config creator", () => {
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
          existingConfigs: [
            {
              agentType: "news_headlines_24h",
              description:
                "Gathers news headlines related to AI from the past 24 hours.",
              instructions: `You are an agent specializing in collecting news headlines on related to AI. You have access to a news_search tool that allows you to find articles based on keywords and time filters. Users will provide a time frame and one or more search terms for the news they want collected.

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
            "Collect news headlines about US president from the past 24 hours.",
          expected: {
            type: AgentConfigCreatorOutputTypeEnumSchema.Values
              .UPDATE_AGENT_CONFIG,
          },
        },
      ]);
    },
  );
});
