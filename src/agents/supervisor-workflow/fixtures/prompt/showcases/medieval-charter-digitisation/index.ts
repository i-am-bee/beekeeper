import toolsFixtures from "./tools.js";
import agentsFixtures from "./agent-config.js";
import tasksFixtures from "./task-config.js";
import taskStepsFixtures from "./task-step.js";
import taskRunsFixtures from "./task-run.js";
import {
  ChoiceExplanations,
  WorkflowComposeFixture,
} from "../../../base/workflow-compose-fixtures.js";

const title = "Medieval Charter Digitisation and Ingestion";
const prompt =
  "Please scan the following Latin charters — doc-latin-001, doc-latin-002, doc-latin-003, doc-latin-004, and doc-latin-005 — extract their text, verify the language, and load them into our vector search so researchers can query them.";

const choiceExplanations = {
  requestHandler:
    "The request involves multiple steps including scanning, text extraction, language verification, and loading into a vector search system, which requires coordination with other tools and agents.",
  problemDecomposer:
    "The problem is logically consistent and can be solved using the available tools. Each step in the process of scanning, verifying, and loading the documents into the vector search system can be accomplished with the provided tools.",
  steps: [
    {
      no: 1,
      agentConfig: `The task requires scanning documents to produce high-resolution images, which aligns with the capabilities of the \`hires_scan_api\` tool. No existing agent config is available, so a new agent config needs to be created to utilize this tool for the task.`,
      taskConfig:
        "The task requires scanning documents to produce high-resolution images, which aligns with the purpose of the existing agent config for document_scanner. However, there are no existing task configs listed, so I will create a new task config for this purpose.",
      taskRun: `The task config "scan_documents_high_res" exists, and the input can be completed using the non-dependent field "document IDs".`,
    },
    {
      no: 2,
      agentConfig:
        "The task requires extracting text from scanned images using OCR tuned for Latin script, which aligns with the capabilities of the ocr_latin_script_api tool. No existing agent config matches this task, so a new agent config is needed.",
      taskConfig:
        "The task of extracting text from images using OCR tuned for Latin script is not covered by any existing task config. Therefore, a new task config needs to be created to accommodate this requirement.",
      taskRun: `The task config "extract_text_from_images_latin_script" exists, and the input can be completed using the non-dependent field "language hint" provided in the task step.`,
    },
    {
      no: 3,
      agentConfig:
        `The task requires verifying the language of the extracted text using a language detection tool. There is no existing agent config that matches this task, and the available tool \`language_detect_api\` can be used to fulfill this requirement. Therefore, a new agent config needs to be created.`,
      taskConfig: `The task of verifying the language of extracted text is not covered by any existing task configs. The agent type "language_verification" is available, and a new task config can be created for this purpose.`,
      taskRun: `The task config for verifying the language of extracted text exists, and the input can be completed using non-dependent fields.`,
    },
    {
      no: 4,
      agentConfig:
        "The task requires loading verified text into a vector search system using the vector_store_ingest_api. No existing agent config matches this task, and the available tool supports the required functionality, necessitating the creation of a new agent config.",
      taskConfig:
        `The task of loading verified text into a vector search system is not covered by any existing task configs. The agent type \`vector_text_ingestor\` is available, and the task requires creating a new task config to handle the ingestion of text into a vector search system.`,
      taskRun: `TBD`,
    },
  ],
} satisfies ChoiceExplanations;

const requestHandlerOutput = `{
  "requestType": "Document Processing and Integration",
  "primaryGoal": "Process Latin charters for research query integration",
  "parameters": {
    "documents": ["doc-latin-001", "doc-latin-002", "doc-latin-003", "doc-latin-004", "doc-latin-005"],
    "language": "Latin"
  },
  "subTasks": [
    "Scan each document to extract text",
    "Verify the extracted text is in Latin",
    "Load the verified text into the vector search system"
  ],
  "expectedDeliverables": [
    "Text extracted from each document",
    "Confirmation of language verification",
    "Documents loaded into the vector search system for querying"
  ]
}`;

const fixtures = new WorkflowComposeFixture(
  title,
  prompt,
  choiceExplanations,
  requestHandlerOutput,
  taskStepsFixtures,
  toolsFixtures,
  agentsFixtures,
  tasksFixtures,
  taskRunsFixtures,
);

export default fixtures;
