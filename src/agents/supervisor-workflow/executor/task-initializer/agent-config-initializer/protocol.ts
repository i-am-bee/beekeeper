import * as laml from "@/laml/index.js";

export const protocol = laml.ProtocolBuilder.new()
  .text({
    name: "RESPONSE_CHOICE_EXPLANATION",
    description:
      "Brief explanation of *why* you selected the given RESPONSE_TYPE",
  })
  .constant({
    name: "RESPONSE_TYPE",
    values: [
      "CREATE_AGENT_CONFIG",
      "UPDATE_AGENT_CONFIG",
      "SELECT_AGENT_CONFIG",
      "AGENT_CONFIG_UNAVAILABLE",
    ] as const,
    description:
      "Valid values: CREATE_AGENT_CONFIG | UPDATE_AGENT_CONFIG | SELECT_AGENT_CONFIG | AGENT_CONFIG_UNAVAILABLE",
  })
  .comment({
    comment:
      "Follow by one of the possible responses format based on the chosen response type",
  })
  .object({
    name: "RESPONSE_CREATE_AGENT_CONFIG",
    isOptional: true,
    attributes: laml.ProtocolBuilder.new()
      .text({
        name: "agent_type",
        description: "Name of the new agent config type in snake_case",
      })
      .text({
        name: "description",
        description:
          "Description of the agent's behavior and purpose of his existence",
      })
      .text({
        name: "instructions",
        description:
          "Natural language but structured text instructs on how agent should act",
      })
      .array({
        name: "tools",
        description:
          "list of selected tools identifiers that this agent type can utilize",
        type: "text",
      }),
  })
  .object({
    name: "RESPONSE_UPDATE_AGENT_CONFIG",
    isOptional: true,
    attributes: laml.ProtocolBuilder.new()
      .text({
        name: "agent_type",
        description: "Name of the new agent config type in snake_case",
      })
      .text({
        name: "description",
        isOptional: true,
        description:
          "Description of the agent's behavior and purpose of his existence",
      })
      .text({
        name: "instructions",
        isOptional: true,
        description:
          "Natural language but structured text instructs on how agent should act",
      })
      .array({
        name: "tools",
        isOptional: true,
        description:
          "list of selected tools identifiers that this agent type can utilize",
        type: "text",
      }),
  })
  .object({
    name: "RESPONSE_SELECT_AGENT_CONFIG",
    isOptional: true,
    attributes: laml.ProtocolBuilder.new().text({
      name: "agent_type",
      description: "Name of the selected agent config type",
    }),
  })
  .object({
    name: "RESPONSE_AGENT_CONFIG_UNAVAILABLE",
    isOptional: true,
    attributes: laml.ProtocolBuilder.new().text({
      name: "explanation",
      description:
        "Brief reason you are not able to create, update or select an existing agent config",
    }),
  })
  .build();
