import { BodyTemplateBuilder } from "@/agents/supervisor-workflow/templates/body.js";
import * as laml from "@/laml/index.js";
import {
  AgentAvailableTool,
  AgentConfigMinimal,
} from "../task-initializer/agent-config-initializer/dto.js";

export class ExistingResourcesBuilder {
  private output: string;

  private constructor() {
    this.output = "";
  }

  static new() {
    return new ExistingResourcesBuilder();
  }

  agentConfigs(configs?: AgentConfigMinimal[]) {
    const content = !configs?.length
      ? "There is no existing agents yet."
      : laml.printLAMLObject(
          configs.reduce((acc, curr, idx) => {
            Object.assign(acc, {
              [`${idx + 1}. ${curr.agentType}`]: {
                agent_type: curr.agentType,
                tools: curr.tools,
                instructions: curr.instructions,
                description: curr.description,
              },
            } satisfies laml.dto.LAMLObject);
            return acc;
          }, {}),
        );

    this.output += BodyTemplateBuilder.new()
      .section({
        title: {
          text: "Existing agents",
          level: 3,
        },
        content,
      })
      .build();

    return this;
  }

  availableTools(tools?: AgentAvailableTool[]) {
    const content = !tools?.length
      ? "There is no available agent tools."
      : laml.printLAMLObject(
          tools.reduce((acc, curr, idx) => {
            Object.assign(acc, {
              [`${idx + 1}. ${curr.toolName}`]: {
                description: curr.description,
              },
            } satisfies laml.dto.LAMLObject);
            return acc;
          }, {}),
        );

    this.output += BodyTemplateBuilder.new()
      .section({
        title: {
          text: "Available agent tools",
          level: 3,
        },
        newLines: {
          contentEnd: 0,
        },
        content,
      })
      .build();

    return this;
  }

  build() {
    return this.output;
  }
}
