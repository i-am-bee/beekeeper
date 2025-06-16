// import { z } from "zod";

// export const StepResultTypeEnumSchema = z.enum(["SUCCESS", "ERROR"]);
// export type StepResultTypeEnum = z.infer<typeof StepResultTypeEnumSchema>;

// export const StepResultSchema = <T extends z.ZodTypeAny>(resultSchema: T) =>
//   z.discriminatedUnion("type", [
//     z.object({
//       type: z.literal(StepResultTypeEnumSchema.Values.SUCCESS),
//       result: resultSchema,
//     }),
//     z.object({
//       type: z.literal(StepResultTypeEnumSchema.Values.ERROR),
//       explanation: z.string(),
//     }),
//   ]);
