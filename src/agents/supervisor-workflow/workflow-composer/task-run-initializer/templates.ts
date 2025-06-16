import { AgentConfig } from "@/agents/registry/dto.js";
import { BodyTemplateBuilder } from "@/agents/supervisor-workflow/templates/body.js";
import * as laml from "@/laml/index.js";
import { listFormatter } from "@/laml/index.js";
import { TaskConfig } from "@/tasks/manager/dto.js";

export class ExistingResourcesBuilder {
  private output: string;

  private constructor() {
    this.output = "";
  }

  static new() {
    return new ExistingResourcesBuilder();
  }
  previousSteps(previousSteps: string[], introduction?: string) {
    const steps = !previousSteps.length
      ? "There is no previous steps yet."
      : listFormatter("numbered")(previousSteps, "");

    const content = `${introduction ? `${introduction}\n\n` : ""}${steps}`;
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

  agentConfigs(configs?: readonly AgentConfig[], introduction?: string) {
    const agents = !configs?.length
      ? "There is no existing agent config yet."
      : laml.printLAMLObject(
          configs.reduce((acc, curr, idx) => {
            Object.assign(acc, {
              [`${idx + 1}. ${curr.agentType}`]: {
                agent_type: curr.agentType,
                tools: curr.tools,
                description: curr.description,
              },
            } satisfies laml.dto.LAMLObject);
            return acc;
          }, {}),
        );

    const content = `${introduction ? `${introduction}\n\n` : ""}${agents}`;
    this.output += BodyTemplateBuilder.new()
      .section({
        title: {
          text: "Existing agent configs",
          level: 3,
        },
        content,
        newLines: {
          contentEnd: 1,
        },
      })
      .build();

    return this;
  }

  taskConfigs(configs?: readonly TaskConfig[], introduction?: string) {
    const tasks = !configs?.length
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

    const content = `${introduction ? `${introduction}\n\n` : ""}${tasks}`;
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
