import * as laml from "@/laml/index.js";

export const protocol = laml.ProtocolBuilder.new()
  .text({
    name: "RESPONSE_CHOICE_EXPLANATION",
    description:
      "Brief explanation of *why* you selected the given RESPONSE_TYPE",
  })
  .constant({
    name: "RESPONSE_TYPE",
    values: ["STEP_SEQUENCE", "UNSOLVABLE"] as const,
    description: "Valid values: STEP_SEQUENCE | UNSOLVABLE",
  })
  .comment({
    comment:
      "Follow by one of the possible responses format based on the chosen response type",
  })
  .object({
    name: "RESPONSE_STEP_SEQUENCE",
    isOptional: true,
    attributes: laml.ProtocolBuilder.new()
      .list({
        name: "step_sequence",
        type: "numbered",
        description:
          "Ordered list of high-level tasks that collectively achieve the user's goal. Each step must include necessary inputs, whether it uses a tool or agent, and any dependencies on previous steps.",
      })
  })
  .object({
    name: "RESPONSE_UNSOLVABLE",
    isOptional: true,
    attributes: laml.ProtocolBuilder.new().text({
      name: "explanation",
      description: "Brief reason why you are unable to create a step sequence",
    }),
  })
  .build();
