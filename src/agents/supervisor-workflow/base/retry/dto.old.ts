// import { z } from "zod";

// export const ResultTypeEnumSchema = z.enum(["SUCCESS", "ERROR"]);
// export type ResultTypeEnum = z.infer<typeof ResultTypeEnumSchema>;

// export const FnSuccessResultSchema = <T extends z.ZodTypeAny>(
//   resultSchema: T,
// ) =>
//   z.object({
//     type: z.literal(ResultTypeEnumSchema.Values.SUCCESS),
//     result: resultSchema,
//   });
// export type FnSuccessResult<T extends z.ZodTypeAny> = z.infer<
//   ReturnType<typeof FnSuccessResultSchema<T>>
// >;

// export const FnErrorResultSchema = z.object({
//   type: z.literal(ResultTypeEnumSchema.Values.ERROR),
//   explanation: z.string(),
// });
// export type FnErrorResult = z.infer<typeof FnErrorResultSchema>;

// export const FnResultSchema = <T extends z.ZodTypeAny>(resultSchema: T) =>
//   z.discriminatedUnion("type", [
//     FnSuccessResultSchema(resultSchema),
//     FnErrorResultSchema,
//   ]);
// export type FnResult<T extends z.ZodTypeAny> = z.infer<
//   ReturnType<typeof FnResultSchema<T>>
// >;

// export const FnResultWithPayloadSchema = <
//   T extends z.ZodTypeAny,
//   P extends z.ZodTypeAny,
// >(
//   resultSchema: T,
//   payloadSchema: P,
// ) =>
//   z.object({
//     result: FnResultSchema(resultSchema),
//     payload: payloadSchema.optional(),
//   });
// export type FnResultWithPayload<
//   T extends z.ZodTypeAny,
//   P extends z.ZodTypeAny,
// > = z.infer<ReturnType<typeof FnResultWithPayloadSchema<T, P>>>;

// export const FnSchema = <T extends z.ZodTypeAny, P extends z.ZodTypeAny>(
//   resultSchema: T,
//   payloadSchema: P,
// ) =>
//   z
//     .function()
//     .args(FnErrorResultSchema.optional(), z.number(), payloadSchema.optional())
//     .returns(FnResultWithPayloadSchema(resultSchema, payloadSchema));
// export type Fn<T extends z.ZodTypeAny, P extends z.ZodTypeAny> = z.infer<
//   ReturnType<typeof FnSchema<T, P>>
// >;

// export const RetryOptionsSchema = z.object({
//   maxRetries: z.number().optional(),
//   delay: z.number().optional(),
// });
// export type RetryOptions = z.infer<typeof RetryOptionsSchema>;
// export const RetrySuccessResultSchema = <T extends z.ZodTypeAny>(
//   resultSchema: T,
// ) =>
//   z.object({
//     type: z.literal(ResultTypeEnumSchema.Values.SUCCESS),
//     result: resultSchema,
//     attempts: z.array(FnErrorResultSchema),
//   });
// export type RetrySuccessResult<T extends z.ZodTypeAny> = z.infer<
//   ReturnType<typeof RetrySuccessResultSchema<T>>
// >;
// export const RetryErrorResultSchema = z.object({
//   type: z.literal(ResultTypeEnumSchema.Values.ERROR),
//   explanation: z.string(),
//   attempts: z.array(FnErrorResultSchema),
// });
// export type RetryErrorResult = z.infer<typeof RetryErrorResultSchema>;
// export const RetryResultSchema = <T extends z.ZodTypeAny>(resultSchema: T) =>
//   z.discriminatedUnion("type", [
//     RetrySuccessResultSchema(resultSchema),
//     RetryErrorResultSchema,
//   ]);
// export type RetryResult<T extends z.ZodTypeAny> = z.infer<
//   ReturnType<typeof RetryResultSchema<T>>
// >;
