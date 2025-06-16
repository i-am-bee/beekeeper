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

        console.log(`###`);
        console.log(`${item.input}\n`);
        console.log(`###`);
        console.log(`${resp.message.content}\n\n\n`);

        expect(resp.type).toEqual(item.expected.type);
        expect(resp.message.content).toBeDefined();
      });
    });

  describe("Simple questions", () => {
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
    ]);
  });
});
