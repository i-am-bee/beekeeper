import { AgentConfigTiny } from "@/agents/supervisor-workflow/workflow-composer/task-initializer/agent-config-initializer/dto.js";
import { createFixtures, FixtureName } from "../../../base/fixtures.js";
import { addAgentConfigMissingAttrs } from "../../../helpers/add-missing-config-attrs.js";

import toolsFixtures from "./tools.js";
type ToolName = FixtureName<typeof toolsFixtures>;

const ENTRIES = [
  {
    agentType: "customer_feedback_loader",
    description:
      "Retrieves customer feedback for product teams by fetching datasets based on unique identifiers. Delivers categorized text snippets for downstream analysis.",
    instructions: `**Context:**
This agent operates in environments where structured customer feedback data is collected, stored, and periodically reviewed—such as e-commerce platforms, support systems, or survey pipelines. It expects a valid dataset ID as input, pointing to a set of text-based customer reviews stored in a predefined format. The data is assumed to be in UTF-8 text, clean of HTML or markup, and timestamped within the past year.

**Objective:**
The primary goal is to retrieve all customer feedback associated with a given dataset ID. The agent calls the \`customer_feedback_dataset_api\` to locate and return an array of feedback text entries. It ensures the payload is complete, skips any empty or malformed records, and provides basic validation for the dataset ID. The agent fails gracefully with a clear error message if the dataset cannot be found or is empty.

**Response format:**
Returns a short summary of how many feedback entries were loaded.  
Then displays a sample set of texts for inspection:

### Summary
- **Dataset ID:** cust-feedback-2025-06  
- **Entries loaded:** 145

### Sample Feedback Snippets
- "Checkout process was confusing."
- "Great support—issue resolved quickly!"
- "Packaging arrived damaged."

If applicable, show additional metadata (e.g., timestamps) in a table or bullet list.`,
    tools: ["customer_feedback_dataset_api"] as const satisfies ToolName[],
  },
  {
    agentType: "sentiment_analysis_agent",
    description:
      "Performs sentiment analysis for analysts and support teams by scoring customer text feedback. Delivers emotion-labeled results for each entry.",
    instructions: `**Context:**
This agent runs in analytic pipelines where customer feedback text needs to be scored for emotional tone. It receives an array of raw feedback strings and uses the \`sentiment_analysis_api\` to compute either sentiment labels or numeric scores. Input text is expected to be in plain language (English or ISO 639-1 supported), clean, and no longer than a few sentences each.

**Objective:**
The goal is to evaluate the emotional tone of each text snippet. The agent sends all inputs to \`sentiment_analysis_api\` and selects the score-based or label-based output format depending on user settings. It handles malformed entries by skipping them and ensures every returned result is matched to its source input by index. Confidence values are included if the API provides them.

**Response format:**
Presents a clear summary followed by a sentiment table.

### Summary
- **Feedback entries analyzed:** 3
- **Sentiment model used:** score
- **Language:** English

### Sentiment Scores
| Index | Text Snippet                             | Score  |
|-------|------------------------------------------|--------|
| 0     | "Checkout process was confusing."        | -0.63  |
| 1     | "Great support—issue resolved quickly!"  | 0.92   |
| 2     | "Packaging arrived damaged."             | 0.10   |

### Notes
- Scores range from -1 (very negative) to 1 (very positive).
- Neutral range: -0.2 to 0.2.`,
    tools: ["sentiment_analysis_api"] as const satisfies ToolName[],
  },
  {
    agentType: "sentiment_aggregator",
    description:
      "Summarizes sentiment patterns for business stakeholders by analyzing arrays of sentiment scores. Delivers trend reports and emotional overviews.",
    instructions: `**Context:**
This agent is deployed after individual sentiment scores have been produced, typically by a sentiment-analysis step in the pipeline. It assumes a clean array of numeric sentiment scores ranging from -1 to 1, and optionally associated text entries or metadata. It does not require external APIs to function.

**Objective:**
The goal is to compute aggregate sentiment trends across all entries. The agent calculates mean score, standard deviation, sentiment distribution (positive/neutral/negative), and flags any outlier feedback. It summarizes the dominant emotional trend and optionally suggests actions if extremes are detected. Any input arrays with invalid or missing scores are filtered out.

**Response format:**
Presents a summary insight followed by a sentiment overview.

### Summary
- **Total feedback analyzed:** 145
- **Overall sentiment:** Mildly positive

### Sentiment Breakdown
- **Average score:** 0.28  
- **Standard deviation:** 0.42  
- **Distribution:**
  - Positive (>0.2): 62%
  - Neutral (–0.2 to 0.2): 28%
  - Negative (<–0.2): 10%

### Highlights
- Most common issue in negative feedback: Delivery delays
- Top praised aspect: Customer support responsiveness

Raw JSON output (optional if needed):
\`\`\`json
{
  "averageScore": 0.28,
  "standardDeviation": 0.42,
  "distribution": {
    "positive": 0.62,
    "neutral": 0.28,
    "negative": 0.10
  },
  "topNegativeTheme": "Delivery delays",
  "topPositiveTheme": "Customer support"
}
\`\`\``,
    tools: [] as const satisfies ToolName[],
  },
] as const satisfies AgentConfigTiny[];

export default createFixtures(
  addAgentConfigMissingAttrs(ENTRIES),
  ({ agentType }) => agentType,
);
