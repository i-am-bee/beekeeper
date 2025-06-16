import { BodyTemplateBuilder } from "@/agents/supervisor-workflow/templates/body.js";
import * as laml from "@/laml/index.js";
import { ExistingTaskConfig } from "./dto.js";
import { ExistingAgentConfig } from "../agent-config-initializer/dto.js";

export class ExistingResourcesBuilder {
  private output: string;

  private constructor() {
    this.output = "";
  }

  static new() {
    return new ExistingResourcesBuilder();
  }

  agentConfigs(configs?: ExistingAgentConfig[]) {
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

  taskConfigs(configs?: ExistingTaskConfig[]) {
    const content = !configs?.length
      ? "There is no existing task configs yet."
      : laml.printLAMLObject(
          configs.reduce((acc, curr, idx) => {
            Object.assign(acc, {
              [`${idx + 1}. ${curr.taskType}`]: {
                task_type: curr.taskType,
                agent_type: curr.agentType,
                task_config_input: curr.taskConfigInput,
                description: curr.description,
              },
            } satisfies laml.dto.LAMLObject);
            return acc;
          }, {}),
        );

    this.output += BodyTemplateBuilder.new()
      .section({
        title: {
          text: "Existing task configs",
          level: 3,
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
