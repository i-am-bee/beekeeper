import { getChatLLM } from "@/helpers/llm.js";
import { describe, expect, it } from "vitest";
import { WorkflowMessage } from "../../dto.js";
import {
  ProblemDecomposerOutputTypeEnum,
  ProblemDecomposerOutputTypeEnumSchema,
} from "./dto.js";
import * as problemDecomposer from "./problem-decomposer.js";

interface TestDataItem {
  name?: string;
  input: string;
  history?: WorkflowMessage[];
  expected: {
    type: ProblemDecomposerOutputTypeEnum;
  };
}

const testGenerator = (dataset: TestDataItem[]) =>
  dataset.map((item) => {
    it(item.name || item.input, async () => {
      const resp = await problemDecomposer.run(llm, {
        message: {
          kind: "user",
          content: item.input,
          createdAt: new Date(),
        },
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

describe("Problem decomposer", () => {
  testGenerator([
    {
      name: `Create a dashboard showcasing quarterly revenue trends and customer churn from the provided sales data`,
      input: `{
  "requestType": "data_analysis_and_visualization",
  "primaryGoal": "Create a dashboard showcasing quarterly revenue trends and customer churn from the provided sales data",
  "userParameters": {
    "dataFormat": "CSV",
    "analysisFocus": ["quarterly revenue trends", "customer churn"]
  },
  "requiredComponents": [
    "load and process CSV sales data",
    "perform quarterly revenue trend analysis",
    "calculate customer churn rate",
    "design and generate a dashboard with visualizations"
  ],
  "expectedDeliverables": "An interactive dashboard with charts illustrating quarterly revenue trends and customer churn rates"
}`,
      expected: {
        type: ProblemDecomposerOutputTypeEnumSchema.Values.STEP_SEQUENCE,
      },
    },
    {
      name: "Poems composing",
      input: `{
  "requestType": "creative_content_generation",
  "primaryGoal": "Compose four unique poems on the topics: Vikings, neutrinos, marshmallows, and cats",
  "userParameters": {
    "topics": ["Vikings", "neutrinos", "marshmallows", "cats"]
  },
  "requiredComponents": [
    "Research and understand each topic for accurate representation",
    "Craft four distinct poems, each capturing the essence of its topic",
    "Ensure each poem adheres to poetic structure and rhyme scheme (if specified)"
  ],
  "expectedDeliverables": "Four original poems, each uniquely themed around Vikings, neutrinos, marshmallows, and cats"
}`,
      expected: {
        type: ProblemDecomposerOutputTypeEnumSchema.Values.STEP_SEQUENCE,
      },
    },
    {
      name: "Quantum computing slide deck",
      input: `{
  "requestType": "research_aggregation_and_presentation",
  "primaryGoal": "Create a slide deck summarizing the latest peer-reviewed papers on quantum computing from arXiv",
  "userParameters": {
    "topic": "quantum computing",
    "source": "arXiv",
    "count": 10,
    "outputFormat": "slide deck"
  },
  "requiredComponents": [
    "search and retrieve the ten most recent peer-reviewed papers on quantum computing from arXiv",
    "extract key findings, methodologies, and conclusions from each paper",
    "synthesize the information into a concise summary",
    "design and create a professional slide deck for an executive briefing"
  ],
  "expectedDeliverables": "A slide deck summarizing the ten latest peer-reviewed quantum computing papers from arXiv, tailored for an executive audience"
}`,
      expected: {
        type: ProblemDecomposerOutputTypeEnumSchema.Values.STEP_SEQUENCE,
      },
    },
    {
      name: "Sentiment dashboard",
      input: `{
  "requestType": "sentiment_dashboard_creation",
  "primaryGoal": "Develop and schedule an hourly refreshing sentiment analysis dashboard for #AI tweets from the past 24 hours",
  "userParameters": {
    "topic": "#AI",
    "timeframe": "last 24 hours",
    "dashboardType": "sentiment analysis"
  },
  "requiredComponents": [
    "collect #AI tweets from the last 24 hours",
    "perform sentiment analysis on the collected tweets",
    "design and build a dashboard",
    "set up an hourly refresh schedule"
  ],
  "expectedDeliverables": "A functioning sentiment analysis dashboard that updates every hour with data from #AI tweets over the past 24 hours"
}}`,
      expected: {
        type: ProblemDecomposerOutputTypeEnumSchema.Values.STEP_SEQUENCE,
      },
    },
  ]);
});
