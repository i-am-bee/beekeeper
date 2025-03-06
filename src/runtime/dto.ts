import { z } from "zod";
import { AgentSchema } from "@/agents/registry/dto.js";
import { TaskRunSchema } from "@/tasks/manager/dto.js";

export const BaseRuntimeOutputSchema = z.object({
  agent: AgentSchema.optional(),
  taskRun: TaskRunSchema,
  text: z.string(),
});
export type BaseRuntimeOutput = z.infer<typeof BaseRuntimeOutputSchema>;

export const RuntimeProgressOutputSchema = BaseRuntimeOutputSchema.extend({
  kind: z.literal("progress"),
});
export type RuntimeProgressOutput = z.infer<typeof RuntimeProgressOutputSchema>;

export const RuntimeFinalOutputSchema = BaseRuntimeOutputSchema.extend({
  kind: z.literal("final"),
});
export type RuntimeFinalOutput = z.infer<typeof RuntimeFinalOutputSchema>;

export const RuntimeOutputSchema = z.discriminatedUnion("kind", [
  RuntimeProgressOutputSchema,
  RuntimeFinalOutputSchema,
]);
export type RuntimeOutput = z.infer<typeof RuntimeOutputSchema>;
