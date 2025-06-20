import { AgentAvailableTool } from "@/agents/supervisor/workflow/workflow-composer/task-initializer/agent-config-initializer/dto.js";
import { createFixtures } from "../../../base/fixtures.js";

const ENTRIES = [
  {
    toolName: "demand_forecast_api",
    description: "Predicts 15-min electricity demand per city block.",
    toolInput:
      '{"blockIds":["<string>"],"startISO":"<YYYY-MM-DDThh:mmZ>","periods":<integer>}',
  },
  {
    toolName: "solar_battery_forecast_api",
    description: "Projects rooftop-solar output & battery state of charge.",
    toolInput:
      '{"siteIds":["<string>"],"startISO":"<YYYY-MM-DDThh:mmZ>","periods":<integer>}',
  },
  {
    toolName: "grid_load_optimizer_api",
    description:
      "Optimises inverter set-points under cost & frequency constraints; returns control vectors & KPI report.",
    toolInput:
      '{"demandForecast":[/* … */],"supplyForecast":[/* … */],"objective":"cost","constraints":{"freqDeviationHz":0.2}}',
  },
  {
    toolName: "dispatch_command_api",
    description: "Sends control vectors; returns acknowledgements.",
    toolInput: '{"controlVectors":[/* … */]}',
  },
] as const satisfies AgentAvailableTool[];

export default createFixtures(ENTRIES, ({ toolName }) => toolName);
