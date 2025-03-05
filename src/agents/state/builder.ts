import { BaseStateBuilder } from "@/base/state/base-state-builder.js";
import {
  agentSomeIdToKindValue,
  stringToAgentConfig,
  stringToAgentType,
} from "../agent-id.js";
import {
  AgentConfig,
  AgentConfigIdValue,
  AgentConfigPoolStats,
  AgentIdValue,
  AgentKindEnum,
  AgentTypeValue,
  AvailableTool,
} from "../registry/dto.js";
import {
  AgentAcquireEvent,
  AgentConfigCreateEvent,
  AgentConfigDestroyEvent,
  AgentConfigUpdateEvent,
  AgentCreateEvent,
  AgentDestroyEvent,
  AgentPoolChangeEvent,
  AgentReleaseEvent,
  AgentStateDataType,
  AgentStateDataTypeSchema,
  AvailableToolsEvent,
  TaskAssignedEvent,
  TaskHistoryEntryEvent,
  TaskUnassignedEvent,
} from "./dto.js";

// Define update types as const to ensure type safety
export const StateUpdateType = {
  AGENT_CONFIG: "agent_config",
  AGENT: "agent",
  POOL: "pool",
  TOOLS: "tools",
  ASSIGNMENT: "assignment",
  FULL: "full",
} as const;

// Define the type for the update types
export type StateUpdateType =
  (typeof StateUpdateType)[keyof typeof StateUpdateType];

interface Assignment {
  assignmentId: string;
  assignmentKind: string;
  assignedSince: Date;
  data: unknown;
  history: unknown[];
}

export interface AgentInfo {
  agentId: string;
  agentConfigId: string;
  agentConfigVersion: number;
  inUse: boolean;
  isDestroyed: boolean;
  assignments: Map<string, Assignment>;
}

export interface AgentPool {
  agentType: AgentTypeValue;
  poolStats: AgentConfigPoolStats;
  versions: [number, AgentConfigPoolStats][];
}

export interface AgentState {
  agentConfigs: Map<AgentConfigIdValue, AgentConfig[]>;
  agentPools: Map<AgentKindEnum, Map<AgentTypeValue, AgentPool>>;
  agents: Map<AgentIdValue, AgentInfo>;
  availableTools: Map<string, AvailableTool[]>;
  allAvailableTools: Map<string, AvailableTool>;
}

export class AgentStateBuilder extends BaseStateBuilder<
  typeof AgentStateDataTypeSchema,
  AgentState
> {
  constructor() {
    super(AgentStateDataTypeSchema, {
      agentConfigs: new Map(),
      agentPools: new Map(),
      agents: new Map(),
      availableTools: new Map(),
      allAvailableTools: new Map(),
    });
  }

  protected reset(): void {
    this.state.agentConfigs.clear();
    this.state.agentPools.clear();
    this.state.agents.clear();
    this.state.availableTools.clear();
    this.state.allAvailableTools.clear();
  }

  protected processStateUpdate(data: AgentStateDataType): void {
    switch (data.kind) {
      case "agent_config_create":
        this.handleAgentConfigCreate(data);
        this.emit("state:updated", {
          type: StateUpdateType.AGENT_CONFIG,
          ids: [data.agentConfigId, data.agentType],
        });
        break;

      case "agent_config_update":
        this.handleAgentConfigUpdate(data);
        this.emit("state:updated", {
          type: StateUpdateType.AGENT_CONFIG,
          ids: [data.agentConfigId, data.agentType],
        });
        break;

      case "agent_config_destroy":
        this.handleAgentConfigDestroy(data);
        this.emit("state:updated", {
          type: StateUpdateType.AGENT_CONFIG,
          ids: [data.agentConfigId, data.agentType],
        });
        break;

      case "pool_change":
        this.handlePoolChange(data);
        this.emit("state:updated", {
          type: StateUpdateType.POOL,
          ids: [data.agentTypeId],
        });
        break;

      case "available_tools_register":
        this.handleAvailableTools(data);
        this.emit("state:updated", {
          type: StateUpdateType.TOOLS,
          ids: [data.agentKindId],
        });
        break;

      case "agent_create":
      case "agent_acquire":
      case "agent_release":
      case "agent_destroy":
        this.handleAgentLifecycle(data);
        this.emit("state:updated", {
          type: StateUpdateType.AGENT,
          ids: [data.agentId],
        });
        break;

      case "assignment_assign":
        this.handleAssignmentAssign(data);
        this.emit("state:updated", {
          type: StateUpdateType.ASSIGNMENT,
          ids: [data.agentId, data.assignmentId],
        });
        break;

      case "assignment_unassign":
        this.handleAssignmentUnassign(data);
        this.emit("state:updated", {
          type: StateUpdateType.ASSIGNMENT,
          ids: [data.agentId, data.assignmentId],
        });
        break;

      case "assignment_history_entry":
        this.handleAssignmentHistoryEntry(data);
        this.emit("state:updated", {
          type: StateUpdateType.ASSIGNMENT,
          ids: [data.agentId, data.assignmentId],
        });
        break;
    }
  }

  private handleAgentConfigCreate(data: AgentConfigCreateEvent): void {
    const { agentType, config } = data;

    // Store the config
    this.state.agentConfigs.set(agentType, [config]);

    // Initialize the pool if needed
    let pool = this.state.agentPools.get(config.agentKind);
    if (!pool) {
      pool = new Map();
      this.state.agentPools.set(config.agentKind, pool);
    }

    const poolType: AgentPool = {
      agentType,
      poolStats: {
        available: 0,
        created: 0,
        active: 0,
        poolSize: 0,
      },
      versions: [],
    };

    pool.set(config.agentType, poolType);
  }

  private handleAgentConfigUpdate(data: AgentConfigUpdateEvent): void {
    const { agentType, config } = data;

    // Update existing config
    const agentConfigVersions = this.state.agentConfigs.get(agentType);
    if (!agentConfigVersions) {
      throw new Error(
        `Config versions not found for agent pool type: ${agentType}`,
      );
    }

    agentConfigVersions.push(config);
  }

  private handleAgentConfigDestroy(data: AgentConfigDestroyEvent): void {
    const { agentType } = data;
    const agentConfigId = stringToAgentConfig(data.agentConfigId);

    const agentConfigTypePool = this.state.agentConfigs.get(agentType);
    // Remove the config
    if (!agentConfigTypePool) {
      throw new Error(
        `Agent config pool type: ${agentType} was not found for destruction`,
      );
    }

    const agentConfigTypeVersionIndex = agentConfigTypePool.findIndex(
      (version) =>
        version.agentConfigVersion === agentConfigId.agentConfigVersion,
    );
    if (agentConfigTypeVersionIndex < 0) {
      throw new Error(
        `Agent config version: ${agentConfigId.agentConfigVersion} of type: ${agentType} was not found for destruction`,
      );
    }
    agentConfigTypePool.splice(agentConfigTypeVersionIndex, 1);

    if (!agentConfigTypePool.length) {
      // Remove whole type if there is no other version
      this.state.agentConfigs.delete(agentType);
    }

    // Clean up related pool
    const agentKindPool = this.state.agentPools.get(agentConfigId.agentKind);
    if (!agentKindPool) {
      throw new Error(
        `Agent pool kind: ${agentConfigId.agentKind} was not found for destruction`,
      );
    }

    const agentTypePool = agentKindPool.get(agentConfigId.agentType);
    if (!agentTypePool) {
      throw new Error(
        `Agent pool kind: ${agentConfigId.agentKind} type: ${agentConfigId.agentType} was not found for destruction`,
      );
    }
    const agentTypeVersionIndex = agentTypePool.versions.findIndex(
      ([version]) => version === agentConfigId.agentConfigVersion,
    );
    if (agentTypeVersionIndex >= 0) {
      agentTypePool.versions.splice(agentTypeVersionIndex, 1);
    }

    if (!agentTypePool.versions.length) {
      agentKindPool.delete(agentConfigId.agentType);
    }
  }

  private handlePoolChange(data: AgentPoolChangeEvent): void {
    const agentTypeId = stringToAgentType(data.agentTypeId);
    const pool = this.state.agentPools.get(
      agentSomeIdToKindValue(agentTypeId) as AgentKindEnum,
    );
    if (!pool) {
      throw new Error(`Missing pool for type: ${data.agentTypeId}`);
    }

    const poolType = pool.get(agentTypeId.agentType);
    if (!poolType) {
      throw new Error(`Missing pool type: ${data.agentTypeId}`);
    }

    poolType.poolStats = data.poolStats;
    poolType.versions = data.versions;
  }

  private handleAvailableTools(data: AvailableToolsEvent): void {
    this.state.availableTools.set(data.agentKindId, data.availableTools);

    // Update the consolidated tools map
    this.state.allAvailableTools.clear();
    Array.from(this.state.availableTools.values())
      .flat()
      .forEach((tool) => {
        this.state.allAvailableTools.set(tool.toolName, tool);
      });
  }

  private handleAgentLifecycle(
    data:
      | AgentCreateEvent
      | AgentAcquireEvent
      | AgentReleaseEvent
      | AgentDestroyEvent,
  ): void {
    const { agentId } = data;

    switch (data.kind) {
      case "agent_create": {
        if (this.state.agents.has(agentId)) {
          throw new Error(`Agent ${agentId} already exists`);
        }

        const agentConfigId = stringToAgentConfig(data.agentConfigId);

        this.state.agents.set(agentId, {
          agentId,
          agentConfigId: data.agentConfigId,
          agentConfigVersion: agentConfigId.agentConfigVersion,
          inUse: false,
          isDestroyed: false,
          assignments: new Map(),
        });
        break;
      }
      case "agent_destroy": {
        const agent = this.state.agents.get(agentId);
        if (!agent) {
          throw new Error(`Agent ${agentId} doesn't exist for destroy`);
        }
        agent.isDestroyed = true;
        break;
      }

      case "agent_acquire": {
        const agent = this.state.agents.get(agentId);
        if (!agent) {
          throw new Error(`Agent ${agentId} doesn't exist for acquire`);
        }
        agent.inUse = true;
        break;
      }

      case "agent_release": {
        const agent = this.state.agents.get(agentId);
        if (!agent) {
          throw new Error(`Agent ${agentId} doesn't exist for release`);
        }
        agent.inUse = false;
        break;
      }
    }
  }

  private handleAssignmentAssign(data: TaskAssignedEvent): void {
    const { agentId, assignmentId, assignmentKind, assignedSince, assignment } =
      data;

    const agent = this.state.agents.get(agentId);
    if (!agent) {
      throw new Error(`Undefined agent ${agentId}`);
    }

    if (agent.assignments.has(assignmentId)) {
      throw new Error(
        `Assignment ${assignmentId} already exists for agent ${agentId}`,
      );
    }

    agent.assignments.set(assignmentId, {
      assignmentId,
      assignmentKind,
      assignedSince,
      data: assignment,
      history: [],
    });
  }

  private handleAssignmentUnassign(data: TaskUnassignedEvent): void {
    const { agentId, assignmentId } = data;

    const agent = this.state.agents.get(agentId);
    if (!agent) {
      throw new Error(`Undefined agent ${agentId}`);
    }

    if (!agent.assignments.has(assignmentId)) {
      throw new Error(
        `Assignment ${assignmentId} not found for agent ${agentId}`,
      );
    }

    agent.assignments.delete(assignmentId);
  }

  private handleAssignmentHistoryEntry(data: TaskHistoryEntryEvent): void {
    const { agentId, assignmentId, entry } = data;

    const agent = this.state.agents.get(agentId);
    if (!agent) {
      throw new Error(`Undefined agent ${agentId}`);
    }

    const assignment = agent.assignments.get(assignmentId);
    if (!assignment) {
      throw new Error(
        `Assignment ${assignmentId} not found for agent ${agentId}`,
      );
    }

    assignment.history.push(entry);
  }

  getAgent(agentId: string): AgentInfo | undefined {
    return this.state.agents.get(agentId);
  }

  getAllAgents(): AgentInfo[] {
    return Array.from(this.state.agents.values());
  }

  getAgentConfig(
    agentTypeId: string,
    agentVersion?: number,
  ): AgentConfig | undefined {
    const versions = this.state.agentConfigs.get(agentTypeId);
    if (!versions) {
      throw new Error(`Agent config versions not found for '${agentTypeId}'`);
    }
    if (agentVersion != null) {
      return versions.find((v) => v.agentConfigVersion === agentVersion);
    }
    return versions.at(-1);
  }

  private getAgentPoolsMap(
    agentKindId: AgentKindEnum,
  ): Map<string, AgentPool> | undefined {
    return this.state.agentPools.get(agentKindId);
  }

  getAgentPool(
    agentKind: AgentKindEnum,
    agentType: string,
  ): AgentPool | undefined {
    const map = this.getAgentPoolsMap(agentKind);
    return map?.get(agentType);
  }

  getAvailableTools(poolId: string): AvailableTool[] {
    return this.state.availableTools.get(poolId) || [];
  }

  getAllTools(): Map<string, AvailableTool> {
    return this.state.allAvailableTools;
  }

  getAgentAssignment(
    agentId: string,
    assignmentId: string,
  ): Assignment | undefined {
    const agent = this.state.agents.get(agentId);
    return agent?.assignments.get(assignmentId);
  }

  getAgentAssignments(agentId: string): Map<string, Assignment> | undefined {
    return this.state.agents.get(agentId)?.assignments;
  }
}
