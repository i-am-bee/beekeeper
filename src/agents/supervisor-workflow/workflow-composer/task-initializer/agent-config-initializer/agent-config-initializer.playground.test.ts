/* eslint-disable @typescript-eslint/no-unused-vars */
import {
  unwrapTaskStepWithAgent,
  unwrapTaskStepWithLLM,
  unwrapTaskStepWithToolsOrLLM,
} from "@/agents/supervisor-workflow/fixtures/helpers/unwrap-task-step.js";
import { getChatLLM } from "@/helpers/llm.js";
import { Logger } from "beeai-framework";
import { describe, expect, it } from "vitest";
import boston_trip_fixtures from "@agents/supervisor-workflow/fixtures/__test__/boston-trip/index.js";
import narrative_fusion_fixtures from "@agents/supervisor-workflow/fixtures/prompt/showcases/narrative-fusion/index.js";
import smart_farm_harvest_fixtures from "@agents/supervisor-workflow/fixtures/prompt/showcases/smart-farm-harvest-planner/index.js";
import micro_grid_fixtures from "@agents/supervisor-workflow/fixtures/prompt/showcases/micro-grid-load-balancing/index.js";
import medieval_charter_fixtures from "@agents/supervisor-workflow/fixtures/prompt/showcases/medieval-charter-digitisation/index.js";
import beekeeping_site_fixtures from "@agents/supervisor-workflow/fixtures/prompt/showcases/beekeeping-site-analysis/index.js";
import deep_sea_fixtures from "@agents/supervisor-workflow/fixtures/prompt/showcases/deep-sea-exploration/index.js";
import asteroid_mining from "@agents/supervisor-workflow/fixtures/prompt/showcases/asteroid-mining-feasibility/index.js";
import feedback_analysis from "@agents/supervisor-workflow/fixtures/prompt/showcases/feedback-sentiment-analysis/index.js";
import { Resources } from "../../helpers/resources/dto.js";
import { TaskStepMapper } from "../../helpers/task-step/task-step-mapper.js";
import { getAgentConfigInitializerTool } from "./__tests__/helpers/mocks.js";
import { SUPERVISOR_AGENT_ID } from "@/agents/supervisor-workflow/__test__/defaults.js";
import { prepareDataForWorkflowStep } from "@/agents/supervisor-workflow/fixtures/helpers/prepare-resources.js";

const logger = Logger.root.child({ name: "agent-config-tests" });
const llm = getChatLLM("supervisor");
const onUpdate = () => ({});
const agentId = SUPERVISOR_AGENT_ID; // Example agent ID, adjust as needed

/**
 * !!! WARNING !!!
 * This file is a playground.
 * It contains tests that are not meant to be run as part of the regular test suite.
 * All tests should be marked as `.fails()`.
 */
describe(`AgentConfigInitializer (Playground)`, () => {
  it(`play`, async () => {
    // Setup playground
    const fixtures = feedback_analysis; // Chose fixture
    const stepNo = 3; // Chose step number (first is 1)

    const agentConfigInitializer = getAgentConfigInitializerTool(
      logger,
      agentId,
    );

    const { resources, previousSteps, taskStep } = prepareDataForWorkflowStep(
      fixtures,
      "agentConfigInitializer",
      stepNo,
    );

    const userMessage = TaskStepMapper.format(taskStep);

    const resp = await agentConfigInitializer.run(
      {
        data: {
          resources,
          previousSteps,
          taskStep,
        },
        userMessage,
      },
      { llm, actingAgentId: agentId, onUpdate },
    );

    expect(resp.type).toEqual("SUCCESS");
  });
});
