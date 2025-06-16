import { createFixtures, FixtureName } from "../../../base/fixtures.js";
import {
  createResourceFixtures,
  TaskStepWithVariousResource,
} from "../../../base/resource-fixtures.js";
import toolsFixtures from "./tools.js";
import agentsFixtures from "./agent-config.js";
import tasksFixtures from "./task-config.js";
import taskRunsFixtures from "./task-run.js";
import { TaskStepMapper } from "@/agents/supervisor-workflow/workflow-composer/helpers/task-step/task-step-mapper.js";

type ToolName = FixtureName<typeof toolsFixtures>;

const ENTRIES = [
  {
    no: 1,
    step: "Scan each document to produce high-resolution images",
    ...TaskStepMapper.parseInputOutput(
      `input: document IDs ["doc-latin-001", "doc-latin-002", "doc-latin-003", "doc-latin-004", "doc-latin-005"]; output: URLs of scanned images`,
    ),
    resource: createResourceFixtures(
      {
        type: "tools",
        tools: ["hires_scan_api"] as const satisfies ToolName[],
      },
      {
        type: "agent",
        agent: agentsFixtures.get("document_scanner"),
      },
      {
        type: "task",
        task: tasksFixtures.get("scan_documents_high_res"),
      },
      {
        type: "task_run",
        taskRun: taskRunsFixtures.get("scan_documents_high_res_1"),
      },
    ),
  },
  {
    no: 2,
    step: "Extract text from each scanned image using OCR tuned for Latin script",
    ...TaskStepMapper.parseInputOutput(
      `input: image URLs [from Step 1], language hint "lat"; output: extracted text with confidence scores`,
    ),
    resource: createResourceFixtures(
      {
        type: "tools",
        tools: ["ocr_latin_script_api"] as const satisfies ToolName[],
      },
      {
        type: "agent",
        agent: agentsFixtures.get("ocr_latin_text_extractor"),
      },
      {
        type: "task",
        task: tasksFixtures.get("extract_text_from_images_latin_script"),
      },
      {
        type: "task_run",
        taskRun: taskRunsFixtures.get(
          "extract_text_from_images_latin_script_1",
        ),
      },
    ),
  },
  {
    no: 3,
    step: "Verify the extracted text is in Latin",
    ...TaskStepMapper.parseInputOutput(
      "input: extracted text [from Step 2]; output: language verification results",
    ),
    resource: createResourceFixtures(
      {
        type: "tools",
        tools: ["language_detect_api"] as const satisfies ToolName[],
      },
      {
        type: "agent",
        agent: agentsFixtures.get("language_verification"),
      },
      {
        type: "task",
        task: tasksFixtures.get("verify_language_of_extracted_text"),
      },
      {
        type: "task_run",
        taskRun: taskRunsFixtures.get("verify_language_of_extracted_text_1"),
      },
    ),
  },
  {
    no: 4,
    step: "Load the verified text into the vector search system",
    ...TaskStepMapper.parseInputOutput(
      `input: document IDs ["doc-latin-001", "doc-latin-002", "doc-latin-003", "doc-latin-004", "doc-latin-005"], verified text [from Step 3], chunk size  default 1000; output: confirmation of successful loading`,
    ),
    resource: createResourceFixtures(
      {
        type: "tools",
        tools: ["vector_store_ingest_api"] as const satisfies ToolName[],
      },
      {
        type: "agent",
        agent: agentsFixtures.get("vector_text_ingestor"),
      },
      {
        type: "task",
        task: tasksFixtures.get("load_verified_text_into_vector_search"),
      },
      {
        type: "task_run",
        taskRun: taskRunsFixtures.get(
          "load_verified_text_into_vector_search_1",
        ),
      },
    ),
  },
] as const satisfies TaskStepWithVariousResource[];

const fixtures = createFixtures(ENTRIES, ({ step }) => step);
export default fixtures;
