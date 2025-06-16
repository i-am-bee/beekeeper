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
import flight_prague_madrid_fixtures from "@agents/supervisor-workflow/fixtures/__test__/flight-prague-madrid/index.js";
import disaster_relief_supply_fixtures from "@agents/supervisor-workflow/fixtures/prompt/showcases/disaster-relief-supply-drop/index.js";
import narrative_fusion_fixtures from "@agents/supervisor-workflow/fixtures/prompt/showcases/narrative-fusion/index.js";
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
  it.fails(`play`, async () => {
    // Setup playground
    const fixtures = narrative_fusion_fixtures; // Chose fixture
    const stepNo = 2; // Chose step number (first is 1)

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

    if (resp.type !== "SUCCESS") {
      throw new Error(`AgentConfigInitializer failed: ${resp.explanation}`);
    }

    expect(resp).toBe({});
  });
});
