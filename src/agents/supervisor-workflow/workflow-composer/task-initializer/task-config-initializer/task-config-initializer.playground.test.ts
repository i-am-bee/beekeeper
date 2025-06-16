/* eslint-disable @typescript-eslint/no-unused-vars */
import { SUPERVISOR_AGENT_ID } from "@/agents/supervisor-workflow/__test__/defaults.js";
import {
  unwrapTaskStepWithAgent,
  unwrapTaskStepWithTask,
} from "@/agents/supervisor-workflow/fixtures/helpers/unwrap-task-step.js";
import { getChatLLM } from "@/helpers/llm.js";
import { Logger } from "beeai-framework";
import { describe, expect, it } from "vitest";
import disaster_relief_supply_fixtures from "@agents/supervisor-workflow/fixtures/prompt/showcases/disaster-relief-supply-drop/index.js";
import narrative_fusion_fixtures from "@agents/supervisor-workflow/fixtures/prompt/showcases/narrative-fusion/index.js";
import smart_farm_harvest_fixtures from "@agents/supervisor-workflow/fixtures/prompt/showcases/smart-farm-harvest-planner/index.js";
import micro_grid_fixtures from "@agents/supervisor-workflow/fixtures/prompt/showcases/micro-grid-load-balancing/index.js";
import { Resources } from "../../helpers/resources/dto.js";
import { TaskStepMapper } from "../../helpers/task-step/task-step-mapper.js";
import { getTaskConfigInitializerTool } from "./__tests__/helpers/mocks.js";
import { prepareDataForWorkflowStep } from "@/agents/supervisor-workflow/fixtures/helpers/prepare-resources.js";

const logger = Logger.root.child({ name: "agent-config-tests" });
const llm = getChatLLM("supervisor");
const agentId = SUPERVISOR_AGENT_ID;
const onUpdate = () => ({});

/**
 * !!! WARNING !!!
 * This file is a playground.
 * It contains tests that are not meant to be run as part of the regular test suite.
 * All tests should be marked as `.fails()`.
 */
describe("TaskConfigInitializer (Playground)", () => {
  it.fails(`play`, async () => {
    // Setup playground
    const fixtures = micro_grid_fixtures; // Chose fixture
    const stepNo = 1; // Chose step number (first is 1)

    const taskConfigInitializer = getTaskConfigInitializerTool(logger, agentId);

    const { resources, previousSteps, taskStep } = prepareDataForWorkflowStep(
      fixtures,
      "taskConfigInitializer",
      stepNo,
    );

    const userMessage = TaskStepMapper.format(taskStep);

    const resp = await taskConfigInitializer.run(
      {
        data: {
          resources,
          previousSteps,
          taskStep,
          actingAgentId: agentId,
        },
        userMessage,
      },
      { llm, actingAgentId: agentId, onUpdate },
    );

    expect(resp).toBe({});
  });
});
