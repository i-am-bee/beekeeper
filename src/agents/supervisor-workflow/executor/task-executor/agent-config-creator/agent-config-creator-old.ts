import { AnyTool, ChatModel, ToolOutput } from "beeai-framework";
import {
  Message,
  SystemMessage,
  ToolMessage,
  UserMessage,
} from "beeai-framework/backend/message";
import { AgentConfigCreatorInput } from "./dto.js";
import { AgentConfigCreatorTool } from "./tool.js";

const systemPrompt = ({
  existingConfigs,
  availableTools,
}: AgentConfigCreatorInput) => {
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
  availableTools.length > 0
    ? "There is no available agent tools."
    : JSON.stringify(availableTools, null, " ")
}

---

This is the task:`;
};

export async function run(llm: ChatModel, input: AgentConfigCreatorInput) {
  const tools: AnyTool[] = [new AgentConfigCreatorTool()];
  const messages: Message[] = [
    new SystemMessage(systemPrompt(input)),
    new UserMessage(input.task),
  ];

  while (true) {
    const response = await llm.create({
      messages,
      tools,
    });
    messages.push(...response.messages);

    const toolCalls = response.getToolCalls();
    const toolResults = await Promise.all(
      toolCalls.map(async ({ args, toolName, toolCallId }) => {
        console.log(
          `-> running '${toolName}' tool with ${JSON.stringify(args)}`,
        );
        const tool = tools.find((tool) => tool.name === toolName)!;
        const response: ToolOutput = await tool.run(args as any);
        const result = response.getTextContent();
        console.log(
          `<- got response from '${toolName}'`,
          result
            .replaceAll(/\s+/g, " ")
            .substring(0, 90)
            .concat(" (truncated)"),
        );
        return new ToolMessage({
          type: "tool-result",
          result,
          isError: false,
          toolName,
          toolCallId,
        });
      }),
    );
    messages.push(...toolResults);

    const answer = response.getTextContent();
    if (answer) {
      return answer;
    }
  }
}
