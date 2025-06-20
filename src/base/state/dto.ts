import { z } from "zod";
import { DateStringSchema } from "../dto.js";

export const LogUpdateSchema = <TData extends z.ZodType>(dataSchema: TData) =>
  z.object({
    timestamp: DateStringSchema,
    data: dataSchema,
  });
export type LogUpdate<T extends z.ZodType> = z.infer<
  ReturnType<typeof LogUpdateSchema<T>>
>;

export const LogInitSchema = z.object({
  timestamp: DateStringSchema,
  type: z.literal("@log_init"),
});
export type LogInit = z.infer<typeof LogInitSchema>;
