import { BaseToolsFactory } from "@/base/tools-factory.js";
import { updateDeepPartialObject } from "@/utils/objects.js";
import { AgentStateLogger } from "@agents/state/logger.js";
import { WorkspaceResource } from "@workspaces/manager/index.js";
import { WorkspaceRestorable } from "@workspaces/restore/restorable.js";
import { clone, isNonNullish } from "remeda";
import {
  agentConfigIdToValue,
  agentIdToString,
  agentSomeIdToKindValue,
  agentSomeIdToTypeValue,
  stringToAgentConfig,
} from "../agent-id.js";
import {
  Agent,
  AgentConfig,
  AgentConfigIdValue,
  AgentConfigPoolStats,
  AgentConfigSchema,
  AgentConfigVersionValue,
  AgentIdValue,
  AgentKindEnum,
  AgentKindEnumSchema,
  AgentTypeValue,
  AgentWithInstance,
} from "./dto.js";

/**
 * Callbacks for managing agent lifecycle events.
 * These callbacks allow customization of agent behavior at key points in their lifecycle.
 */
export interface AgentLifecycleCallbacks<TAgentInstance> {
  /**
   * Called when a new agent needs to be created
   * @param config - Configuration for the agent
   * @param agentId - Unique agent ID
   * @param poolStats - Statistics of the agent pool
   * @param toolsFactory - Factory to create tools
   * @returns Promise resolving to the new agent's id and instance
   */
  onCreate: (
    config: AgentConfig,
    agentId: AgentIdValue,
    toolsFactory: BaseToolsFactory,
  ) => Promise<{ agentId: AgentIdValue; instance: TAgentInstance }>;

  /**
   * Called when an agent is being destroyed
   * @param instance - Instance of the agent being destroyed
   */
  onDestroy: (instance: TAgentInstance) => Promise<void>;

  /**
   * Optional callback when an agent is acquired from the pool
   * Use this to prepare an agent for reuse
   * @param agentId - ID of the agent being acquired
   */
  onAcquire?: (agentId: AgentIdValue) => Promise<TAgentInstance>;

  /**
   * Optional callback when an agent is released back to the pool
   * Use this to clean up agent state before returning to pool
   * @param agentId - ID of the agent being released
   */
  onRelease?: (agentId: AgentIdValue) => Promise<void>;
}

type AgentRuntime<TInstance> = Agent & { instance: TInstance };

export interface AgentInstanceRef<TInstance> {
  agentId: AgentIdValue;
  instance: TInstance;
}

export type AgentTypesMap = Map<AgentKindEnum, Set<string>>;

const AGENT_REGISTRY_USER = "agent_registry_user";
const AGENT_REGISTRY_CONFIG_PATH = ["configs", "agent_registry.jsonl"] as const;

export type CreateAgentConfig = Omit<
  AgentConfig,
  "agentConfigId" | "agentConfigVersion"
>;

export interface AgentRegistrySwitches {
  mutableAgentConfigs?: boolean;
  restoration?: boolean;
}

export interface AgentRegistryConfig<TAgentInstance> {
  switches?: AgentRegistrySwitches;
  onAgentConfigCreated: (
    agentKind: AgentKindEnum,
    agentType: AgentTypeValue,
  ) => void;
  onAgentAvailable: (
    agentKind: AgentKindEnum,
    agentType: AgentTypeValue,
    agentConfigVersion: AgentConfigVersionValue,
    availableCount: number,
  ) => void;
  agentLifecycle: AgentLifecycleCallbacks<TAgentInstance>;
}

export class AgentRegistry<TAgentInstance> extends WorkspaceRestorable {
  /** Map of registered agent kind and their configurations */
  private agentConfigs: Map<AgentKindEnum, Map<AgentTypeValue, AgentConfig[]>>;
  /** Map of all agent instances */
  private agents = new Map<AgentIdValue, AgentRuntime<TAgentInstance>>();
  /** Map of agent pools by kind and type, containing sets of available agent IDs */
  private agentPools: Map<
    AgentKindEnum,
    Map<AgentTypeValue, [AgentConfigVersionValue, Set<AgentConfigIdValue>][]>
  >;
  /** Callbacks for agent lifecycle events */
  private lifecycleCallbacks: AgentLifecycleCallbacks<TAgentInstance>;
  private onAgentConfigCreated: (
    agentKind: AgentKindEnum,
    agentType: AgentTypeValue,
  ) => void;
  private onAgentAvailable: (
    agentKind: AgentKindEnum,
    agentType: AgentTypeValue,
    agentConfigVersion: AgentConfigVersionValue,
    availableCount: number,
  ) => void;
  /** Maps of tools factories for use by agents per agent kinds */
  private toolsFactory = new Map<AgentKindEnum, BaseToolsFactory>();
  private poolsCleanupJobIntervalId: NodeJS.Timeout | null = null;
  private poolsCleanupJobExecuting = false;
  private poolsToCleanup: string[] = [];
  private stateLogger: AgentStateLogger;
  private _switches: AgentRegistrySwitches;

  constructor({
    agentLifecycle,
    onAgentConfigCreated,
    onAgentAvailable,
    switches,
  }: AgentRegistryConfig<TAgentInstance>) {
    super(AGENT_REGISTRY_CONFIG_PATH, AGENT_REGISTRY_USER);
    this.logger.info("Initializing AgentRegistry");
    this.stateLogger = AgentStateLogger.getInstance();
    this.lifecycleCallbacks = agentLifecycle;
    this.onAgentConfigCreated = onAgentConfigCreated;
    this.onAgentAvailable = onAgentAvailable;
    // Initialize agent pools for all agent kinds
    this.agentConfigs = new Map(
      AgentKindEnumSchema.options.map((kind) => [kind, new Map()]),
    );
    this.agentPools = new Map(
      AgentKindEnumSchema.options.map((kind) => [kind, new Map()]),
    );
    this._switches = {
      mutableAgentConfigs: true,
      restoration: true,
      ...clone(switches),
    };
  }

  get switches() {
    return clone(this._switches);
  }

  restore(): void {
    if (this.switches.restoration === false) {
      this.logger.warn(`Skipping restoration`);
      return;
    }
    super.restore(AGENT_REGISTRY_USER);
  }

  protected restoreEntity(resource: WorkspaceResource, line: string): void {
    this.logger.info(`Restoring previous state from ${resource.path}`);

    let parsed;
    try {
      parsed = JSON.parse(line);
    } catch (e) {
      this.logger.error(e);
      throw new Error(`Failed to parse JSON: ${line}`);
    }

    const agentConfigResult = AgentConfigSchema.safeParse(parsed);
    if (agentConfigResult.success) {
      this.createAgentConfig(agentConfigResult.data, false);
      return;
    }

    this.logger.error(agentConfigResult, `Can't restore agent config`);
    throw new Error(`Can't restore`);
  }

  protected getSerializedEntities(): string {
    return Array.from(this.agentConfigs.entries())
      .map(([agentKind, typeMap]) =>
        Array.from(typeMap.entries()).map(([agentType, versions]) => {
          const agentConfig = versions.at(-1);
          if (!agentConfig) {
            throw new Error(
              `Agent config ${agentSomeIdToTypeValue({ agentKind, agentType })} has no version to serialize`,
            );
          }
          return JSON.stringify(agentConfig);
        }),
      )
      .flat()
      .join("\n");
  }

  /**
   * Register tools factory for a specific agent type
   * @param tuples
   */
  async registerToolsFactories(tuples: [AgentKindEnum, BaseToolsFactory][]) {
    for (const [agentKind, factory] of tuples) {
      await factory.init();
      this.toolsFactory.set(agentKind, factory);
      this.stateLogger.logAvailableTools({
        agentKindId: agentSomeIdToKindValue({ agentKind }),
        availableTools: factory.getAvailableTools(),
      });
    }
  }

  private getAgentKindPoolMap(agentKind: AgentKindEnum) {
    const poolKind = this.agentPools.get(agentKind);
    if (!poolKind) {
      throw new Error(`There is missing pool for agent agentKind:${agentKind}`);
    }
    return poolKind;
  }

  private getAgentTypeVersionSetsArray(
    agentKind: AgentKindEnum,
    agentType: AgentTypeValue,
  ) {
    const poolKind = this.getAgentKindPoolMap(agentKind);
    const pool = poolKind.get(agentType);
    if (!pool) {
      throw new Error(
        `There is missing pool version sets array for agent agentKind:${agentKind} agentType:${agentType}`,
      );
    }
    return pool;
  }

  private getAgentTypeVersionSet(
    agentKind: AgentKindEnum,
    agentType: AgentTypeValue,
    agentConfigVersion: number,
  ) {
    const poolVersionSetsArray = this.getAgentTypeVersionSetsArray(
      agentKind,
      agentType,
    );
    const poolVersionSet = poolVersionSetsArray.find(
      (it) => it[0] === agentConfigVersion,
    );
    if (!poolVersionSet) {
      throw new Error(
        `There is missing pool version set for agent agentKind:${agentKind} agentType:${agentType} version:${agentConfigVersion}`,
      );
    }
    return poolVersionSet[1];
  }

  private getAgentConfigMap(agentKind: AgentKindEnum) {
    const typesMap = this.agentConfigs.get(agentKind);
    if (!typesMap) {
      throw new Error(
        `There is missing types map for agent agentKind:${agentKind}`,
      );
    }
    return typesMap;
  }

  private getAgentConfigTypeMap(agentKind: AgentKindEnum, agentType: string) {
    const agentConfigTypeMap = this.getAgentConfigMap(agentKind);
    const agentVersions = agentConfigTypeMap.get(agentType);
    if (!agentVersions) {
      this.logger.error(
        { agentKind, agentType },
        "Agent config type map was not found",
      );
      throw new Error(
        `Agent kind '${agentKind}' type '${agentType}' was not found`,
      );
    }
    return agentVersions;
  }

  getToolsFactory(agentKind: AgentKindEnum): BaseToolsFactory {
    const factory = this.toolsFactory.get(agentKind);
    if (!factory) {
      this.logger.error(
        {
          agentKind,
        },
        `There is missing tools factory for the '${agentKind}' agent kind.`,
      );
      throw new Error(
        `There is missing tools factory for the '${agentKind}' agent kind`,
      );
    }

    return factory;
  }

  private validateConfigMutability() {
    // FIXME Disabled because need to create supervisor
    // if (!this.switches.mutableAgentConfigs) {
    //   throw new Error(
    //     `Can't mutate any agent config due to this.switches.immutableAgentConfigs:${this.switches.mutableAgentConfigs}`,
    //   );
    // }
  }

  createAgentConfig(config: CreateAgentConfig, persist = true): AgentConfig {
    const { agentKind, agentType, maxPoolSize } = config;
    this.logger.info(
      {
        agentKind,
        agentType,
        maxPoolSize,
      },
      "Create new agent config",
    );

    this.validateConfigMutability();

    const agentTypesMap = this.getAgentConfigMap(agentKind);
    if (agentTypesMap.has(agentType)) {
      this.logger.error({ agentType }, "Agent type already registered");
      throw new Error(`Agent type '${agentType}' is already registered`);
    }

    if (config.tools.length) {
      const toolsFactory = this.getToolsFactory(config.agentKind);
      const availableTools = toolsFactory.getAvailableTools();
      if (config.tools.filter((it) => !!it.length).length) {
        const undefinedTools = config.tools.filter(
          (tool) => !availableTools.some((at) => at.toolName === tool),
        );
        if (undefinedTools.length) {
          this.logger.error(
            {
              availableTools: availableTools.map((at) => at.toolName),
              undefinedTools,
            },
            `Tool wasn't found between available tools `,
          );
          throw new Error(
            `Tools [${undefinedTools.join(",")}] weren't found between available tools [${availableTools.map((at) => at.toolName).join(",")}]`,
          );
        }
      } else {
        config.tools = [];
      }
    }

    const agentConfigVersion = 1;
    const agentConfigId = agentConfigIdToValue({
      ...config,
      agentConfigVersion,
    });
    const configVersioned = { ...config, agentConfigId, agentConfigVersion };
    agentTypesMap.set(agentType, [configVersioned]);
    this.stateLogger.logAgentConfigCreate({
      agentConfigId,
      agentType: agentSomeIdToTypeValue(configVersioned),
      config: configVersioned,
    });

    this.initializeAgentPool(agentKind, agentType, agentConfigVersion);
    this.onAgentConfigCreated(agentKind, agentType);

    if (persist) {
      this.persist();
    }

    return configVersioned;
  }

  updateAgentConfig(
    update: Pick<AgentConfig, "agentKind" | "agentType"> &
      Partial<
        Pick<
          AgentConfig,
          | "tools"
          | "instructions"
          | "description"
          | "maxPoolSize"
          | "autoPopulatePool"
        >
      >,
  ) {
    this.logger.debug(
      {
        update,
      },
      "Update agent config",
    );
    this.validateConfigMutability();

    const { agentKind, agentType } = update;
    const config = this.getAgentConfig(update.agentKind, update.agentType);

    if (update.tools) {
      // Check tools existence
      const toolsFactory = this.getToolsFactory(config.agentKind);
      const availableTools = toolsFactory.getAvailableTools();
      const undefinedTools = update.tools.filter(
        (tool) => !availableTools.some((at) => at.toolName === tool),
      );
      if (undefinedTools.length) {
        this.logger.error(
          {
            availableTools: availableTools.map((at) => at.toolName),
            undefinedTools,
          },
          `Tool wasn't found between available tools `,
        );
        throw new Error(
          `Tools [${undefinedTools.join(",")}] weren't found between available tools [${availableTools.map((at) => at.toolName).join(",")}]`,
        );
      }
    }

    const newConfigVersion = clone(config);

    const agentConfigVersion = config.agentConfigVersion + 1;
    const agentConfigId = agentConfigIdToValue({
      ...config,
      agentConfigVersion: agentConfigVersion,
    });
    updateDeepPartialObject(newConfigVersion, {
      ...update,
      agentConfigId,
      agentConfigVersion,
    });
    const configVersions = this.getAgentConfigTypeMap(agentKind, agentType);
    configVersions.push(newConfigVersion);

    this.initializeAgentPool(agentKind, agentType, agentConfigVersion);
    this.lookupPoolsToClean();

    this.stateLogger.logAgentConfigUpdate({
      agentType: agentSomeIdToTypeValue(newConfigVersion),
      agentConfigId: newConfigVersion.agentConfigId,
      config: newConfigVersion,
    });

    return newConfigVersion;
  }

  private initializeAgentPool(
    agentKind: AgentKindEnum,
    agentType: AgentTypeValue,
    agentConfigVersion: AgentConfigVersionValue,
  ) {
    this.logger.debug(
      {
        agentKind,
        agentType,
        agentConfigVersion,
      },
      "Initializing agent pool",
    );

    const kindPool = this.getAgentKindPoolMap(agentKind);
    let typePool = kindPool.get(agentType);
    if (!typePool) {
      typePool = [];
      kindPool.set(agentType, typePool);
    }
    typePool.push([agentConfigVersion, new Set([])]);

    this.populatePool(agentKind, agentType, agentConfigVersion).catch(
      (error) => {
        this.logger.error("Failed to populate pool", { agentType, error });
      },
    );
  }

  /**
   * Populates the agent pool for a specific type up to its configured size
   * @param agentKind - The agent kind to populate pool for
   * @param agentType - The agent type to populate pool for
   * @param version - The agent version to populate pool for
   * @private
   */
  private async populatePool(
    agentKind: AgentKindEnum,
    agentType: AgentTypeValue,
    version: number,
  ): Promise<void> {
    this.logger.debug(
      { agentKind, agentType, version },
      "Populating agent pool",
    );
    const config = this.getAgentConfig(agentKind, agentType, version);

    if (config.maxPoolSize <= 0) {
      this.logger.trace(
        { agentType },
        "Pool population skipped - no pool or size 0",
      );
      return;
    }

    const pool = this.getAgentTypeVersionSet(agentKind, agentType, version);
    if (config.autoPopulatePool) {
      // Pre-populate pool
      const currentPoolSize = pool.size;
      const needed = config.maxPoolSize - currentPoolSize;

      this.logger.debug(
        {
          agentType,
          needed,
          currentPoolSize,
          targetSize: config.maxPoolSize,
        },
        "Creating agents for pool",
      );

      for (let i = 0; i < needed; i++) {
        await this.createAgent(agentKind, agentType, version);
      }
    }
  }

  private lookupPoolsToClean() {
    this.logger.trace("Looking up pools to cleanup");
    this.poolsToCleanup.splice(0);
    // Traverse through all pools and try to destroy all unused agents
    Array.from(this.agentPools.entries()).forEach(([agentKind, typeMap]) => {
      Array.from(typeMap.entries()).forEach(([agentType, versions]) => {
        versions.forEach(([version], index, set) => {
          const latestVersion = index + 1 >= set.length;
          // Schedule
          if (!latestVersion) {
            this.poolsToCleanup.push(
              agentConfigIdToValue({
                agentKind,
                agentType,
                agentConfigVersion: version,
              }),
            );
          }
        });
      });
    });

    if (this.poolsToCleanup.length) {
      this.startPoolsCleanupJob();
    }
  }

  private startPoolsCleanupJob() {
    this.logger.trace("Start cleanup job");
    if (this.poolsCleanupJobIntervalId != null) {
      this.logger.warn(`Pool cleanup job is already running`);
    }
    this.poolsCleanupJobIntervalId = setInterval(async () => {
      if (!this.poolsCleanupJobExecuting) {
        this.poolsCleanupJobExecuting = true;
        this.executePoolsCleanup().catch((err) => {
          this.logger.error(err, "Execute pool cleanup job error");
          this.stopPoolsCleanupJob();
        });
      }
    }, 1000); // Runs every 1s
  }

  private async executePoolsCleanup() {
    this.logger.trace("Executing pool cleanup");
    const poolsToCleanupClone = clone(this.poolsToCleanup);

    let isCleaned = true;
    let index = 0;
    for (const agentConfigIdStr of poolsToCleanupClone) {
      const agentConfigId = stringToAgentConfig(agentConfigIdStr);
      const agentTypeVersionPoolSet = this.getAgentTypeVersionSet(
        agentConfigId.agentKind,
        agentConfigId.agentType,
        agentConfigId.agentConfigVersion,
      );

      let destroyed = 0;
      for (const agentId of agentTypeVersionPoolSet.values()) {
        const agent = this.getAgent(agentId);
        if (!agent.inUse) {
          try {
            await this.destroyAgent(agent.agentId);
            destroyed++;
          } catch (err) {
            this.logger.error(
              err,
              `Cleanup error for agent '${agent.agentId}'`,
            );
          }
        } else {
          this.logger.warn(
            `Can't cleanup agent '${agent.agentId}' he is in use`,
          );
        }
      }
      if (destroyed < agentTypeVersionPoolSet.size) {
        isCleaned = false;
      } else {
        // Destroy unused agent config
        this.destroyAgentConfig(
          agentConfigId.agentKind,
          agentConfigId.agentType,
          agentConfigId.agentConfigVersion,
        );
        this.poolsToCleanup.splice(index, 1);
      }
      index++;
    }

    if (isCleaned) {
      this.stopPoolsCleanupJob();
    }
  }

  private stopPoolsCleanupJob() {
    this.logger.debug("Stop cleanup job");
    if (this.poolsCleanupJobIntervalId == null) {
      this.logger.warn(`Pool cleanup job is already stopped`);
    } else {
      clearInterval(this.poolsCleanupJobIntervalId);
      this.poolsCleanupJobIntervalId = null;
    }
  }

  /**
   * Returns list of all registered agent configs
   * @returns Array of agent type identifiers
   */
  getAllAgentConfigs(): AgentConfig[] {
    this.logger.trace("Getting registered agent configs");
    return Array.from(this.agentConfigs.entries())
      .map(([, typeMap]) =>
        Array.from(typeMap.entries())
          .map(([, versions]) => versions.at(-1))
          .filter(isNonNullish),
      )
      .flat();
  }

  isAgentConfigExists(
    agentKind: AgentKindEnum,
    agentType: AgentTypeValue,
    agentConfigVersion?: number,
  ) {
    let exists = false;
    try {
      this.getAgentConfig(agentKind, agentType, agentConfigVersion);
      exists = true;
    } catch (err) {
      this.logger.warn(err, `Agent config doesn't exist`);
    }

    return exists;
  }

  getAgentConfig(
    agentKind: AgentKindEnum,
    agentType: AgentTypeValue,
    agentConfigVersion?: number,
  ): AgentConfig {
    this.logger.trace(
      {
        agentKind,
        agentType,
        agentConfigVersion,
      },
      "Getting agent type configuration",
    );
    const configVersions = this.getAgentConfigMap(agentKind).get(agentType);
    if (!configVersions) {
      throw new Error(
        `Agent kind '${agentKind}' type '${agentType}' was not found`,
      );
    }
    if (agentConfigVersion != null) {
      const configVersion = configVersions.find(
        (c) => c.agentConfigVersion === agentConfigVersion,
      );
      if (!configVersion) {
        throw new Error(
          `Agent kind '${agentKind}' type '${agentType}' version '${agentConfigVersion}' was not found`,
        );
      }
      return configVersion;
    }

    const lastConfigVersion = configVersions.at(-1);
    if (lastConfigVersion == null) {
      throw new Error(
        `Agent kind '${agentKind}' type '${agentType}' last version was not found`,
      );
    }
    return lastConfigVersion;
  }

  private destroyAgentConfig(
    agentKind: AgentKindEnum,
    agentType: AgentTypeValue,
    agentConfigVersion: number,
  ): AgentConfig {
    this.logger.debug(
      {
        agentKind,
        agentType,
        version: agentConfigVersion,
      },
      "Destroying agent configuration",
    );

    this.validateConfigMutability();
    const configVersions = this.getAgentConfigMap(agentKind).get(agentType);
    if (!configVersions) {
      this.logger.error({ agentType }, "Agent config versions was not found");
      throw new Error(
        `Agent kind '${agentKind}' type '${agentType}' config versions was not found`,
      );
    }

    const configVersionAt = configVersions.findIndex(
      (c) => c.agentConfigVersion === agentConfigVersion,
    );
    if (configVersionAt < 0) {
      throw new Error(
        `Agent kind '${agentKind}' type '${agentType}' version '${agentConfigVersion}' was not found`,
      );
    }
    const stats = this.getPoolStatsByVersion(
      agentKind,
      agentType,
      agentConfigVersion,
    );
    if (stats.active) {
      throw new Error(
        `Agent config kind '${agentKind}' type '${agentType}' version '${agentConfigVersion}' can't be destroyed while it is still in use.`,
      );
    }

    const destroyedConfig = configVersions.splice(configVersionAt, 1)[0];
    const { agentConfigId } = destroyedConfig;
    this.logger.info({ agentConfigId }, "Agent config destroyed successfully");

    if (!configVersions.length) {
      this.getAgentConfigMap(agentKind).delete(agentType);
    }

    if (!this.getAgentConfigMap(agentKind).size) {
      this.agentConfigs.delete(agentKind);
    }

    const agentTypeId = agentSomeIdToTypeValue({
      agentKind,
      agentType,
    });
    this.stateLogger.logAgentConfigDestroy({
      agentConfigId,
      agentType: agentTypeId,
    });
    return destroyedConfig;
  }

  /**
   * Acquires an agent instance from the pool or creates a new one
   * @param agentKind - The kind of agent to acquire
   * @param agentType - The type of agent to acquire
   * @param version - The version of agent to acquire
   * @returns Promise resolving to the agent ID
   * @throws Error if no agents are available and pool is at capacity
   */
  async acquireAgent(
    agentKind: AgentKindEnum,
    agentType: AgentTypeValue,
    version?: number,
  ): Promise<AgentWithInstance<TAgentInstance>> {
    this.logger.debug(
      { agentKind, agentType, version },
      "Attempting to acquire agent",
    );
    const config = this.getAgentConfig(agentKind, agentType, version);
    const pool = this.getAgentTypeVersionSet(
      agentKind,
      agentType,
      config.agentConfigVersion,
    );

    if (!pool || config.maxPoolSize === 0) {
      this.logger.debug({ agentType }, "No pool available, creating new agent");
      return this._acquireAgent(
        await this.createAgent(agentKind, agentType, config.agentConfigVersion),
      );
    }

    // Try to get an available agent from the pool
    for (const agentId of pool) {
      const agent = this.getAgent(agentId);
      if (!agent.inUse) {
        this.logger.debug({ agentType, agentId }, "Acquired agent from pool");
        return this._acquireAgent(agent);
      }
    }

    // No available agents in pool
    if (pool.size < config.maxPoolSize) {
      this.logger.debug(
        {
          agentKind,
          agentType,
          version: config.agentConfigVersion,
          currentSize: pool.size,
          maxSize: config.maxPoolSize,
        },
        "Pool not at capacity, creating new agent",
      );
      return this._acquireAgent(
        await this.createAgent(agentKind, agentType, config.agentConfigVersion),
      );
    }

    this.logger.error("No available agents and pool at capacity", {
      agentKind,
      agentType,
      version: config.agentConfigVersion,
      poolSize: config.maxPoolSize,
    });
    throw new Error(
      `No available agents of kind '${agentKind}' type '${agentType}' version '${config.agentConfigVersion}' in pool and pool is at capacity`,
    );
  }

  private async _acquireAgent(agent: Agent) {
    const { agentId } = agent;
    agent.inUse = true;

    if (this.lifecycleCallbacks.onAcquire) {
      this.logger.trace({ agentId }, "Executing onAcquire callback");
      await this.lifecycleCallbacks.onAcquire(agentId);
    }
    this.stateLogger.logAgentAcquire({
      agentId: agent.agentId,
    });

    const [poolStats, versions] = this.getPoolStats(
      agent.agentKind,
      agent.agentType,
    );
    this.stateLogger.logPoolChange({
      agentTypeId: agentSomeIdToTypeValue(agent),
      poolStats,
      versions,
    });

    return agent as AgentWithInstance<TAgentInstance>;
  }

  /**
   * Releases an agent back to its pool or destroys it
   * @param agentId - ID of the agent to release
   * @throws Error if agent is not found
   */
  async releaseAgent(agentId: AgentIdValue): Promise<void> {
    this.logger.debug({ agentId }, "Attempting to release agent");
    const agent = this.agents.get(agentId);
    if (!agent) {
      this.logger.error({ agentId }, "Agent not found for release");
      throw new Error(`Agent with ID '${agentId}' not found`);
    }

    const { agentKind, agentType, agentConfigVersion, maxPoolSize } =
      agent.config;
    const pool = this.getAgentTypeVersionSet(
      agentKind,
      agentType,
      agentConfigVersion,
    );

    if (!pool || maxPoolSize === 0) {
      this.logger.debug({ agentId }, "No pool available, destroying agent");
      await this.destroyAgent(agentId);
      return;
    }

    if (this.lifecycleCallbacks.onRelease) {
      this.logger.trace({ agentId }, "Executing onRelease callback");
      await this.lifecycleCallbacks.onRelease(agentId);
    }

    // Return to pool
    agent.inUse = false;
    pool.add(agentId);
    this.logger.debug(
      { agentId, agentType: agent.agentType },
      "Agent released back to pool",
    );
    this.stateLogger.logAgentRelease({
      agentId: agent.agentId,
    });

    const [poolStats, versions] = this.getPoolStats(
      agent.agentKind,
      agent.agentType,
    );
    this.stateLogger.logPoolChange({
      agentTypeId: agentSomeIdToTypeValue(agent),
      poolStats,
      versions,
    });

    this.onAgentAvailable(agentKind, agentType, agentConfigVersion, 1);
  }

  private async createAgent(
    agentKind: AgentKindEnum,
    agentType: AgentTypeValue,
    agentConfigVersion: number,
  ): Promise<AgentWithInstance<TAgentInstance>> {
    this.logger.debug({ agentKind, agentType }, "Creating new agent");
    const config = this.getAgentConfig(
      agentKind,
      agentType,
      agentConfigVersion,
    );
    const versionPoolStats = this.getPoolStatsByVersion(
      agentKind,
      agentType,
      agentConfigVersion,
    );
    const toolsFactory = this.getToolsFactory(agentKind);
    const agentNum = versionPoolStats.created + 1;
    const agentId = agentIdToString({
      agentKind,
      agentType,
      agentNum: agentNum,
      agentConfigVersion: agentConfigVersion,
    });
    const { instance } = await this.lifecycleCallbacks.onCreate(
      config,
      agentId,
      toolsFactory,
    );

    const agent = {
      agentId,
      agentKind,
      agentType,
      agentNum,
      agentConfigVersion: config.agentConfigVersion,
      config,
      inUse: false,
      instance,
    } satisfies AgentWithInstance<typeof instance>;
    this.agents.set(agentId, agent);

    const pool = this.getAgentTypeVersionSetsArray(agentKind, agentType);
    let poolVersionSetArrayItem = pool.find((p) => p[0] === agentConfigVersion);
    if (!poolVersionSetArrayItem) {
      poolVersionSetArrayItem = [agentConfigVersion, new Set([])];
      pool.push(poolVersionSetArrayItem);
    }
    poolVersionSetArrayItem[1].add(agentId);
    this.logger.trace({ agentKind, agentType, agentId }, "Added agent to pool");

    this.logger.info(
      { agentId, agentType, agentKind },
      "Agent created successfully",
    );

    this.stateLogger.logAgentCreate({
      agentId: agentId,
      agentConfigId: config.agentConfigId,
    });

    const [poolStats, versions] = this.getPoolStats(agentKind, agentType);
    this.stateLogger.logPoolChange({
      agentTypeId: agentSomeIdToTypeValue(agent),
      poolStats,
      versions,
    });
    this.onAgentAvailable(agentKind, agentType, config.agentConfigVersion, 1);
    return agent;
  }

  private async destroyAgent(agentId: AgentIdValue): Promise<void> {
    this.logger.debug({ agentId }, "Attempting to destroy agent");
    const agent = this.agents.get(agentId);
    if (!agent) {
      this.logger.error({ agentId }, "Agent not found for destruction");
      throw new Error(`Agent with ID '${agentId}' not found`);
    }

    const { agentKind, agentType, agentConfigVersion } = agent;

    await this.lifecycleCallbacks.onDestroy(agent.instance);

    // Remove from pool if it's in one
    const pool = this.getAgentTypeVersionSet(
      agentKind,
      agentType,
      agentConfigVersion,
    );
    if (pool) {
      pool.delete(agentId);
      this.logger.trace(
        {
          agentId,
          agentKind,
          agentType,
          agentConfigVersion,
        },
        "Removed agent from pool",
      );
    } else {
      throw new Error(`Missing pool`);
    }

    if (!pool.size) {
      // Remove pool version array set item
      const poolVersionSetsArray = this.getAgentTypeVersionSetsArray(
        agentKind,
        agentType,
      );
      const poolVersionSet = poolVersionSetsArray.findIndex(
        (it) => it[0] === agentConfigVersion,
      );
      poolVersionSetsArray.splice(poolVersionSet, 1);
    }

    this.agents.delete(agentId);
    this.logger.info(
      {
        agentKind,
        agentType,
        agentConfigVersion,
      },
      "Agent destroyed successfully",
    );

    this.stateLogger.logAgentDestroy({
      agentId,
    });

    const [poolStats, versions] = this.getPoolStats(agentKind, agentType);
    this.stateLogger.logPoolChange({
      agentTypeId: agentSomeIdToTypeValue(agent),
      poolStats,
      versions,
    });
  }

  /**
   * Returns list of all active agent instances
   * @returns Array of active agents
   */
  getActiveAgents(
    agentKind?: AgentKindEnum,
    agentType?: AgentTypeValue,
    agentConfigVersion?: number,
  ): Agent[] {
    this.logger.trace("Getting active agents");
    return Array.from(this.agents.values()).filter((a) => {
      if (agentKind && agentKind !== a.agentKind) {
        return false;
      }
      if (agentType && agentType !== a.agentType) {
        return false;
      }
      if (
        agentConfigVersion != null &&
        agentConfigVersion !== a.config.agentConfigVersion
      ) {
        return false;
      }
      return a.inUse;
    });
  }

  getAgent(agentId: AgentIdValue): Agent {
    this.logger.trace({ agentId }, "Getting agent by ID");
    const agent = this.agents.get(agentId);
    if (!agent) {
      this.logger.error({ agentId }, "Agent not found");
      throw new Error(`Agent with ID '${agentId}' not found`);
    }
    return agent;
  }

  getPoolStats(
    agentKind: AgentKindEnum,
    agentType: AgentTypeValue,
  ): [AgentConfigPoolStats, [number, AgentConfigPoolStats][]] {
    this.logger.trace({ agentKind, agentType }, "Getting pool statistics");
    const pool = this.getAgentTypeVersionSetsArray(agentKind, agentType);

    if (!pool) {
      return [{ poolSize: 0, available: 0, active: 0, created: 0 }, []];
    }

    const versionedAgents = pool.map(
      ([version, set]) =>
        [version, Array.from(set).map(this.getAgent.bind(this))] as const,
    );
    const versions = versionedAgents.map(([version, agents]) => {
      const available = agents.filter((agent) => !agent.inUse).length;
      const config = this.getAgentConfig(agentKind, agentType, version);
      const stats = {
        poolSize: config.maxPoolSize,
        available,
        active: agents.length - available,
        created: agents.length,
      } satisfies AgentConfigPoolStats;
      return [version, stats] as [number, AgentConfigPoolStats];
    });

    const stats = versions.reduce(
      (prev, [, curr]) => {
        const sum = {
          available: curr.available + prev.available,
          created: curr.created + prev.created,
          active: curr.active + prev.active,
          poolSize: curr.poolSize + prev.poolSize,
        } satisfies AgentConfigPoolStats;
        return sum;
      },
      {
        poolSize: 0,
        available: 0,
        active: 0,
        created: 0,
      } satisfies AgentConfigPoolStats,
    );

    this.logger.debug({ agentType, ...stats }, "Pool statistics");
    return [stats, versions];
  }

  private getPoolStatsByVersion(
    agentKind: AgentKindEnum,
    agentType: AgentTypeValue,
    version: number,
  ) {
    // FIXME Unoptimized
    const [, versions] = this.getPoolStats(agentKind, agentType);
    const found = versions.find(([currVersion]) => currVersion === version);
    if (!found) {
      return { poolSize: 0, available: 0, active: 0, created: 0 };
    }
    const [, versionStats] = found;
    return versionStats;
  }
}
