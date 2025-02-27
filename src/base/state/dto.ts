import { z } from "zod";

export const LogUpdateSchema = <TData extends z.ZodType>(dataSchema: TData) =>
  z.object({
    timestamp: z.string(),
    data: dataSchema,
  });
export type LogUpdate<T extends z.ZodType> = z.infer<
  ReturnType<typeof LogUpdateSchema<T>>
>;

export const LogInitSchema = z.object({
  timestamp: z.string(),
  type: z.literal("@log_init"),
});
export type LogInit = z.infer<typeof LogInitSchema>;
