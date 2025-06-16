import toolsFixtures from "./tools.js";
import agentsFixtures from "./agent-config.js";
import tasksFixtures from "./task-config.js";
import taskStepsFixtures from "./task-step.js";
import {
  ChoiceExplanations,
  WorkflowComposeFixture,
} from "../../../base/workflow-compose-fixtures.js";

const title = "Medieval Charter Digitisation and Ingestion";
const prompt =
  "Please scan these Latin charters, extract the text, verify the language, and load them into our vector search so researchers can query them.";

const choiceExplanations = {
  requestHandler:
    "The task requires OCR, language verification, embedding generation, and database ingestion—multiple coordinated steps best handled by a downstream planner.",
  problemDecomposer: "All required steps to digitize, OCR, verify, normalize, embed, and ingest Latin charters are achievable using the provided tools. Each task can be mapped to a tool with valid input/output parameters, and no step is blocked by missing resources.",
} satisfies ChoiceExplanations;

const requestHandlerOutput = `{
  "requestType": "document_ingestion",
  "primaryGoal": "Digitize Latin charters and make them searchable via the organization’s vector database",
  "userParameters": {
    "documentSet": "User-supplied Latin charters",
    "expectedLanguage": "Latin",
    "destinationIndex": "research_vector_index"
  },
  "requiredComponents": [
    "scan or ingest provided charter images/PDFs",
    "perform OCR to extract machine-readable text",
    "detect and verify language for each text chunk",
    "clean/normalize text (encoding, noise removal)",
    "generate vector embeddings with chosen model",
    "ingest embeddings and metadata into target vector DB",
    "run sample queries to validate ingestion"
  ],
  "expectedDeliverables": "OCR text files, verified language report, populated vector index, and brief ingestion/validation summary"
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
);

export default fixtures;
