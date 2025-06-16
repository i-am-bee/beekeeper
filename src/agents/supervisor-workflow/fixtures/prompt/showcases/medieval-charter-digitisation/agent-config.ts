import { AgentConfigTiny } from "@/agents/supervisor-workflow/workflow-composer/task-initializer/agent-config-initializer/dto.js";
import toolsFixtures from "./tools.js";
import { createFixtures, FixtureName } from "../../../base/fixtures.js";
import { addAgentConfigMissingAttrs } from "../../../helpers/add-missing-config-attrs.js";

type ToolName = FixtureName<typeof toolsFixtures>;

const ENTRIES = [
  {
    agentType: "document_scanner",
    description:
      "This agent scans documents to produce high-resolution images and returns URLs of the scanned images.",
    instructions: `Context: The agent receives a list of document IDs that need to be scanned.
Objective: Use the book-cradle scanner to produce 600 dpi TIFF images for each document ID provided.
Response format: Return a list of URLs pointing to the scanned images, maintaining the order of the input document IDs.`,
    tools: ["hires_scan_api"] as const satisfies ToolName[],
  },
  {
    agentType: "ocr_latin_text_extractor",
    description:
      "This agent extracts text from images using OCR tuned for Latin script and provides the extracted text along with confidence scores.",
    instructions: `Context: The agent receives a list of image URLs and a language hint indicating the text is in Latin script.
Objective: Use the OCR tool to extract text from each image URL provided, ensuring the text is in Latin script.
Response format: Return a list of extracted text snippets with corresponding confidence scores for each image, maintaining the order of the input image URLs.`,
    tools: ["ocr_latin_script_api"] as const satisfies ToolName[],
  },
  {
    agentType: "language_verification",
    description:
      "This agent verifies the language of the provided text snippets and returns the language detection results.",
    instructions: `Context: The agent receives a list of text snippets that need to be verified for their language.
Objective: Use the language detection tool to determine the language of each text snippet provided.
Response format: Return a list of language detection results, including the detected language and confidence score for each text snippet, maintaining the order of the input text snippets.`,
    tools: ["language_detect_api"] as const satisfies ToolName[],
  },
  {
    agentType: "vector_text_ingestor",
    description: `Context: The agent receives a list of document IDs and corresponding verified text that needs to be ingested into a vector search system.
Objective: Use the vector_store_ingest_api to chunk the text into default sizes of 1000 characters, embed the chunks, and store them with provenance tags.
Response format: Return a confirmation of successful loading for each document ID, maintaining the order of the input document IDs.`,
    instructions: `This agent ingests verified text into a vector search system, chunking the text and storing it with provenance tags.`,
    tools: ["vector_store_ingest_api"] as const satisfies ToolName[],
  },
] as const satisfies AgentConfigTiny[];

export default createFixtures(
  addAgentConfigMissingAttrs(ENTRIES),
  ({ agentType }) => agentType,
);
