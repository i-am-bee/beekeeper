import { z } from "zod";

// Base success result schema
export const FnSuccessResultSchema = <T extends z.ZodTypeAny>(
  resultSchema: T,
) =>
  z.object({
    type: z.literal("SUCCESS"),
    result: resultSchema,
  });

// Base error result schema
export const FnErrorResultSchema = z.object({
  type: z.literal("ERROR"),
  escalation: z.boolean().optional(),
  explanation: z.string(),
});

// Union type for function results
export const FnResultSchema = <T extends z.ZodTypeAny>(resultSchema: T) =>
  z.discriminatedUnion("type", [
    FnSuccessResultSchema(resultSchema),
    FnErrorResultSchema,
  ]);

// Function result with payload
export const FnResultWithPayloadSchema = <
  T extends z.ZodTypeAny,
  P extends z.ZodTypeAny,
>(
  resultSchema: T,
  payloadSchema: P,
) =>
  z.object({
    result: FnResultSchema(resultSchema),
    payload: payloadSchema.optional(),
  });

// Retry options schema
export const RetryOptionsSchema = z.object({
  maxRetries: z.number().optional(),
  delay: z.number().optional(),
});

// Retry success result schema
export const RetrySuccessResultSchema = <T extends z.ZodTypeAny>(
  resultSchema: T,
) =>
  z.object({
    type: z.literal("SUCCESS"),
    result: resultSchema,
    attempts: z.array(FnErrorResultSchema),
  });

// Retry error result schema
export const RetryErrorResultSchema = z.object({
  type: z.literal("ERROR"),
  escalation: z.boolean().optional(),
  explanation: z.string(),
  attempts: z.array(FnErrorResultSchema),
});

// Union type for retry results
export const RetryResultSchema = <T extends z.ZodTypeAny>(resultSchema: T) =>
  z.discriminatedUnion("type", [
    RetrySuccessResultSchema(resultSchema),
    RetryErrorResultSchema,
  ]);

// Type inference helpers - using explicit discriminated union types
export interface FnSuccessResult<T> {
  type: "SUCCESS";
  result: T;
}

export interface FnErrorResult {
  type: "ERROR";
  escalation?: boolean;
  explanation: string;
}

export type FnResult<T> = FnSuccessResult<T> | FnErrorResult;

export interface FnResultWithPayload<T, P> {
  result: FnResult<T>;
  payload?: P;
}

export type RetryOptions = z.infer<typeof RetryOptionsSchema>;

export interface RetrySuccessResult<T> {
  type: "SUCCESS";
  result: T;
  attempts: FnErrorResult[];
}

export interface RetryErrorResult {
  type: "ERROR";
  escalation?: boolean;
  explanation: string;
  attempts: FnErrorResult[];
}

export type RetryResult<T> = RetrySuccessResult<T> | RetryErrorResult;

// Function type (not converted to Zod since it's a function signature)
export type Fn<T, P> = (
  error: FnErrorResult | undefined,
  attempt: number,
  payload: P | undefined,
) => Promise<FnResultWithPayload<T, P>>;

// Type guard functions for better type narrowing
export function isErrorResult<T>(result: FnResult<T>): result is FnErrorResult {
  return result.type === "ERROR";
}

export function isSuccessResult<T>(
  result: FnResult<T>,
): result is FnSuccessResult<T> {
  return result.type === "SUCCESS";
}
