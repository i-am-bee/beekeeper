import {
  AgentKindEnumSchema,
  AgentWithInstance,
} from "@agents/registry/dto.js";
import {
  AgentRegistry,
  AgentRegistrySwitches,
  CreateAgentConfig,
} from "@agents/registry/registry.js";
import { AgentStateLogger } from "@agents/state/logger.js";
import { TaskManager, TaskManagerSwitches } from "@tasks/manager/manager.js";
import { TaskStateLogger } from "@tasks/state/logger.js";
import { WorkspaceManager } from "@workspaces/manager/manager.js";
import { ReActAgent } from "beeai-framework/agents/react/agent";
import { AgentFactory } from "../agents/agent-factory.js";
import { BaseAgentFactory } from "../agents/base/agent-factory.js";
import { operator, supervisor } from "../agents/index.js";
import { Runtime } from "./runtime.js";
import { Logger } from "beeai-framework";
import { ServiceLocator } from "@/utils/service-locator.js";

export interface Switches {
  taskManager?: TaskManagerSwitches;
  agentRegistry?: AgentRegistrySwitches;
}

export interface CreateRuntimeConfig {
  agentConfigFixtures?: CreateAgentConfig[];
  agentFactory?: BaseAgentFactory<unknown>;
  workspace?: string;
  switches?: Switches;
  outputDirPath?: string;
  signal?: AbortSignal;
  logger: Logger;
}

export async function createRuntime({
  agentFactory,
  agentConfigFixtures,
  workspace,
  switches,
  outputDirPath,
  signal,
  logger,
}: CreateRuntimeConfig): Promise<Runtime> {
  // Reset audit logs
  AgentStateLogger.init(outputDirPath);
  TaskStateLogger.init(outputDirPath);

  // Setup workspace
  WorkspaceManager.init(workspace ?? "default", logger, {
    dirPath: outputDirPath,
  });

  let _agentFactory = agentFactory;
  if (_agentFactory == null) {
    // Default agent factory
    _agentFactory = new AgentFactory(logger);
  }

  const registry = new AgentRegistry<
    ReturnType<typeof _agentFactory.createAgent>
  >({
    switches: switches?.agentRegistry,
    agentLifecycle: {
      async onCreate(
        config,
        agentId,
        toolsFactory,
      ): Promise<{
        agentId: string;
        instance: ReturnType<typeof _agentFactory.createAgent>;
      }> {
        const { agentKind, agentType, instructions, description } = config;
        const tools =
          config.tools == null
            ? toolsFactory.getAvailableToolsNames()
            : config.tools;

        const instance = _agentFactory.createAgent(
          {
            agentKind,
            agentType,
            agentId,
            description,
            instructions,
            tools,
          },
          toolsFactory,
          switches,
        );

        return { agentId, instance };
      },
      async onDestroy(/** instance */) {
        // FIXME Not all agents support destruction
        // instance.destroy();
      },
    },
    onAgentConfigCreated(agentKind, agentType) {
      taskManager.registerAgentType(agentKind, agentType);
    },
    onAgentAvailable(agentKind, agentType, agentConfigVersion, availableCount) {
      taskManager.agentAvailable(
        agentKind,
        agentType,
        agentConfigVersion,
        availableCount,
      );
    },
    logger,
  });
  // Register service for usage in agent tool
  ServiceLocator.getInstance().register(AgentRegistry, registry);

  const taskManager = new TaskManager({
    switches: switches?.taskManager,
    onTaskStart: async (
      taskRun,
      taskManager,
      {
        onAwaitingAgentAcquired,
        onAgentAcquired,
        onAgentUpdate,
        onAgentComplete,
        onAgentError,
      },
      addToMemory,
    ) => {
      let agent;

      const taskRunAbortScope = taskRun.abortScope;
      if (!taskRunAbortScope) {
        throw new Error(`Task Run Abort Scope is missing`);
      }

      try {
        agent = await registry.acquireAgent(
          taskRun.config.agentKind,
          taskRun.config.agentType,
        );
      } catch (err) {
        logger.error(err);
        onAwaitingAgentAcquired(taskRun.taskRunId, taskManager);
        return;
      }

      onAgentAcquired(taskRun.taskRunId, agent.agentId, taskManager);
      const { instance } = agent;
      const prompt = taskRun.taskRunInput;

      _agentFactory
        .runAgent(
          instance,
          prompt,
          (key, value) => {
            onAgentUpdate(
              key,
              value,
              taskRun.taskRunId,
              agent.agentId,
              taskManager,
            );
          },
          taskRunAbortScope.signal,
          taskRun.taskRunId,
          addToMemory,
        )
        .then((resp) =>
          onAgentComplete(resp, taskRun.taskRunId, agent.agentId, taskManager),
        )
        .catch((err) => {
          onAgentError(err, taskRun.taskRunId, agent.agentId, taskManager);
        })
        .finally(() => {
          registry.releaseAgent(agent.agentId);
        });
    },
    signal,
    logger,
  });
  // Register service for usage in agent tool
  ServiceLocator.getInstance().register(TaskManager, taskManager);

  await registry.registerToolsFactories([
    [
      "supervisor",
      new supervisor.ToolsFactory(
        registry,
        taskManager,
        supervisor.Workdir.getWorkdirPath().validPath,
        logger,
      ),
    ],
    ["operator", new operator.ToolsFactory(logger)],
  ]);

  registry.restore();

  if (
    !registry.isAgentConfigExists(
      AgentKindEnumSchema.Enum.supervisor,
      supervisor.AgentTypes.BEEKEEPER,
    )
  ) {
    registry.createAgentConfig({
      autoPopulatePool: false,
      agentKind: AgentKindEnumSchema.Enum.supervisor,
      agentType: supervisor.AgentTypes.BEEKEEPER,
      instructions: "",
      tools: registry
        .getToolsFactory(AgentKindEnumSchema.Enum.supervisor)
        .getAvailableToolsNames(),
      description: "The beekeeper supervisor agent that control whole app.",
      maxPoolSize: 1,
    });
  }

  if (agentConfigFixtures?.length) {
    for (const fixture of agentConfigFixtures) {
      registry.createAgentConfig(fixture);
    }
  }

  const agent = await registry.acquireAgent(
    AgentKindEnumSchema.Enum.supervisor,
    supervisor.AgentTypes.BEEKEEPER,
  );

  const { agentId: supervisorAgentId } = agent;
  taskManager.registerAdminAgent(supervisorAgentId);
  taskManager.restore(supervisorAgentId);

  if (
    !taskManager.findTaskConfig(
      "supervisor",
      supervisor.PROCESS_AND_PLAN_TASK_NAME,
      supervisorAgentId,
    )
  ) {
    taskManager.createTaskConfig(
      supervisor.getProcessAndPlanTaskConfig(agent.agentConfigVersion),
      supervisorAgentId,
      supervisorAgentId,
    );
  }

  supervisor.Workdir.registerWorkdir(supervisorAgentId);

  registry.releaseAgent(supervisorAgentId);

  return new Runtime({
    agentRegistry: registry,
    taskManager,
    pollingIntervalMs: 3000,
    supervisor: agent as AgentWithInstance<ReActAgent>,
    timeoutMs: 15 * 60_000, // 15 min
    logger,
  });
}

export function disposeRuntime(runtime: Runtime) {
  ServiceLocator.getInstance().dispose();
  AgentStateLogger.dispose();
  TaskStateLogger.dispose();
  WorkspaceManager.dispose();

  runtime.dispose();
}
