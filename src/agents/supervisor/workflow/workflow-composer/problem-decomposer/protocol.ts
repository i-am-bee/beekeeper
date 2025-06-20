import * as laml from "@/laml/index.js";

export const protocol = laml.ProtocolBuilder.new()
  .text({
    name: "RESPONSE_CHOICE_EXPLANATION",
    description:
      "Brief explanation of *why* you selected the given RESPONSE_TYPE",
  })
  .constant({
    name: "RESPONSE_TYPE",
    values: ["STEP_SEQUENCE", "UNSOLVABLE", "MISSING_INPUTS"] as const,
    description: "Valid values: STEP_SEQUENCE | UNSOLVABLE | MISSING_INPUTS",
  })
  .comment({
    comment:
      "Follow by one of the possible responses format based on the chosen response type",
  })
  .object({
    name: "RESPONSE_STEP_SEQUENCE",
    isOptional: true,
    attributes: laml.ProtocolBuilder.new().list({
      name: "step_sequence",
      type: "numbered",
      description: `Ordered list of high-level tasks that collectively achieve the user's goal, each written as "Imperative task description (input: …, output: …) [resource]" where [resource] is exactly one of [task: name], [agent: name], [tools: tool1, …], or [LLM]. If user provides an explicit set of subtasks, map each step 1:1 to those subtasks, combining multiple tools inside a single step if needed.`,
    }),
  })
  .object({
    name: "RESPONSE_UNSOLVABLE",
    isOptional: true,
    attributes: laml.ProtocolBuilder.new().text({
      name: "explanation",
      description:
        "User-facing explanation of why the request cannot be solved.",
    }),
  })
  .object({
    name: "RESPONSE_MISSING_INPUTS",
    isOptional: true,
    attributes: laml.ProtocolBuilder.new().text({
      name: "explanation",
      description:
        "User-facing explanation of clearly identifying missing inputs and suggesting what the user could provide to make it solvable. Include examples where possible.",
    }),
  })
  .build();
