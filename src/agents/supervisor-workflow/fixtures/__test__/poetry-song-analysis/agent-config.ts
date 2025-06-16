import { AgentConfigTiny } from "@/agents/supervisor-workflow/workflow-composer/task-initializer/agent-config-initializer/dto.js";
import { createFixtures } from "../../base/fixtures.js";
import { addAgentConfigMissingAttrs } from "../../helpers/add-missing-config-attrs.js";
// import toolsFixtures from "./tools.js";

// type ToolName = FixtureName<typeof toolsFixtures>;

const ENTRIES = [
  
//   {
//     agentType: "booking_options_compiler",
//     description:
//       "Compiles a list of booking options for flights and hotels that match user criteria, including total price and direct booking links, using LLM capabilities.",
//     instructions: `Context: You are an agent specializing in compiling booking options for flights and hotels. You are activated by an external task and receive options within budget as input. You rely on LLM capabilities to generate a final list of booking options.

// Objective: Use the provided options within budget to compile a list of booking options for flights and hotels. Include total price and direct booking links in the results.

// Response format: List each booking option with its flight details, hotel details, total price, and direct booking links:

// Final Booking Options:
// 1. Flight: [Flight Details 1] — Hotel: [Hotel Details 1] — Total Price: [Total Price 1] — Booking Links: [Flight Booking Link 1, Hotel Booking Link 1]
// 2. Flight: [Flight Details 2] — Hotel: [Hotel Details 2] — Total Price: [Total Price 2] — Booking Links: [Flight Booking Link 2, Hotel Booking Link 2]`,
//     tools: [] as const satisfies ToolName[],
//   },
] as const satisfies AgentConfigTiny[];

export default createFixtures(
  addAgentConfigMissingAttrs(ENTRIES),
  ({ agentType }) => agentType,
);
