import { ServiceLocator } from "@/utils/service-locator.js";
import { Resources } from "./dto.js";
import { AgentRegistry } from "@/agents/registry/registry.js";
import {
  AgentConfig,
  AgentIdValue,
  AgentKindEnum,
} from "@/agents/registry/dto.js";
import { TaskManager } from "@/tasks/manager/manager.js";
import { clone } from "remeda";
import { TaskConfig } from "@/tasks/manager/dto.js";

export function collectResources(
  agentKind: AgentKindEnum,
  actingAgentId: AgentIdValue,
): Resources {
  const agentRegistry = ServiceLocator.getInstance().get(AgentRegistry);
  const tools = Array.from(
    agentRegistry.getToolsFactory(agentKind).availableTools.values(),
  );

  const agents = agentRegistry.getAgentConfigs({
    kind: agentKind,
  });

  const taskManager = ServiceLocator.getInstance().get(TaskManager);
  const tasks = taskManager.getTaskConfigs(actingAgentId, {
    kind: agentKind,
  });

  const taskRuns = taskManager.getTaskRuns(actingAgentId, {
    taskKind: agentKind,
  });

  return {
    tools,
    agents,
    tasks,
    taskRuns,
  } satisfies Resources;
}

export function extendResources(
  resources: Resources,
  newResources: Partial<Resources>,
): Resources {
  return clone({
    tools: [...resources.tools, ...(newResources.tools ?? [])],
    agents: [...resources.agents, ...(newResources.agents ?? [])],
    tasks: [...resources.tasks, ...(newResources.tasks ?? [])],
    taskRuns: [...resources.taskRuns, ...(newResources.taskRuns ?? [])],
  });
}

export function replaceAgentByAgentTypeInResources(
  resources: Resources,
  newAgent: AgentConfig,
): Resources {
  const agents = resources.agents.map((agent) =>
    agent.agentType === newAgent.agentType ? newAgent : agent,
  );
  return clone({
    ...resources,
    agents,
  });
}

export function replaceTaskByTaskTypeInResources(
  resources: Resources,
  newTask: TaskConfig,
): Resources {
  const tasks = resources.tasks.map((task) =>
    task.taskType === newTask.taskType ? newTask : task,
  );
  return clone({
    ...resources,
    tasks,
  });
}
