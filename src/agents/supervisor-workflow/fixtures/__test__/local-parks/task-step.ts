import { createFixtures, FixtureName } from "../../base/fixtures.js";
import {
  createResourceFixtures,
  TaskStepWithVariousResource,
} from "../../base/resource-fixtures.js";
import toolsFixtures from "./tools.js";

type ToolName = FixtureName<typeof toolsFixtures>;

const ENTRIES = [
  {
    no: 1,
    step: "Search for parks and nature reserves within a 20 km radius of Kutna Hora",
    inputOutput:
      "input: location, radius; output: list of parks and nature reserves",
    resource: createResourceFixtures({
      tools: ["map_api"] as const satisfies ToolName[],
      type: "tools",
    }),
  },
  {
    no: 2,
    step: "Categorize each identified location by type, such as national park or nature reserve",
    dependencies: [1],
    inputOutput:
      "input: list of parks and nature reserves [from Step 1]; output: categorized list",
    resource: createResourceFixtures({
      type: "llm",
    }),
  },
  {
    no: 3,
    step: "Search the web for each park’s official webpage and immediately extract visiting hours, ticket prices, size, accessibility information, notable features, and any downloadable resources",
    dependencies: [1],
    inputOutput:
      "input: list of parks and nature reserves [from Step 1]; output: enriched details table",
    resource: createResourceFixtures({
      type: "tools",
      tools: ["web_search", "web_page_extract"] as const satisfies ToolName[],
    }),
  },
  {
    no: 4,
    step: "Compile a final list that merges geospatial data, categories, and enriched details, including links to official websites or maps",
    dependencies: [1, 2, 3],
    inputOutput:
      "input: geospatial data [from Step 1], categories [from Step 2], enriched details [from Step 3]; output: comprehensive list with categories, details, and links",
    resource: createResourceFixtures({
      type: "llm",
    }),
  },
] as const satisfies TaskStepWithVariousResource[];

const fixtures = createFixtures(ENTRIES, ({ step }) => step);
export default fixtures;
