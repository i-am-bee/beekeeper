import { AgentAvailableTool } from "@/agents/supervisor-workflow/dto.js";
import { BodyTemplateBuilder } from "@/agents/supervisor-workflow/templates/body.js";
import { ExistingTaskConfig } from "./dto.js";
import * as laml from "@/laml/index.js";

export class ExistingResourcesBuilder {
  private output: string;

  private constructor() {
    this.output = "";
  }

  static new() {
    return new ExistingResourcesBuilder();
  }

  taskConfigs(configs?: ExistingTaskConfig[]) {
    const content = !configs?.length
      ? "There is no existing agent configs yet."
      : laml.printLAMLObject(
          configs.reduce((acc, curr, idx) => {
            Object.assign(acc, {
              [`${idx + 1}. ${curr.agentType}`]: {
                agent_type: curr.agentType,
                instructions: curr.instructions,
                description: curr.description,
                tools: curr.tools,
              },
            } satisfies laml.dto.LAMLObject);
            return acc;
          }, {}),
        );

    this.output += BodyTemplateBuilder.new()
      .section({
        title: {
          text: "Existing agent configs",
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
              [`${idx + 1}. ${curr.toolName}`]: { description: curr.description },
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
