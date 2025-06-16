import { describe, expect, it } from "vitest";
import * as agentConfigCreator from "./agent-config-creator-raw-json.js";
import { getChatLLM } from "@/helpers/llm.js";
import { ExistingAgentConfig } from "./dto.js";
import { AgentAvailableTool } from "@/agents/supervisor-workflow/dto.js";

const llm = getChatLLM("supervisor");

const runAgent = ({
  input,
  availableTools,
  existingConfigs,
}: {
  input: string;
  existingConfigs?: ExistingAgentConfig[];
  availableTools?: AgentAvailableTool[];
}) =>
  agentConfigCreator.run(llm, {
    task: input,
    history: [],
    availableTools: availableTools || [],
    existingConfigs: existingConfigs || [],
  });

describe("Agent config creator raw JSON", () => {
  it("Create agent config", async () => {
    const resp = await runAgent({
      availableTools: [
        {
          name: "news_search",
          description:
            "Query a curated index of newspapers, magazines, and wire-services for articles that match a keyword or topic. Supports source and date filters, returning structured results with headline, outlet, publication date, snippet, and article URL.",
        },
      ],
      input:
        "Collect news headlines containing related to AI from the past 24 hours.",
    });

    expect(resp).toEqual({ a: 1 });
  });
});
