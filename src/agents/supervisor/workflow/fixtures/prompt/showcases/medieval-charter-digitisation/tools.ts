import { AgentAvailableTool } from "@/agents/supervisor/workflow/workflow-composer/task-initializer/agent-config-initializer/dto.js";
import { createFixtures } from "../../../base/fixtures.js";

const ENTRIES = [
  {
    toolName: "hires_scan_api",
    description:
      "Produces 600 dpi TIFFs from book-cradle scanner, returning URLs & metadata.",
    toolInput: '{"documentIds":["<string>"],"resolutionDPI":<integer>}',
  },
  {
    toolName: "ocr_latin_script_api",
    description:
      "OCR tuned for Gothic/Caroline Latin; returns text + confidence.",
    toolInput: '{"imageUrl":"<string>","languageHint":"lat"}',
  },
  {
    toolName: "language_detect_api",
    description:
      "Detects language(s) in text snippets; returns ISO code & confidence.",
    toolInput: '{"text":"<string>"}',
  },
  {
    toolName: "vector_store_ingest_api",
    description: "Chunks text, embeds, and stores with provenance tags.",
    toolInput:
      '{"documentId":"<string>","text":"<string>","chunkSize":<integer>}',
  },
] as const satisfies AgentAvailableTool[];

export default createFixtures(ENTRIES, ({ toolName }) => toolName);
