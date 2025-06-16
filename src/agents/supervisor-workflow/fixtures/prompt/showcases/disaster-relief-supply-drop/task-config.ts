import { TaskConfigMinimal } from "@/agents/supervisor-workflow/workflow-composer/task-initializer/task-config-initializer/dto.js";
import agentConfigFixtures from "./agent-config.js";
import { createFixtures, FixtureName } from "../../../base/fixtures.js";
import { addTaskConfigMissingAttrs } from "../../../helpers/add-missing-config-attrs.js";

type AgentType = FixtureName<typeof agentConfigFixtures>;

const ENTRIES = [
  {
    taskType: "analyze_satellite_imagery_for_landing_zones",
    agentType: "landing_zone_imagery_analyst" as const satisfies AgentType,
    taskConfigInput: `{ "areaBoundingBox": "<bounding box coordinates for each island>","maxCloudPercent": <maximum allowed cloud coverage percentage> }`,
    description:
      "Acquire and analyze recent satellite imagery for a given geographic bounding area (e.g., an island), ensuring cloud coverage remains below a specified threshold. Assess terrain suitability for landing or drop zones, annotate candidate areas, and provide visibility or obstruction notes.",
  },
] as const satisfies TaskConfigMinimal[];

export default createFixtures(
  addTaskConfigMissingAttrs(ENTRIES),
  ({ taskType }) => taskType,
);
