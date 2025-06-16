import { ChatModel } from "beeai-framework";
import {
  Message,
  SystemMessage,
  UserMessage,
} from "beeai-framework/backend/message";
import { z } from "zod";
import { AgentConfigCreatorInput } from "./dto.js";
import { CreateAgentConfigSchema, UpdateAgentConfigSchema } from "./tool.js";

export const LLMResponseTypeEnumSchema = z.enum([
  "CREATE_AGENT_CONFIG",
  "UPDATE_AGENT_CONFIG",
  "SELECT_AGENT_CONFIG",
  "AGENT_CONFIG_UNAVAILABLE",
]);

export const BaseLLMResponse = z.object({
  responseExplanation: z
    .string()
    .describe(`Justification of response type choice`),
});

export const LLMResponse = z.union([
  BaseLLMResponse.extend({
    responseType: z.literal(
      LLMResponseTypeEnumSchema.Values.CREATE_AGENT_CONFIG,
    ),
    createdAgentConfig: CreateAgentConfigSchema,
  }),
  BaseLLMResponse.extend({
    responseType: z.literal(
      LLMResponseTypeEnumSchema.Values.UPDATE_AGENT_CONFIG,
    ),
    updatedAgentConfig: UpdateAgentConfigSchema,
  }),
  BaseLLMResponse.extend({
    responseType: z.literal(
      LLMResponseTypeEnumSchema.Values.SELECT_AGENT_CONFIG,
    ),
    agentConfigType: z.string(),
  }),
  BaseLLMResponse.extend({
    responseType: z.literal(
      LLMResponseTypeEnumSchema.Values.AGENT_CONFIG_UNAVAILABLE,
    ),
    explanation: z.string(),
  }),
]);

const systemPrompt = ({
  existingConfigs,
  availableTools,
}: AgentConfigCreatorInput) => {
  const hasAvailableTools = !!availableTools.length;

  return `You are an **AgentConfigCreator** — the action module in a multi-agent workflow.  
Your mission is to select, or—if none exists—create new agent configs to accomplish the task. You can also update an existing config as long as the update doesn’t change its purpose.

---

## Existing resources
These are the assets already at your disposal. Review them before deciding whether to create something new or update what’s there.

### Existing agent configs
${
  !existingConfigs.length
    ? "There is no existing agent configs yet."
    : JSON.stringify(existingConfigs, null, " ")
}

### Available agent tools
${
  !hasAvailableTools
    ? "There is no available agent tools."
    : JSON.stringify(availableTools, null, " ")
}

---

This is the task:`;
};

export async function run(llm: ChatModel, input: AgentConfigCreatorInput) {
  const messages: Message[] = [
    new SystemMessage(systemPrompt(input)),
    // new CustomMessage("control", "thinking"),
    new UserMessage(input.task),
  ];

  const resp = await llm
    .createStructure({
      messages,
      schema: LLMResponse,
    })
    .observe((emitter) => {
      // To get raw LLM input (uncomment following block)
      emitter.match(
        (event) => event.creator === llm && event.name === "start",
        async (data: any, event) => {
          console.log(
            event,
            [
              `Received LLM event "${event.path}"`,
              JSON.stringify(data.input), // array of messages
            ].join("\n"),
          );
        },
      );
    });

  return resp;
}
