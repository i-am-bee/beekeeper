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
      "CREATE_TASK_CONFIG",
      "UPDATE_TASK_CONFIG",
      "SELECT_TASK_CONFIG",
      "TASK_CONFIG_UNAVAILABLE",
    ] as const,
    description:
      "Valid values: CREATE_TASK_CONFIG | UPDATE_TASK_CONFIG | SELECT_TASK_CONFIG | TASK_CONFIG_UNAVAILABLE",
  })
  .comment({
    comment:
      "Follow by one of the possible responses format based on the chosen response type",
  })
  .object({
    name: "RESPONSE_CREATE_TASK_CONFIG",
    isOptional: true,
    attributes: laml.ProtocolBuilder.new()
      .text({
        name: "task_type",
        description:
          "Name of the new task config type in snake_case **never includes any concrete parameter values**",
      })
      .text({
        name: "agent_type",
        description: "Name of the existing agent config type",
      })
      .text({
        name: "task_config_input",
        description:
          "Task config input should serves as a template for task run input for derived task runs.",
      })
      .text({
        name: "description",
        description: "Detail information about the task and its context",
      }),
  })
  .object({
    name: "RESPONSE_UPDATE_TASK_CONFIG",
    isOptional: true,
    attributes: laml.ProtocolBuilder.new()
      .text({
        name: "task_type",
        description: "Name of the existing task config type to update",
      })
      .text({
        name: "agent_type",
        isOptional: true,
        description: "Name of the existing agent config type",
      })
      .text({
        name: "task_config_input",
        isOptional: true,
        description:
          "Task config input should serves as a template for task run input for derived task runs.",
      })
      .text({
        name: "description",
        isOptional: true,
        description: "Detail information about the task and its context",
      }),
  })
  .object({
    name: "RESPONSE_SELECT_TASK_CONFIG",
    isOptional: true,
    attributes: laml.ProtocolBuilder.new().text({
      name: "task_type",
      description: "Name of the selected task config type",
    }),
  })
  .object({
    name: "RESPONSE_TASK_CONFIG_UNAVAILABLE",
    isOptional: true,
    attributes: laml.ProtocolBuilder.new().text({
      name: "explanation",
      description:
        "Clear, objective reason why config cannot be selected, updated, or created",
    }),
  })
  .build();
