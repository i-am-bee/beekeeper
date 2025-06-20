import { describe, expect, it } from "vitest";
import { retry } from "./retry.js";

describe(`Retry`, () => {
  it(`should return success without any retry attempts`, async () => {
    const result = await retry(
      async () => {
        return {
          result: { type: "SUCCESS", result: "success" },
          payload: undefined,
        };
      },
      { maxRetries: 0 },
    );

    expect(result).toEqual({
      type: "SUCCESS",
      result: "success",
      attempts: [],
    });
  });

  it(`should return error without any retry attempts`, async () => {
    const result = await retry(
      async () => {
        return {
          result: { type: "ERROR", explanation: "error" },
          payload: undefined,
        };
      },
      { maxRetries: 0 },
    );

    expect(result).toEqual({
      type: "ERROR",
      explanation: "Failed after 1 attempts",
      attempts: [{ type: "ERROR", explanation: "error" }],
    });
  });

  it(`should return error after reach max retries`, async () => {
    const result = await retry(
      async (_, attempt) => {
        return {
          result: { type: "ERROR", explanation: `error attempt ${attempt}` },
          payload: undefined,
        };
      },
      { maxRetries: 3 },
    );

    expect(result).toEqual({
      attempts: [
        {
          explanation: "error attempt 1",
          type: "ERROR",
        },
        {
          explanation: "error attempt 2",
          type: "ERROR",
        },
        {
          explanation: "error attempt 3",
          type: "ERROR",
        },
        {
          explanation: "error attempt 4",
          type: "ERROR",
        },
      ],
      explanation: "Failed after 4 attempts",
      type: "ERROR",
    });
  });

  it(`should return success before last attempt`, async () => {
    const maxRetries = 3;
    const result = await retry(
      async (_, attempt) => {
        if (attempt < maxRetries) {
          return {
            result: { type: "ERROR", explanation: `error attempt ${attempt}` },
            payload: undefined,
          };
        } else {
          return {
            result: { type: "SUCCESS", result: "success" },
            payload: undefined,
          };
        }
      },
      { maxRetries },
    );

    expect(result).toEqual({
      attempts: [
        {
          explanation: "error attempt 1",
          type: "ERROR",
        },
        {
          explanation: "error attempt 2",
          type: "ERROR",
        },
      ],
      result: "success",
      type: "SUCCESS",
    });
  });

  it(`should pass payloads between attempts`, async () => {
    const maxRetries = 3;
    const getPayload = (attempt: number) => ({
      attempt,
    });
    const payloads: (ReturnType<typeof getPayload> | undefined)[] = [];
    const result = await retry<any, (typeof payloads)[number]>(
      async (_, attempt, previousPayload) => {
        payloads.push(previousPayload);
        return {
          result: {
            type: "ERROR",
            explanation: `error attempt ${attempt}`,
          },
          payload: getPayload(attempt),
        };
      },
      { maxRetries },
    );

    expect(payloads).toEqual([
      undefined, // First call has no payload
      getPayload(1),
      getPayload(2),
      getPayload(3), // Last attempt
    ]);
    expect(result).toEqual({
      attempts: [
        {
          explanation: "error attempt 1",
          type: "ERROR",
        },
        {
          explanation: "error attempt 2",
          type: "ERROR",
        },
        {
          explanation: "error attempt 3",
          type: "ERROR",
        },
        {
          explanation: "error attempt 4",
          type: "ERROR",
        },
      ],
      explanation: "Failed after 4 attempts",
      type: "ERROR",
    });
  });
});
