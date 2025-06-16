import * as laml from "@/laml/index.js";

export const protocol = laml.ProtocolBuilder.new()
  .text({
    name: "RESPONSE_CHOICE_EXPLANATION",
    description:
      "Brief explanation of *why* you selected the given RESPONSE_TYPE",
  })
  .constant({
    name: "RESPONSE_TYPE",
    values: ["DIRECT_ANSWER", "CLARIFICATION", "PASS_TO_PLANNER"] as const,
    description:
      "Valid values: DIRECT_ANSWER | CLARIFICATION | PASS_TO_PLANNER",
  })
  .comment({
    comment:
      "Follow by one of the possible responses format based on the chosen response type",
  })
  .text({
    name: "RESPONSE_DIRECT_ANSWER",
    isOptional: true,
    description: "Answer to the user",
  })
  .text({
    name: "RESPONSE_CLARIFICATION",
    isOptional: true,
    description: "Prompt the user for missing or clearer input",
  })
  .text({
    name: "RESPONSE_PASS_TO_PLANNER",
    isOptional: true,
    description:
      "A structured object captures the interpreted intent, goals, parameters, and expected deliverables of the user’s task request.",
  })
  .build();
