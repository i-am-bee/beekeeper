import { TaskConfigMinimal } from "@/agents/supervisor/workflow/workflow-composer/task-initializer/task-config-initializer/dto.js";
import agentConfigFixtures from "./agent-config.js";
import { createFixtures, FixtureName } from "../../../base/fixtures.js";
import { addTaskConfigMissingAttrs } from "../../../helpers/add-missing-config-attrs.js";

type AgentType = FixtureName<typeof agentConfigFixtures>;

const ENTRIES = [
  {
    taskType: "scan_documents_high_res",
    agentType: "document_scanner" satisfies AgentType,
    description:
      "Scan each document identified by <document_ids> to produce high-resolution images and return URLs of the scanned images.",
    taskConfigInput: `{"document_ids": ["<document_id>", "..."]}`,
  },
  {
    taskType: "extract_text_from_images_latin_script",
    agentType: "ocr_latin_text_extractor" satisfies AgentType,
    description:
      "Extract text from each image URL provided using OCR tuned for Latin script, ensuring the text is in Latin script. Return the extracted text along with confidence scores for each image.`",
    taskConfigInput: `{"image_urls": ["<image_url>", "..."], "language_hint": "lat"}`,
  },
  {
    taskType: "verify_language_of_extracted_text",
    agentType: "language_verification" satisfies AgentType,
    description:
      "Verify the language of each provided text snippet to ensure it is in Latin script. Return the language detection results, including the detected language and confidence score for each text snippet.",
    taskConfigInput: `{"text_snippets": ["<text_snippet>", "..."]}`,
  },
  {
    taskType: "load_verified_text_into_vector_search",
    agentType: "vector_text_ingestor" satisfies AgentType,
    description:
      "Ingest the provided verified text into a vector search system by chunking the text into default sizes of 1000 characters, embedding the chunks, and storing them with provenance tags. Return a confirmation of successful loading for each document ID.`",
    taskConfigInput: `{"document_ids": ["<document_id>", "..."], "verified_text": ["<verified_text>", "..."], "chunk_size": 1000}`,
  },
] as const satisfies TaskConfigMinimal[];

export default createFixtures(
  addTaskConfigMissingAttrs(ENTRIES),
  ({ taskType }) => taskType,
);
