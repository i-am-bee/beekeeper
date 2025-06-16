import { textSplitter } from "@/utils/text.js";
import { TaskStep, TaskStepResource } from "./dto.js";

export class TaskStepMapper {
  static parse(taskStep: string): TaskStep {
    const parsedTaskStep = textSplitter(taskStep, ["(", ")", "[", "]"]);
    const assignmentPart = parsedTaskStep[0].trim();
    const inputOutputPart = parsedTaskStep[1].trim();
    const resourcePart = parsedTaskStep[3].trim();

    let resource: TaskStepResource;
    if (resourcePart.toLocaleLowerCase().startsWith("tools:")) {
      const tools = resourcePart.split("tools:")[1].trim();
      resource = {
        type: "tools",
        tools: tools.split(",").map((tool) => tool.trim()),
      };
    } else if (resourcePart.toLocaleLowerCase().startsWith("llm")) {
      resource = {
        type: "llm",
      };
    } else if (resourcePart.startsWith("agent:")) {
      const agentType = resourcePart.split("agent:")[1].trim();
      resource = {
        type: "agent",
        agentType,
      };
    } else {
      throw new Error(`Invalid resource part: ${resourcePart}`);
    }

    return {
      step: assignmentPart,
      inputOutput: inputOutputPart,
      resource,
    } satisfies TaskStep;
  }

  static format(taskStep: TaskStep): string {
    return `${taskStep.step} (${taskStep.inputOutput}) [${
      taskStep.resource.type === "tools"
        ? `tools: ${taskStep.resource.tools}`
        : taskStep.resource.type === "llm"
          ? "LLM"
          : `agent: ${taskStep.resource.agentType}`
    }]`;
  }
}
