import { z } from "zod";

export const AgentKindEnumSchema = z
  .enum(["supervisor", "operator"])
  .describe(
    "Specifies the role type of an agent in the system. A 'supervisor' has administrative privileges and can oversee multiple operators, while an 'operator' handles day-to-day operational tasks.",
  );
export type AgentKindEnum = z.infer<typeof AgentKindEnumSchema>;

export const AgentKindValueSchema = z
  .string()
  .refine(
    (value) =>
      Object.values(AgentKindEnumSchema.enum).includes(value as AgentKindEnum),
    {
      message: `Agent kind must be one of: ${Object.values(AgentKindEnumSchema.enum).join(", ")}`,
    },
  )
  .describe(
    "Specifies the role type of an agent in the system. A 'supervisor' has administrative privileges and can oversee multiple operators, while an 'operator' handles day-to-day operational tasks.",
  );
export type AgentKindValue = z.infer<typeof AgentKindValueSchema>;

export const AgentTypeValueSchema = z
  .string()
  .describe("Specifies the type of an agent in the system.");
export type AgentTypeValue = z.infer<typeof AgentTypeValueSchema>;

export const AgentIdValueSchema = z
  .string()
  .describe(
    "Unique agent id composed of '{agentKind}:{agentType}[{instanceNum}]:{version}' e.g: 'supervisor:boss[1]:1' or 'operator:poem_generator[2]:3'",
  );
export type AgentIdValue = z.infer<typeof AgentIdValueSchema>;

export const AgentConfigIdValueSchema = z
  .string()
  .describe(
    "Unique agent config id composed of '{agentKind}:{agentType}:{version}' e.g: 'supervisor:boss:1' or 'operator:poem_generator:3'",
  );
export type AgentConfigIdValue = z.infer<typeof AgentConfigIdValueSchema>;

export const AgentNumValueSchema = z
  .number()
  .describe("Agent instance number.");
export type AgentNumValue = z.infer<typeof AgentNumValueSchema>;

export const AgentConfigVersionValueSchema = z
  .number()
  .describe("Agent config version number.");
export type AgentConfigVersionValue = z.infer<
  typeof AgentConfigVersionValueSchema
>;

/**
 * Schema for configuring an agent type.
 * Defines the basic properties and requirements for creating agents of a specific type.
 */
export const AgentConfigSchema = z.object({
  agentConfigId: AgentConfigIdValueSchema,
  agentConfigVersion: AgentConfigVersionValueSchema,
  agentKind: AgentKindEnumSchema,
  agentType: AgentTypeValueSchema,
  instructions: z
    .string()
    .describe("Provide detailed instructions on how the agent should act."),
  description: z
    .string()
    .describe(
      "Description of the agent's behavior and purpose of his existence.",
    ),
  tools: z
    .array(z.string())
    .describe("List of tool identifiers that this agent type can utilize."),
  maxPoolSize: z
    .number()
    .int()
    .min(0)
    .describe(
      "Maximum number of agents to maintain in the pool for this type.",
    ),
  autoPopulatePool: z
    .boolean()
    .describe(
      "Populates the agent pool for a specific type up to its configured size.",
    ),
});
export type AgentConfig = z.infer<typeof AgentConfigSchema>;

/**
 * Schema for an individual agent instance.
 * Represents a specific instance of an agent with its runtime state.
 */
export const AgentSchema = z.object({
  agentId: AgentIdValueSchema,
  agentKind: AgentKindEnumSchema,
  agentType: AgentTypeValueSchema,
  agentNum: AgentNumValueSchema,
  agentConfigVersion: AgentConfigVersionValueSchema,
  /** Configuration settings for this agent */
  config: AgentConfigSchema,
  /**
   * Indicates whether this agent is currently being used
   * Used for pool management to track available agents
   */
  inUse: z.boolean().default(false),
});
export type Agent = z.infer<typeof AgentSchema>;
export type AgentWithInstance<TAgentInstance> = Omit<Agent, "instance"> & {
  instance: TAgentInstance;
};

/**
 * Schema for an available tool.
 */
export const AvailableToolSchema = z.object({
  toolName: z.string(),
  description: z.string(),
  toolInput: z.string().optional(),
});

export type AvailableTool = z.infer<typeof AvailableToolSchema>;

/**
 * Schema for pool statistics of an agent type
 * Provides information about pool capacity and utilization
 */
export const AgentConfigPoolStatsSchema = z
  .object({
    /** Maximum number of agents that can be in the pool */
    poolSize: z.number(),
    /** Number of agents currently available in the pool */
    available: z.number(),
    /** Number of agents currently in use from the pool */
    active: z.number(),
    /** Number of created agents */
    created: z.number(),
  })
  .describe("Statistics about an agent config's pool");

export type AgentConfigPoolStats = z.infer<typeof AgentConfigPoolStatsSchema>;
