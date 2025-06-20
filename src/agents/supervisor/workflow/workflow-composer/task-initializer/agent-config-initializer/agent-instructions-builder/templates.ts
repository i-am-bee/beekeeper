import { BodyTemplateBuilder } from "@/agents/supervisor/workflow/templates/body.js";
import * as laml from "@/laml/index.js";
import {
  TaskStep,
  TaskStepInputParameter,
} from "../../../helpers/task-step/dto.js";
import { AgentAvailableTool, AgentConfigTinyDraft } from "../dto.js";
import { pick } from "remeda";

export class ContextBuilder {
  private _output: string;

  private constructor() {
    this._output = "";
  }

  static new() {
    return new ContextBuilder();
  }

  inputs(
    previousSteps: TaskStep[],
    inputs?: TaskStepInputParameter[],
    introduction?: string,
  ) {
    let content;
    if (!inputs?.length) {
      content = "There is no expected input parameters for this agent.";
    } else {
      const formattedInputs = inputs.map((input) => {
        let output = `${input.value}`;
        if (input.dependencies?.length) {
          const dependencies = input.dependencies.map((d) => {
            const step = previousSteps.find((s) => s.no === d);
            if (!step) {
              throw new Error(`Unknown Step ${d}`);
            }
            return `${step.step}`;
          });

          if (dependencies.length === 1) {
            output += ` - This parameter is output of other agent step that is going to solve the task \`${dependencies[0]}\``;
          } else {
            output += ` - This parameter is output of other agents that are going to solve these tasks: ${dependencies
              .map((d) => `\`${d}\``)
              .join(", ")}`;
          }
        }
        return output;
      });
      content = `${introduction ? `${introduction}\n\n` : ""}${laml.listFormatter("numbered")(formattedInputs, "", false)}`;
    }

    this._output += BodyTemplateBuilder.new()
      .section({
        title: {
          text: "Input parameters",
          level: 3,
        },
        newLines: {
          start: 1,
          contentStart: 0,
          contentEnd: 0,
          end: 0,
        },
        content,
      })
      .build();

    return this;
  }

  outputs(outputs?: string[], introduction?: string) {
    const content = `${introduction ? `${introduction}\n\n` : ""}${laml.listFormatter("numbered")(outputs || [], "", false)}`;

    this._output += BodyTemplateBuilder.new()
      .section({
        title: {
          text: "Output parameters",
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

  assignedTools(tools?: readonly AgentAvailableTool[], introduction?: string) {
    const availableTools = !tools?.length
      ? "There is no assigned tools for this agent. It should use his LLM capabilities to solve the task."
      : laml.printLAMLObject(
          tools.reduce((acc, curr, idx) => {
            Object.assign(acc, {
              [`${idx + 1}. ${curr.toolName}`]: {
                description: curr.description,
                toolInput: curr.toolInput ? curr.toolInput : "",
              },
            } satisfies laml.dto.LAMLObject);
            return acc;
          }, {}),
          {
            indent: "   ",
          },
        );

    const content = `${introduction ? `${introduction}\n\n` : ""}${availableTools}`;

    this._output += BodyTemplateBuilder.new()
      .section({
        title: {
          text: "Assigned tools",
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

  agentMetadata(agentConfigDraft: AgentConfigTinyDraft, introduction?: string) {
    const content = `${introduction ? `${introduction}\n\n` : ""}${laml.printLAMLObject(pick(agentConfigDraft, ["agentType", "description", "tools"]))}`;

    this._output += BodyTemplateBuilder.new()
      .section({
        title: {
          text: "Agent metadata",
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
    return this._output;
  }
}
