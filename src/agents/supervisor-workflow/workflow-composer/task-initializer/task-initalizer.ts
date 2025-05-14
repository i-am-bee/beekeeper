import { ChatModel } from "beeai-framework";
import {
  AssistantMessage,
  Message,
  SystemMessage,
} from "beeai-framework/backend/message";
import { ZodParserField } from "beeai-framework/parsers/field";
import { LinePrefixParser } from "beeai-framework/parsers/linePrefix";
import { z } from "zod";
import { TaskExecutorInput, TaskExecutorOutputTypeEnumSchema } from "./dto.js";
import { mapWorkflowMessage } from "../../dto.js";

const systemPrompt = () => {
  return `You are a **TaskExecutor** — the action module in a multi-agent workflow.  
Your mission is to read a single task sent by an upstream agent, inspect the **function catalog** and determine the appropriate processing path.

---

## Response Format

All your responses **must** follow this exact format — in this order:
RESPONSE_CHOICE_EXPLANATION: <briefly explain *why* you selected the given RESPONSE_TYPE>
RESPONSE_TYPE: <FUNCTION_CALL | FAIL>
RESPONSE: <your actual reply in the chosen style>

---

## Decision Criteria

### FUNCTION_CALL  
Use **always** when:
- You find a suitable function(s) in function catalog that you plan to call to complete the task.

### FAIL
Use **always** when:
- You are not able to complete the task due to lack of suitable function. 

---

## Domain
Your domain is creation of multi-agent system 

---

This is your task to execute:`;
};

export async function run(llm: ChatModel, input: TaskExecutorInput) {
  const messages: Message[] = [new SystemMessage(systemPrompt())];
  if (input.history && input.history.length) {
    const history = input.history.map(mapWorkflowMessage);
    messages.push(...history);
  }
  messages.push(new AssistantMessage(input.task));

  const resp = await llm.create({
    messages,
  });

  const parser = new LinePrefixParser({
    response_choice_explanation: {
      prefix: "RESPONSE_CHOICE_EXPLANATION:",
      isStart: true,
      next: ["response_type"],
      field: new ZodParserField(z.string().min(1)),
    },
    response_type: {
      prefix: "RESPONSE_TYPE:",
      next: ["response_value"],
      field: new ZodParserField(TaskExecutorOutputTypeEnumSchema),
    },
    response_value: {
      prefix: "RESPONSE:",
      isEnd: true,
      next: [],
      field: new ZodParserField(z.string().min(1)),
    },
  });

  const raw = resp.getTextContent();
  await parser.add(raw);
  await parser.end();

  return {
    type: parser.finalState.response_type,
    explanation: parser.finalState.response_choice_explanation,
    message: {
      kind: "assistant",
      content: parser.finalState.response_value,
      createdAt: new Date(),
    },
    raw,
  };
}
