import { textSplitter } from "@/utils/text.js";
import { Resources } from "../resources/dto.js";
import { TaskStep, TaskStepResource } from "./dto.js";

export class TaskStepResourceAssignError extends Error {
  get resourceType() {
    return this._resourceType;
  }

  get missingResources() {
    return this._missingResources;
  }

  constructor(
    message: string,
    protected _resourceType: "tool" | "agent" | "task" | "task_run",
    protected _missingResources: string | string[],
  ) {
    super(`Error parsing task step: ${message}`);
    this.name = "TaskStepResourceAssignError";
  }
}

export class TaskStepMapper {
  private static parseInputDependencies(inputOutput: string): number[] {
    const deps = new Set<number>();

    // “Step 3“,  “Steps 2–6“  (en-dash or hyphen)
    const stepRegex = /\bStep\s+(\d+)(?:\s*[–-]\s*(\d+))?/gi;
    let match: RegExpExecArray | null;

    while ((match = stepRegex.exec(inputOutput))) {
      const start = Number(match[1]);
      const end = match[2] ? Number(match[2]) : start;

      for (let i = start; i <= end; i++) {
        deps.add(i);
      }
    }

    return [...deps].sort((a, b) => a - b);
  }

  static parse(
    taskStep: string,
    taskNo: number,
    resources: Resources,
  ): TaskStep {
    const parsedTaskStep = textSplitter(taskStep, ["(", ")", "[", "]"], true);
    const assignmentPart = parsedTaskStep[0].trim();
    const inputOutputPart = parsedTaskStep[1].trim();
    const resourcePart = parsedTaskStep[3].trim();

    const {
      tools: availableTools,
      agents: availableAgents,
      tasks: availableTasks,
      taskRuns: availableTaskRuns,
    } = resources;

    let resource: TaskStepResource;
    if (resourcePart.toLocaleLowerCase().startsWith("tools:")) {
      const toolsStr = resourcePart.split("tools:")[1].trim();
      const tools = toolsStr.split(",").map((tool) => tool.trim());
      const missingTools = tools.filter(
        (tool) => !availableTools.find((t) => t.toolName === tool),
      );

      if (missingTools.length > 0) {
        throw new TaskStepResourceAssignError(
          `Step ${taskNo} references a non-existent tool(s): \`${missingTools.join(", ")}\``,
          "tool",
          missingTools,
        );
      }

      resource = {
        type: "tools",
        tools,
      };
    } else if (resourcePart.toLocaleLowerCase().startsWith("llm")) {
      resource = {
        type: "llm",
      };
    } else if (resourcePart.startsWith("agent:")) {
      const agentType = resourcePart.split("agent:")[1].trim();
      const foundAgent = availableAgents.find(
        (agent) => agent.agentType === agentType,
      );
      if (!foundAgent) {
        throw new TaskStepResourceAssignError(
          `Step ${taskNo} has assigned non-existing agent: \`${agentType}\``,
          "agent",
          agentType,
        );
      }
      resource = {
        type: "agent",
        agent: foundAgent,
      };
    } else if (resourcePart.startsWith("task:")) {
      const taskType = resourcePart.split("task:")[1].trim();

      const foundTask = availableTasks.find(
        (task) => task.taskType === taskType,
      );
      if (!foundTask) {
        throw new TaskStepResourceAssignError(
          `Step ${taskNo} has assigned non-existing task: \`${taskType}\``,
          "task",
          taskType,
        );
      }
      resource = {
        type: "task",
        task: foundTask,
      };
    } else if (resourcePart.startsWith("task_run:")) {
      const taskRunId = resourcePart.split("task_run:")[1].trim();
      const foundTaskRun = availableTaskRuns.find(
        (run) => run.taskRunId === taskRunId,
      );
      if (!foundTaskRun) {
        throw new TaskStepResourceAssignError(
          `Step ${taskNo} has assigned non-existing task run: \`${taskRunId}\``,
          "task_run",
          taskRunId,
        );
      }
      resource = {
        type: "task_run",
        taskRun: foundTaskRun,
      };
    } else {
      throw new Error(`Invalid resource part: ${resourcePart}`);
    }

    const dependencies = this.parseInputDependencies(inputOutputPart);

    return {
      no: taskNo,
      step: assignmentPart,
      inputOutput: inputOutputPart,
      resource,

      dependencies,
    } satisfies TaskStep;
  }

  static format(taskStep: TaskStep): string {
    let resourceDescription: string;

    switch (taskStep.resource.type) {
      case "tools":
        resourceDescription = `tools: ${taskStep.resource.tools}`;
        break;
      case "llm":
        resourceDescription = "LLM";
        break;
      case "task":
        resourceDescription = `task: ${taskStep.resource.task.taskType}`;
        break;
      case "agent":
        resourceDescription = `agent: ${taskStep.resource.agent.agentType}`;
        break;
      case "task_run":
        resourceDescription = `task_run: ${taskStep.resource.taskRun.taskRunId}`;
        break;
    }

    return `${taskStep.step} (${taskStep.inputOutput}) [${resourceDescription}]`;
  }
}
