import * as laml from "@/laml/index.js";

export const protocol = laml.ProtocolBuilder.new()
  .text({
    name: "RESPONSE_CHOICE_EXPLANATION",
    description:
      "Brief explanation of *why* you selected the given RESPONSE_TYPE",
  })
  .constant({
    name: "RESPONSE_TYPE",
    values: ["CREATE_TASK_RUN", "TASK_RUN_UNAVAILABLE"] as const,
    description: "Valid values: CREATE_TASK_RUN | TASK_RUN_UNAVAILABLE",
  })
  .comment({
    comment:
      "Follow by one of the possible responses format based on the chosen response type",
  })
  .object({
    name: "RESPONSE_CREATE_TASK_RUN",
    isOptional: true,
    attributes: laml.ProtocolBuilder.new().text({
      name: "task_run_input",
      description:
        "Task inputs specific for the run. ⚠️ Your task_run_input must exclude any input values that are marked as [from Step X]",
    }),
  })
  .object({
    name: "RESPONSE_TASK_RUN_UNAVAILABLE",
    isOptional: true,
    attributes: laml.ProtocolBuilder.new().text({
      name: "explanation",
      description: "Brief reason why you are unable to create a new task run",
    }),
  })
  .build();
