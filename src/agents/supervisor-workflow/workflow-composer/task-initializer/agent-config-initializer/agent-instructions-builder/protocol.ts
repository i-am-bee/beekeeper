import * as laml from "@/laml/index.js";

export const protocol = laml.ProtocolBuilder.new()
  .text({
    name: "INSTRUCTIONS",
    description:
      "Natural language but structured text instructs on how agent should act",
  })
  .build();
