import { createFixtures } from "../../base/fixtures.js";
import {
  TaskStepWithVariousResource
} from "../../base/resource-fixtures.js";
import toolsFixtures from "./tools.js";
import agentsFixtures from "./agent-config.js";
import tasksFixtures from "./task-config.js";
import taskRunsFixtures from "./task-run.js";

// type ToolName = FixtureName<typeof toolsFixtures>;

const ENTRIES = [
  
] as const satisfies TaskStepWithVariousResource[];

const fixtures = createFixtures(ENTRIES, ({ step }) => step);
export default fixtures;
