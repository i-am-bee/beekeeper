import { getChatLLM } from "@/helpers/llm.js";
import { describe, expect, it } from "vitest";
import {
  ProblemDecomposerOutputTypeEnum,
  ProblemDecomposerOutputTypeEnumSchema,
} from "./dto.js";
import { WorkflowMessage } from "../dto.js";
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
      input:
        `{
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
    // {
    //   input:
    //     `Create four distinct poems on these topics: vikings, neutrinos, marshmallows, and cats.`,
    //   expected: {
    //     type: ProblemDecomposerOutputTypeEnumSchema.Values.STEP_SEQUENCE,
    //   },
    // },
//     {
//       input:
//         `{
//   "requestType": "travel_planning",
//   "primaryGoal": "Organize a 5-day trip to Rome from Prague in September",
//   "userParameters": {
//     "departureCity": "Prague",
//     "destination": "Rome",
//     "duration": "5 days",
//     "timeframe": "September",
//     "accommodationRequirements": ["4-star", "walking distance to Colosseum"],
//     "itineraryDetails": "daily sightseeing"
//   },
//   "requiredComponents": [
//     "flight booking from Prague to Rome for September",
//     "hotel reservation at a 4-star establishment within walking distance to the Colosseum",
//     "daily sightseeing itinerary for Rome",
//     "cost estimation for flights, accommodation, and daily activities"
//   ],
//   "expectedDeliverables": "Comprehensive travel plan including flight details, hotel booking, a 5-day sightseeing itinerary, and a cost breakdown"
// }`,
//       expected: {
//         type: ProblemDecomposerOutputTypeEnumSchema.Values.STEP_SEQUENCE,
//       },
//     },
    // {
    //   input:
    //     "Analyze the attached CSV of sales data and produce a dashboard highlighting quarterly revenue trends and customer churn.",
    //   expected: {
    //     type: ProblemDecomposerOutputTypeEnumSchema.Values.STEP_SEQUENCE,
    //   },
    // },
//     {
//       input:
//         `{
//   "requestType": "data_visualization",
//   "primaryGoal": "Create a dashboard showcasing quarterly revenue trends and customer churn from the provided sales data",
//   "dataDetails": {
//     "type": "sales data",
//     "format": "CSV"
//   },
//   "analysisRequirements": [
//     "calculate quarterly revenue",
//     "identify and visualize revenue trends",
//     "determine customer churn rate",
//     "present findings in a dashboard format"
//   ],
//   "expectedDeliverables": "Interactive dashboard with visualizations of quarterly revenue trends and customer churn"
// }`,
//       expected: {
//         type: ProblemDecomposerOutputTypeEnumSchema.Values.STEP_SEQUENCE,
//       },
//     },
//     {
//       input:
//         "Who is the president of Czechia?",
//       expected: {
//         type: ProblemDecomposerOutputTypeEnumSchema.Values.STEP_SEQUENCE,
//       },
//     },
  ]);
});
