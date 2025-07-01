/* eslint-disable @typescript-eslint/no-unused-vars */
import { getChatLLM } from "@/helpers/llm.js";
import { Logger } from "beeai-framework";
import { describe, expect, it, vi } from "vitest";
import boston_trip_fixtures from "../../fixtures/__test__/boston-trip/index.js";
import f1_fixtures from "../../fixtures/__test__/f1-grand-prix/index.js";
import poetry_song_analysis_fixtures from "../../fixtures/__test__/poetry-song-analysis/index.js";
import medieval_charter_fixtures from "../../fixtures/prompt/showcases/medieval-charter-digitisation/index.js";
import micro_grid_fixtures from "../../fixtures/prompt/showcases/micro-grid-load-balancing/index.js";
import smart_farm_fixtures from "../../fixtures/prompt/showcases/smart-farm-harvest-planner/index.js";
import narrative_fusion_fixtures from "../../fixtures/prompt/showcases/narrative-fusion/index.js";
import beekeeping_site_fixtures from "../../fixtures/prompt/showcases/beekeeping-site-analysis/index.js";
import deep_sea_fixtures from "../../fixtures/prompt/showcases/deep-sea-exploration/index.js";
import asteroid_mining from "../../fixtures/prompt/showcases/asteroid-mining-feasibility/index.js";
import feedback_analysis from "../../fixtures/prompt/showcases/feedback-sentiment-analysis/index.js";
import { ProblemDecomposer } from "./problem-decomposer.js";

vi.mock("@/agents/supervisor/workflow/state/logger.ts", async () => {
  // Pull in the real module so we can re‑export everything else untouched
  const actual = await vi.importActual<
    typeof import("@/agents/supervisor/workflow/state/logger.ts")
  >("@/agents/supervisor/workflow/state/logger.ts");

  // Build *one* shared fake instance
  const fakeLogger = new Proxy<Record<string | symbol, unknown>>(
    {},
    {
      get(target, prop) {
        if (!(prop in target)) {
          target[prop] = vi.fn();
        }
        return target[prop];
      },
    },
  ) as unknown;

  return {
    // Re‑export the original symbols
    ...actual,
    // …then override just the static we need
    SupervisorWorkflowStateLogger: {
      ...actual.SupervisorWorkflowStateLogger,
      getInstance: vi.fn(() => fakeLogger),
    },
  };
});

const logger = Logger.root.child({ name: "agent-config-tests" });
const llm = getChatLLM("supervisor");
const agentId = "supervisor:beekeeper[1]:1";
const onUpdate = () => ({});

/**
 * !!! WARNING !!!
 * This file is a playground.
 * It contains tests that are not meant to be run as part of the regular test suite.
 * All tests should be marked as `.fails()`.
 */
describe(`Problem Decomposer (Playground)`, () => {
  it(`play`, async () => {
    const fixtures = micro_grid_fixtures; // Choose fixture

    const problemDecomposer = new ProblemDecomposer(
      logger,
      "supervisor:beekeeper[1]:1",
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

    expect(resp.type).toEqual("SUCCESS");
  });
});
