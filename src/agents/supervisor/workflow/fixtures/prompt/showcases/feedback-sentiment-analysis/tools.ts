import { AgentAvailableTool } from "@/agents/supervisor/workflow/workflow-composer/task-initializer/agent-config-initializer/dto.js";
import { createFixtures } from "../../../base/fixtures.js";

const ENTRIES = [
  {
    toolName: "customer_feedback_dataset_api",
    description:
      "Returns an array of individual customer‑feedback text snippets for the requested dataset ID.",
    toolInput: '{"datasetId":"<string e.g. cust-feedback-2025-06>"}',
  },
  {
    toolName: "sentiment_analysis_api",
    description:
      "Performs sentiment analysis on an array of text snippets and returns a score or label (positive / neutral / negative) for each, optionally with confidence values.",
    toolInput:
      '{"texts":["<string>"],"outputFormat":"label|score","language":"<optional ISO 639‑1 code>"}',
  },
] as const satisfies AgentAvailableTool[];

export default createFixtures(ENTRIES, ({ toolName }) => toolName);
