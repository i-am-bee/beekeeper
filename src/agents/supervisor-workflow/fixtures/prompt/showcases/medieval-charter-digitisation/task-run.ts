import { TaskRunMinimal } from "@/agents/supervisor-workflow/workflow-composer/task-run-initializer/dto.js";
import { createFixtures, FixtureName } from "../../../base/fixtures.js";
import { addTaskRunMissingAttrs } from "../../../helpers/add-missing-config-attrs.js";
import taskConfigFixtures from "./task-config.js";

type TaskType = FixtureName<typeof taskConfigFixtures>;

const ENTRIES = [
  {
    taskType: "scan_documents_high_res" satisfies TaskType,
    taskRunInput: `{"document_ids": ["doc-latin-001", "doc-latin-002", "doc-latin-003", "doc-latin-004", "doc-latin-005"]}`,
    taskRunNum: 1,
  },
  {
    taskType: "extract_text_from_images_latin_script" satisfies TaskType,
    taskRunInput: `{"language_hint": "lat"}`,
    taskRunNum: 1,
  },
  {
    taskType: "verify_language_of_extracted_text" satisfies TaskType,
    taskRunInput: ``,
    taskRunNum: 1,
  },
  {
    taskType: "load_verified_text_into_vector_search" satisfies TaskType,
    taskRunInput: `{ "document_ids": ["doc-latin-001", "doc-latin-002", "doc-latin-003", "doc-latin-004", "doc-latin-005"], "chunk_size": 1000  }`,
    taskRunNum: 1,
  },
] as const satisfies TaskRunMinimal[];

export default createFixtures(
  addTaskRunMissingAttrs(ENTRIES),
  ({ taskType, taskRunNum }) => `${taskType}_${taskRunNum}`,
);
