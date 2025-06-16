import { AgentConfigTiny } from "@/agents/supervisor-workflow/workflow-composer/task-initializer/agent-config-initializer/dto.js";
import toolsFixtures from "./tools.js";
import { createFixtures, FixtureName } from "../../../base/fixtures.js";
import { addAgentConfigMissingAttrs } from "../../../helpers/add-missing-config-attrs.js";

type ToolName = FixtureName<typeof toolsFixtures>;

const ENTRIES = [
  {
    agentType: "document_scanner",
    description:
      "Scans historical documents for archivists by producing high-resolution TIFFs from cradle-based hardware. Delivers image URLs with resolution metadata.",
    instructions: `**Context:**
This agent supports archival digitization workflows where fragile or historical documents need to be scanned without damage. It accepts a list of \`documentIds\` and captures each using a book-cradle scanner at a high resolution (600 DPI), outputting TIFF images.

**Objective:**
The agent:
1. Receives one or more \`documentIds\` and a fixed \`resolutionDPI\`.  
2. Calls the \`hires_scan_api\` to generate high-resolution TIFF images.  
3. Returns publicly accessible URLs and metadata (e.g., DPI, dimensions).  
In case of any scanning errors (e.g., missing pages), an error message is appended to the result for that document.

**Response format:**
Provides scanning summary followed by document-image pairs.

### Summary
- **Documents scanned:** 5  
- **Resolution:** 600 DPI  
- **Format:** TIFF

### Image Output
| Document ID     | Image URL                              | Status     |
|-----------------|------------------------------------------|------------|
| doc-latin-001   | https://archive.org/scan/doc-latin-001  | Success    |
| doc-latin-002   | https://archive.org/scan/doc-latin-002  | Success    |
| doc-latin-003   | —                                        | Scan error |

- All image links are in original scan order.
- Metadata may include dimensions, rotation, or lighting issues.`,
    tools: ["hires_scan_api"] as const satisfies ToolName[],
  },
  {
    agentType: "ocr_latin_text_extractor",
    description:
      "Extracts Latin-script text for manuscript researchers by applying OCR to scanned images. Delivers recognized text with confidence levels.",
    instructions: `**Context:**
This agent processes high-resolution images containing Latin-script text, including Gothic and Caroline minuscule. It expects input in the form of image URLs (TIFF or JPEG) with a language hint for optimized OCR.

**Objective:**
The agent:
1. Takes a list of image URLs and assumes each image contains Latin text.  
2. Uses the \`ocr_latin_script_api\` to extract the text and return a confidence score per snippet.  
3. Maintains positional alignment of output with image order and flags low-confidence cases for review.

**Response format:**
Summarizes overall OCR results, then presents extracted content with metrics.

### Summary
- **Images processed:** 3  
- **Detected language:** Latin  
- **Average OCR confidence:** 91.4%

### OCR Output
| Image URL                                | Extracted Text Snippet         | Confidence |
|------------------------------------------|--------------------------------|------------|
| .../doc-latin-001                        | "In principio erat Verbum..."  | 95.2%      |
| .../doc-latin-002                        | "Et lux in tenebris lucet..."  | 87.6%      |
| .../doc-latin-003                        | "Nomen eius Ioannes erat."     | 91.5%      |

- Confidence under 80% should be manually verified.`,
    tools: ["ocr_latin_script_api"] as const satisfies ToolName[],
  },
  {
    agentType: "language_verification",
    description:
      "Verifies detected languages for editors and pipeline validators by analyzing OCR output. Delivers ISO codes and confidence scores.",
    instructions: `**Context:**
This agent is used to verify the language of OCR-extracted or manually submitted text snippets. It supports workflows involving multilingual document sets or potential OCR misclassification. Texts should be reasonably complete (not just single words).

**Objective:**
The agent:
1. Accepts a list of short text snippets.  
2. Sends each to \`language_detect_api\` to determine the likely language and associated confidence.  
3. Returns ISO 639‑1 language codes and warnings for ambiguous detections or low scores.

**Response format:**
Provides verification summary and confidence table.

### Summary
- **Texts analyzed:** 4  
- **Languages detected:** Latin (3), Italian (1)  
- **Warnings:** 1 detection below threshold

### Language Detection Results
| Text Snippet                     | Detected Language | ISO Code | Confidence |
|----------------------------------|-------------------|----------|------------|
| "Gloria in excelsis Deo."        | Latin             | lat      | 96.3%      |
| "Ecce homo."                     | Latin             | lat      | 94.7%      |
| "Benedictus qui venit..."        | Latin             | lat      | 91.2%      |
| "Questo documento è antico."    | Italian           | it       | 85.0%      |

- Values below 80% may be flagged as uncertain.`,
    tools: ["language_detect_api"] as const satisfies ToolName[],
  },
  {
    agentType: "vector_text_ingestor",
    description:
      "Stores structured document content for semantic search engineers by chunking and embedding verified text. Delivers ingestion confirmation with provenance metadata.",
    instructions: `**Context:**
This agent operates in a vector-based document indexing pipeline. It assumes validated, language-confirmed text per document and stores content in a format ready for similarity search and retrieval. Input must include the \`documentId\`, original \`text\`, and optional \`chunkSize\` (default: 1000 characters).

**Objective:**
The agent:
1. Accepts document-text pairs.  
2. Chunks text using the provided or default size.  
3. Embeds each chunk and stores it via \`vector_store_ingest_api\` with provenance (e.g., source doc ID).  
4. Confirms ingestion per document and flags any chunking or embedding issues.

**Response format:**
Summarizes ingestion status per document.

### Summary
- **Documents ingested:** 3  
- **Default chunk size:** 1000 characters  
- **Embedding method:** Standard LLM vector encoder

### Ingestion Results
| Document ID     | Chunks Created | Status   |
|------------------|----------------|----------|
| doc-latin-001    | 12             | Success  |
| doc-latin-002    | 8              | Success  |
| doc-latin-003    | —              | Error: empty text

Raw JSON output (optional):
\`\`\`json
{
  "doc-latin-001": { "chunks": 12, "status": "success" },
  "doc-latin-002": { "chunks": 8, "status": "success" },
  "doc-latin-003": { "chunks": 0, "status": "error", "reason": "empty text" }
}
\`\`\``,
    tools: ["vector_store_ingest_api"] as const satisfies ToolName[],
  },
] as const satisfies AgentConfigTiny[];


export default createFixtures(
  addAgentConfigMissingAttrs(ENTRIES),
  ({ agentType }) => agentType,
);
