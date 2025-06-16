import { createFixtures } from "../../base/fixtures.js";
import {
  TaskStepWithVariousResource
} from "../../base/resource-fixtures.js";

// type ToolName = FixtureName<typeof toolsFixtures>;

const ENTRIES = [
  
] as const satisfies TaskStepWithVariousResource[];

const fixtures = createFixtures(ENTRIES, ({ step }) => step);
export default fixtures;
