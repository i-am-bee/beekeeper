import { textSplitter } from "@/utils/text.js";
import { Resources } from "../resources/dto.js";
import { TaskStep, TaskStepInputParameter, TaskStepResource } from "./dto.js";
import { isNonNull, isNonNullish } from "remeda";

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
  static splitInputs(inputStr: string): string[] {
    const inputs: string[] = [];
    let current = "";
    let bracketDepth = 0;

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    for (const [i, char] of [...inputStr].entries()) {
      if (char === "[" || char === "(") {
        bracketDepth++;
      } else if (char === "]" || char === ")") {
        bracketDepth--;
      }

      if (char === "," && bracketDepth === 0) {
        inputs.push(current.trim());
        current = "";
      } else {
        current += char;
      }
    }

    if (current.trim()) {
      inputs.push(current.trim());
    }

    return inputs;
  }

  static parseInput(
    input: string,
  ): TaskStepInputParameter | TaskStepResourceAssignError | null {
    const deps = new Set<number>();
    const stepRegex =
      /\[from\s+Steps?\s+(\d+)(?:\s*[–-]\s*(\d+))?\]|\bSteps?\s+(\d+)(?:\s*[–-]\s*(\d+))?/gi;
    const assumedRegex = /\[source:\s*assumed\]/i;

    const bracketMatches = [...input.matchAll(/\[(.*?)\]/g)];
    let hasAssumed = false;
    let hasSteps = false;

    for (const match of bracketMatches) {
      const content = match[1];
      if (/source:\s*assumed/i.test(content)) {
        hasAssumed = true;
      }
      if (/steps?\s+\d+/i.test(content)) {
        hasSteps = true;
      }
    }

    if (hasSteps && hasAssumed) {
      return new TaskStepResourceAssignError(
        "Input cannot contain both [source: assumed] and [from Step ...] references.",
        "task",
        input,
      );
    }

    // Reset step regex index for safety before use
    stepRegex.lastIndex = 0;

    let match: RegExpExecArray | null;
    while ((match = stepRegex.exec(input))) {
      hasSteps = true;
      let start: number, end: number;
      if (match[1] !== undefined) {
        start = Number(match[1]);
        end = match[2] ? Number(match[2]) : start;
      } else {
        start = Number(match[3]);
        end = match[4] ? Number(match[4]) : start;
      }
      for (let i = start; i <= end; i++) {
        deps.add(i);
      }
    }

    if (hasAssumed && hasSteps) {
      return new TaskStepResourceAssignError(
        "Input cannot contain both [source: assumed] and [from Step ...] references.",
        "task",
        input,
      );
    }

    let assumed = false;
    if (hasAssumed) {
      assumed = true;
      input = input.replace(assumedRegex, "").trim();
    }

    const inputWithoutSteps = input.replace(stepRegex, "").trim();
    const dependencies = [...deps].sort((a, b) => a - b);

    if (
      dependencies.length === 0 &&
      !assumed &&
      (inputWithoutSteps === "" || inputWithoutSteps === "none")
    ) {
      return null;
    }

    return {
      value: inputWithoutSteps,
      ...(dependencies.length > 0 ? { dependencies } : {}),
      ...(assumed ? { assumed: true } : {}),
    };
  }

  static parseInputOutput(inputOutput: string):
    | {
        inputs?: TaskStepInputParameter[];
        output: string;
        dependencies?: number[];
      }
    | TaskStepResourceAssignError {
    const [inputRaw, outputRaw] = inputOutput
      .split(";")
      .map((part) => part.trim());

    if (!inputRaw || !outputRaw) {
      throw new Error(`Invalid input/output format: ${inputOutput}.`);
    }

    const inputStr = inputRaw.replace(/input:\s*/, "");
    const output = outputRaw.replace(/output:\s*/, "");

    const parsedInputs = TaskStepMapper.splitInputs(inputStr).map(
      TaskStepMapper.parseInput,
    );

    const error = parsedInputs.find(
      (input) => input instanceof TaskStepResourceAssignError,
    );
    if (error) {
      return error;
    }

    const inputs = parsedInputs.filter(isNonNull) as TaskStepInputParameter[];
    const dependencies = inputs
      .map((input) => input.dependencies)
      .flat()
      .filter(isNonNullish);

    return {
      ...(inputs.length > 0 ? { inputs } : {}),
      output,
      ...(dependencies.length > 0 ? { dependencies } : {}),
    };
  }

  static parse(
    taskStep: string,
    taskNo: number,
    resources: Resources,
  ): TaskStep | TaskStepResourceAssignError {
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
        return new TaskStepResourceAssignError(
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
        return new TaskStepResourceAssignError(
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
        return new TaskStepResourceAssignError(
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
        return new TaskStepResourceAssignError(
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

    const parsedInputOutput = TaskStepMapper.parseInputOutput(inputOutputPart);
    if (parsedInputOutput instanceof TaskStepResourceAssignError) {
      return parsedInputOutput;
    }

    const dependencies =
      parsedInputOutput.inputs
        ?.map((input) => input.dependencies)
        .flat()
        .filter(isNonNullish) ?? [];

    return {
      no: taskNo,
      step: assignmentPart,
      ...parsedInputOutput,
      resource,
      dependencies,
    } satisfies TaskStep;
  }

  static formatInputOutput(taskStep: TaskStep) {
    let inputOutput: string;
    if (taskStep.inputs && taskStep.inputs.length > 0) {
      const formattedInputs = taskStep.inputs
        .map((input) => {
          const details: string[] = [];

          if (input.dependencies?.length) {
            const [start, end] = [
              input.dependencies[0],
              input.dependencies[input.dependencies.length - 1],
            ];
            const rangeStr =
              start === end ? `Step ${start}` : `Steps ${start}-${end}`;
            details.push(`from ${rangeStr}`);
          }

          if (input.assumed) {
            details.push("source: assumed");
          }

          return details.length > 0
            ? `${input.value} [${details.join(", ")}]`
            : input.value;
        })
        .join(", ");
      inputOutput = `input: ${formattedInputs}; output: ${taskStep.output}`;
    } else {
      inputOutput = `output: ${taskStep.output}`;
    }

    return inputOutput;
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

    const inputOutput = TaskStepMapper.formatInputOutput(taskStep);

    return `${taskStep.step} (${inputOutput}) [${resourceDescription}]`;
  }
}
