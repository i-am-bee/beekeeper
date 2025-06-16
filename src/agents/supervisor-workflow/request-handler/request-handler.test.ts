import { getChatLLM } from "@/helpers/llm.js";
import { describe, expect, it } from "vitest";
import * as requestHandler from "./request-handler.js";
import { RequestOutputTypeEnum, RequestOutputTypeEnumSchema } from "./dto.js";

interface TestDataItem {
  name?: string;
  input: string;
  expected: {
    type: RequestOutputTypeEnum;
  };
}
const llm = getChatLLM("supervisor");

describe("Request handler", () => {
  const testGenerator = (dataset: TestDataItem[]) =>
    dataset.map((item) => {
      it(item.name || item.input, async () => {
        const resp = await requestHandler.run(llm, {
          message: {
            kind: "user",
            content: item.input,
            createdAt: new Date(),
          },
          history: [],
        });

        console.log(`### INPUT`);
        console.log(`${item.input}\n`);
        console.log(`### RESPONSE`);
        console.log(`${resp.explanation}\n\n`);
        console.log(`${resp.message.content}\n\n\n`);

        expect(resp.type).toEqual(item.expected.type);
        expect(resp.message.content).toBeDefined();
      });
    });

  describe(RequestOutputTypeEnumSchema.Values.DIRECT_ANSWER, () => {
    testGenerator([
      {
        input: "Hi!",
        expected: {
          type: RequestOutputTypeEnumSchema.Values.DIRECT_ANSWER,
        },
      },
      {
        input: "How are you?",
        expected: {
          type: RequestOutputTypeEnumSchema.Values.DIRECT_ANSWER,
        },
      },
      {
        input: "What time is it?",
        expected: {
          type: RequestOutputTypeEnumSchema.Values.DIRECT_ANSWER,
        },
      },
      {
        input: "What can you do?",
        expected: {
          type: RequestOutputTypeEnumSchema.Values.DIRECT_ANSWER,
        },
      },
      {
        input: "Thanks for your help.",
        expected: { type: RequestOutputTypeEnumSchema.Values.DIRECT_ANSWER },
      },
      {
        input: "Goodbye!",
        expected: { type: RequestOutputTypeEnumSchema.Values.DIRECT_ANSWER },
      },
      {
        input: "Explain your limitations.",
        expected: { type: RequestOutputTypeEnumSchema.Values.DIRECT_ANSWER },
      },
      {
        input: "Tell me a fun fact about space.",
        expected: { type: RequestOutputTypeEnumSchema.Values.DIRECT_ANSWER },
      },
    ]);
  });

  describe(RequestOutputTypeEnumSchema.Values.CLARIFICATION, () => {
    testGenerator([
      {
        input: "Can you tel",
        expected: {
          type: RequestOutputTypeEnumSchema.Values.CLARIFICATION,
        },
      },
      {
        input: "Can you find a flight to the Seattle?",
        expected: {
          type: RequestOutputTypeEnumSchema.Values.CLARIFICATION,
        },
      },
      {
        input: "Who is the president?",
        expected: {
          type: RequestOutputTypeEnumSchema.Values.CLARIFICATION,
        },
      },
      {
        input: "Can you find me a flat?",
        expected: {
          type: RequestOutputTypeEnumSchema.Values.CLARIFICATION,
        },
      },
      {
        input: "Get the five most recent released series",
        expected: {
          type: RequestOutputTypeEnumSchema.Values.CLARIFICATION,
        },
      },
      {
        input: "Book a hotel in Paris.",
        expected: { type: RequestOutputTypeEnumSchema.Values.CLARIFICATION },
      },
      {
        name: "Ambiguous but multi‑step — CLARIFICATION has priority over PASS_TO_PLANNER",
        input: "Plan a trip for me.",
        expected: { type: RequestOutputTypeEnumSchema.Values.CLARIFICATION },
      },
    ]);
  });

  describe(RequestOutputTypeEnumSchema.Values.PASS_TO_PLANNER, () => {
    describe(`Realtime data without need of orchestration`, () => {
      testGenerator([
        {
          input: "What's the latest price of Tesla?",
          expected: {
            type: RequestOutputTypeEnumSchema.Values.PASS_TO_PLANNER,
          },
        },
        {
          input: "Tell me about the latest iPhone.",
          expected: {
            type: RequestOutputTypeEnumSchema.Values.PASS_TO_PLANNER,
          },
        },
        {
          input:
            "Get the five most recent sci‑fi series released in the past six months on any of these streaming platforms: Netflix, Max, Prime Video, or SkyShowtime.",
          expected: {
            type: RequestOutputTypeEnumSchema.Values.PASS_TO_PLANNER,
          },
        },
      ]);
    });

    describe(`Complex workflow assignment`, () => {
      testGenerator([
        {
          input:
            "Analyze the attached CSV of sales data and produce a dashboard highlighting quarterly revenue trends and customer churn.",
          expected: { type: RequestOutputTypeEnumSchema.Values.PASS_TO_PLANNER },
        },
        {
          input:
            "Plan a 5‑day trip to Rome in September including flights from Prague, a 4‑star hotel within walking distance of the Colosseum, daily sightseeing itinerary, and cost estimate.",
          expected: { type: RequestOutputTypeEnumSchema.Values.PASS_TO_PLANNER },
        },
        {
          input:
            "Aggregate and summarize the ten most recent peer‑reviewed papers on quantum computing published on arXiv, and generate a slide deck for an executive briefing.",
          expected: { type: RequestOutputTypeEnumSchema.Values.PASS_TO_PLANNER },
        },
        {
          input:
            "Build a sentiment‑analysis dashboard for #AI tweets posted in the last 24 hours and schedule it to refresh hourly.",
          expected: { type: RequestOutputTypeEnumSchema.Values.PASS_TO_PLANNER },
        },
      ]);
    });
  });
});
