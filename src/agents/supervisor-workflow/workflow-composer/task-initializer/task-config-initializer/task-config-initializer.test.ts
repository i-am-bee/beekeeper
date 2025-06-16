import { getChatLLM } from "@/helpers/llm.js";
import { ProtocolResult } from "@/laml/protocol.js";
import { Logger } from "beeai-framework";
import { describe, expect, it } from "vitest";
import { protocol } from "./protocol.js";
import { TaskConfigInitializer } from "./task-config-initializer.js";
import { ExistingTaskConfig } from "./dto.js";
import { ExistingAgentConfig } from "../agent-config-initializer/dto.js";
import { clone } from "remeda";

// ----------------------------------------------------------------------------------------------------
// HELPERS
// ----------------------------------------------------------------------------------------------------
const logger = Logger.root.child({
  name: "test",
});

interface TestDataItem {
  name?: string;
  input: string;
  existingTaskConfigs?: ExistingTaskConfig[];
  existingAgentConfigs?: ExistingAgentConfig[];
  expected: Partial<ProtocolResult<typeof protocol>>;
}

const testGenerator = (dataset: TestDataItem[]) => {
  const taskConfigCreator = new TaskConfigInitializer(logger);
  dataset.map((item) => {
    it(item.name || item.input, async () => {
      const resp = await taskConfigCreator.run(llm, {
        existingTaskConfigs: item.existingTaskConfigs || [],
        existingAgentConfigs: item.existingAgentConfigs || [],
        task: item.input,
        actingAgentId: "supervisor:boss[1]:1",
      });

      expect(resp.parsed).toMatchObject(item.expected);
    });
  });
};
const llm = getChatLLM("supervisor");

// ----------------------------------------------------------------------------------------------------
// TEST DATA
// ----------------------------------------------------------------------------------------------------
const AGENT_CONFIGS_ENTRIES = [
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
    agentConfigId: "operator:news_headlines_24h[1]:1",
    agentConfigVersion: 1,
  },
] as const satisfies ExistingAgentConfig[];
type AgentConfigName = (typeof AGENT_CONFIGS_ENTRIES)[number]["agentType"];
const AGENT_CONFIGS = new Map<AgentConfigName, ExistingAgentConfig>(
  AGENT_CONFIGS_ENTRIES.map((e) => [e.agentType, e]),
);
export function agentConfig<Name extends AgentConfigName>(name: Name) {
  return clone(AGENT_CONFIGS.get(name)!);
}

// ----------------------------------------------------------------------------------------------------
// TESTS
// ----------------------------------------------------------------------------------------------------

describe("Task Config Initializer", () => {
  describe("CREATE_TASK_CONFIG", () => {
    describe("Straightforward", () => {
      /* L-1 ----------------------- */
      describe(`Low complexity (L-1)`, () => {
        testGenerator([
          {
            existingAgentConfigs: [agentConfig("news_headlines")],
            input:
              "Collect news headlines containing related to AI from the past 24 hours.",
            expected: {
              RESPONSE_TYPE: "CREATE_TASK_CONFIG",
              RESPONSE_CREATE_TASK_CONFIG: {
                task_type: expect.any(String),
                agent_type: agentConfig("news_headlines").agentType,
                description: expect.any(String),
                task_config_input: expect.any(String),
              },
            },
          },
        ]);
      });
    });
  });
});
