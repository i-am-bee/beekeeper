import { z } from "zod";

export const DateStringSchema = z.union([
  z.string().transform((str) => new Date(str)),
  z.date(),
]);
export type DateString = z.infer<typeof DateStringSchema>;

export const OperationResultSchema = z.object({
  relatedId: z.string(),
  success: z.boolean(),
  errorMessage: z.string().optional(),
});
export type OperationResult = z.infer<typeof OperationResultSchema>;
