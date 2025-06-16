import { z } from "zod";
import {
  AssistantWorkflowMessageSchema,
  UserWorkflowMessageSchema,
  WorkflowMessageSchema,
} from "../dto.js";

export const RequestHandlerInputSchema = z.object({
  history: z.array(WorkflowMessageSchema),
  message: UserWorkflowMessageSchema,
});
export type RequestHandlerInput = z.infer<typeof RequestHandlerInputSchema>;

export const RequestOutputTypeEnumSchema = z.enum([
  "PASS_TO_PLANNER",
  "CLARIFICATION",
  "DIRECT_ANSWER",
]);
export type RequestOutputTypeEnum = z.infer<typeof RequestOutputTypeEnumSchema>;

export const RequestHandlerOutputSchema = z.object({
  type: RequestOutputTypeEnumSchema,
  explanation: z.string(),
  message: AssistantWorkflowMessageSchema,
});
export type RequestHandlerOutput = z.infer<typeof RequestHandlerOutputSchema>;
