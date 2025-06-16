import { createFixtures, FixtureName } from "../../../base/fixtures.js";
import {
  createResourceFixtures,
  TaskStepWithVariousResource,
} from "../../../base/resource-fixtures.js";
import toolsFixtures from "./tools.js";

type ToolName = FixtureName<typeof toolsFixtures>;

const ENTRIES = [
  {
    no: 1,
    step: "Scan the provided Latin charters to produce high-resolution images",
    inputOutput:
      "input: documentSet; output: scanned image URLs and document metadata",
    resource: createResourceFixtures({
      tools: ["hires_scan_api"] as const satisfies ToolName[],
      type: "tools",
    }),
  },
  {
    no: 2,
    step: "Perform OCR on the scanned images to extract machine-readable text",
    dependencies: [1],
    inputOutput:
      "input: scanned image URLs [from Step 1], expectedLanguage; output: OCR text with confidence scores",
    resource: createResourceFixtures({
      tools: ["ocr_latin_script_api"] as const satisfies ToolName[],
      type: "tools",
    }),
  },
  {
    no: 3,
    step: "Detect and verify the language of each OCR’d text chunk to confirm it is Latin",
    dependencies: [2],
    inputOutput:
      "input: OCR text [from Step 2]; output: language verification report",
    resource: createResourceFixtures({
      tools: ["language_detect_api"] as const satisfies ToolName[],
      type: "tools",
    }),
  },
  {
    no: 4,
    step: "Clean and normalize the OCR text by removing encoding issues, noise, and OCR artifacts",
    dependencies: [2, 3],
    inputOutput:
      "input: OCR text [from Step 2], language verification report [from Step 3]; output: cleaned and normalized text",
    resource: createResourceFixtures({
      type: "llm",
    }),
  },
  {
    no: 5,
    step: "Generate vector embeddings from the cleaned text for semantic search",
    dependencies: [4],
    inputOutput:
      "input: cleaned and normalized text [from Step 4]; output: vector embeddings",
    resource: createResourceFixtures({
      type: "llm",
    }),
  },
  {
    no: 6,
    step: "Ingest the vector embeddings and associated document metadata into the target vector database",
    dependencies: [1, 5],
    inputOutput:
      "input: vector embeddings [from Step 5], document metadata [from Step 1], destinationIndex; output: populated vector index",
    resource: createResourceFixtures({
      tools: ["vector_store_ingest_api"] as const satisfies ToolName[],
      type: "tools",
    }),
  },
  {
    no: 7,
    step: "Run sample semantic queries to validate indexing and verify document retrievability",
    dependencies: [1, 6],
    inputOutput:
      "input: populated vector index [from Step 6], document metadata [from Step 1]; output: ingestion validation report",
    resource: createResourceFixtures({
      type: "llm",
    }),
  },
] as const satisfies TaskStepWithVariousResource[];

const fixtures = createFixtures(ENTRIES, ({ step }) => step);
export default fixtures;
