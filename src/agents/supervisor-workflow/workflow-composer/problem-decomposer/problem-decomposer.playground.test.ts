/* eslint-disable @typescript-eslint/no-unused-vars */
import { getChatLLM } from "@/helpers/llm.js";
import { Logger } from "beeai-framework";
import { describe, expect, it } from "vitest";
import f1_fixtures from "../../fixtures/__test__/f1-race-prediction/index.js";
import boston_trip_fixtures from "../../fixtures/__test__/boston-trip/index.js";
import flight_prague_madrid from "../../fixtures/__test__/flight-prague-madrid/index.js";
import poetry_song_analysis_fixtures from "../../fixtures/__test__/poetry-song-analysis/index.js";
import disaster_relief_fixtures from "../../fixtures/prompt/showcases/disaster-relief-supply-drop/index.js";
import medieval_charter_fixtures from "../../fixtures/prompt/showcases/medieval-charter-digitisation/index.js";
import micro_grid_fixtures from "../../fixtures/prompt/showcases/micro-grid-load-balancing/index.js";
import smart_farm_fixtures from "../../fixtures/prompt/showcases/smart-farm-harvest-planner/index.js";
import narrative_fusion_fixtures from "../../fixtures/prompt/showcases/narrative-fusion/index.js";
import beekeeping_site_fixtures from "../../fixtures/prompt/showcases/beekeeping-site-analysis/index.js";
import deep_sea_fixtures from "../../fixtures/prompt/showcases/deep-sea-exploration/index.js";
import { ProblemDecomposer } from "./problem-decomposer.js";

const logger = Logger.root.child({ name: "agent-config-tests" });
const llm = getChatLLM("supervisor");
const agentId = "supervisor:boss[1]:1";
const onUpdate = () => ({});

/**
 * !!! WARNING !!!
 * This file is a playground.
 * It contains tests that are not meant to be run as part of the regular test suite.
 * All tests should be marked as `.fails()`.
 */
describe(`Problem Decomposer (Playground)`, () => {
  it(`play`, async () => {
    const fixtures = deep_sea_fixtures; // Choose fixture

    const problemDecomposer = new ProblemDecomposer(
      logger,
      "supervisor:boss[1]:1",
    );

    const request = fixtures.requestHandlerOutput;
    const resp = await problemDecomposer.run(
      {
        data: {
          resources: {
            tools: fixtures.tools.values,
            agents: [],
            tasks: [],
            taskRuns: [],
          },
          request,
        },
        userMessage: request,
      },
      { llm, actingAgentId: agentId, onUpdate },
    );

    expect(resp.type).toEqual('SUCCESS');
  });
});
