import { BodyTemplateBuilder } from "@/agents/supervisor-workflow/templates/body.js";
import * as laml from "@/laml/index.js";
import { AgentAvailableTool, AgentConfigTiny } from "./dto.js";

export class ExistingResourcesBuilder {
  private output: string;

  private constructor() {
    this.output = "";
  }

  static new() {
    return new ExistingResourcesBuilder();
  }

  previousSteps(previousSteps: string[]) {
    const content = !previousSteps.length
      ? "There is no previous steps yet."
      : laml.listFormatter("numbered")(previousSteps, "");

    this.output += BodyTemplateBuilder.new()
      .section({
        title: {
          text: "Previous steps",
          level: 3,
        },
        content: !previousSteps.length
          ? content
          : `The previous steps represent the sequence of tasks completed before the current user input:
  ${content}`,
      })
      .build();

    return this;
  }

  agentConfigs(configs?: AgentConfigTiny[]) {
    const content = !configs?.length
      ? "There is no existing agent config yet."
      : laml.printLAMLObject(
          configs.reduce((acc, curr, idx) => {
            Object.assign(acc, {
              [`${idx + 1}. ${curr.agentType}`]: {
                agent_type: curr.agentType,
                tools: curr.tools,
                description: curr.description,
                instructions: curr.instructions,
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
        newLines: {
          start: 1,
          contentEnd: 0,
          end: 0,
        },
        content,
      })
      .build();

    return this;
  }

  availableTools(tools?: AgentAvailableTool[]) {
    const content = !tools?.length
      ? "There is no available agent tool"
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
          start: 1,
          contentEnd: 0,
          end: 0,
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
