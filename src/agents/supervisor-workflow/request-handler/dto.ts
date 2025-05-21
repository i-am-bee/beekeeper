import { DateStringSchema } from "@/base/dto.js";
import {
  AssistantMessage,
  ToolMessage,
  UserMessage,
} from "beeai-framework/backend/message";
import { z } from "zod";

export const UserWorkflowMessageSchema = z.object({
  kind: z.literal("user"),
  content: z.string(),
  createdAt: DateStringSchema,
});
export type UserWorkflowMessage = z.infer<typeof UserWorkflowMessageSchema>;

export const FunctionCallWorkflowMessageSchema = z.object({
  kind: z.literal("function_call"),
  agentId: z.string(),
  thought: z.string(),
  functionCallId: z.string(),
  functionName: z.string(),
  functionInput: z.string().optional(),
  createdAt: DateStringSchema,
});
export type FunctionCallWorkflowMessage = z.infer<
  typeof FunctionCallWorkflowMessageSchema
>;

export const FunctionCallResultWorkflowMessageSchema = z.object({
  kind: z.literal("function_call_result"),
  agentId: z.string(),
  functionCallId: z.string(),
  functionName: z.string(),
  functionOutput: z.string().optional(),
  createdAt: DateStringSchema,
});
export type FunctionCallResultWorkflowMessage = z.infer<
  typeof FunctionCallResultWorkflowMessageSchema
>;

export const AssistantWorkflowMessageSchema = z.object({
  kind: z.literal("assistant"),
  content: z.string(),
  createdAt: DateStringSchema,
});
export type AssistantWorkflowMessage = z.infer<
  typeof AssistantWorkflowMessageSchema
>;

export const WorkflowMessageSchema = z.discriminatedUnion("kind", [
  UserWorkflowMessageSchema,
  FunctionCallWorkflowMessageSchema,
  FunctionCallResultWorkflowMessageSchema,
  AssistantWorkflowMessageSchema,
]);
export type WorkflowMessage = z.infer<typeof WorkflowMessageSchema>;

export function mapWorkflowMessage(message: WorkflowMessage) {
  switch (message.kind) {
    case "user":
      return new UserMessage(message.content, { createdAt: message.createdAt });
    case "function_call":
      return new AssistantMessage(
        {
          type: "tool-call",
          toolCallId: message.functionCallId,
          toolName: message.functionName,
          args: message.functionInput,
        },
        { createdAt: message.createdAt },
      );
    case "function_call_result":
      return new ToolMessage({
        type: "tool-result",
        toolCallId: message.functionCallId,
        toolName: message.functionName,
        result: message.functionOutput,
      });
    case "assistant":
      return new AssistantMessage(
        {
          type: "text",
          text: message.content,
        },
        { createdAt: message.createdAt },
      );
  }
}

export const RequestHandlerInputSchema = z.object({
  history: z.array(WorkflowMessageSchema).optional(),
  request: z.string(),
});
export type RequestHandlerInput = z.infer<typeof RequestHandlerInputSchema>;

export const RequestOutputTypeEnumSchema = z.enum([
  "COMPOSE_WORKFLOW",
  "CLARIFICATION",
  "DIRECT_ANSWER",
]);
export type RequestOutputTypeEnum = z.infer<typeof RequestOutputTypeEnumSchema>;

export const RequestHandlerOutputSchema = z.object({
  type: RequestOutputTypeEnumSchema,
  explanation: z.string(),
  response: z.string(),
});
export type RequestHandlerOutput = z.infer<typeof RequestHandlerOutputSchema>;
