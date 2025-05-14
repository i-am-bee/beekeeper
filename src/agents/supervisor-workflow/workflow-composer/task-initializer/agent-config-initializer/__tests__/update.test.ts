// import { PatternBuilder, pb } from "@test/helpers/pattern-builder.js";
// import {
//   EnvComplexity as EC,
//   EnvComplexity,
//   Matrix,
//   PromptDifficulty as PD,
//   PromptDifficulty,
// } from "@test/matrix/matrix.js";
// import { expect } from "vitest";
// import { tool as toolFn, ToolName } from "./__fixtures__/tools.js";
// import { AgentCase, runMatrix } from "./helpers.js";
// import { Matrix2 } from "@test/matrix/matrix2.js";

// /**
//  * ============================================================================
//  *  UPDATE_AGENT_CONFIG · 3 × 3 × 3 TEST-MATRIX
//  * ============================================================================
//  *
//  *  Three axes
//  *  ───────────────────────────────────────────────────────────────────────────
//  *  1. **EnvComplexity** – surrounding “noise” the LLM must parse.
//  *        · STRAIGHTFORWARD – 0 existing configs, ≤ 3 tools, little clutter
//  *        · NOISY           – 1-4 unrelated configs, mid-sized tool palette
//  *        · ENTANGLED       – ≥ 5 configs or overlapping scopes, 8-plus tools
//  *
//  *  2. **Trigger explicitness** – how loudly the user hints that an *existing*
//  *     agent should be *updated* rather than created.
//  *        · DIRECT     – user literally says “update / modify agent X …”
//  *        · IMPLIED    – user’s request overlaps an agent but never names it
//  *        · DISCOVERED – only by inspecting configs can the model infer that a
//  *                       small tweak is enough
//  *
//  *  3. **Modification width** – scope of edits **without** changing purpose.
//  *        · PATCH   – one surgical fix (time, typo)
//  *        · AUGMENT – add/remove ≤ 1 tool *or* inject one new filter line
//  *        · REFINE  – edits across > 1 key field (instructions **and** tools
//  *                    and/or description) while mission remains constant
//  *
//  *  Below are three 3 × 3 tables (one per **EnvComplexity**) that map
//  *  *Trigger explicitness* (rows) × *Modification width* (columns).
//  *  Each cell states the cue *and* a shorthand of what the test should assert.
//  *
//  * ───────────────────────────────────────────────────────────────────────────
//  *  STRAIGHTFORWARD ENVIRONMENT  – 0 cfg, ≤ 3 tools, minimal clutter
//  * ───────────────────────────────────────────────────────────────────────────
//  * | Explicitness · Lvl | Trigger cue example                   | PATCH – tiny fix      | AUGMENT – 1 tool / filter  | REFINE – multi-field edit   |
//  * |--------------------|---------------------------------------|-----------------------|-----------------------------|-----------------------------|
//  * | DIRECT (L-1)       | “Update *flight_tracker_daily* …”     | schedule/typo fixed   | add *google_search*         | broaden crypto tracker text |
//  * | IMPLIED (L-2)      | “Crypto tracker ping at noon?”        | reschedule            | add Osaka route filter      | tweak weekend digest scope  |
//  * | DISCOVERED (L-3)   | Model spots patch opportunity         | sunrise via weather   | BTC 5 % / 30 min param      | AI & robotics digest revamp |
//  *
//  * ───────────────────────────────────────────────────────────────────────────
//  *  NOISY ENVIRONMENT  – 1-4 cfgs around, mid tool list
//  * ───────────────────────────────────────────────────────────────────────────
//  * | Explicitness · Lvl | Trigger cue example                   | PATCH – tiny fix      | AUGMENT – 1 tool / filter  | REFINE – multi-field edit   |
//  * |--------------------|---------------------------------------|-----------------------|-----------------------------|-----------------------------|
//  * | DIRECT (L-1)       | “Shift weekend digest to 09 h.”        | time patched          | + news source               | description + filter tweak  |
//  * | IMPLIED (L-2)      | User hints but not name agent         | param patch           | add podcast merge           | add Monday holidays & text  |
//  * | DISCOVERED (L-3)   | Model chooses update vs. create       | minor instr swap      | add alert window param      | overhaul instructions + desc|
//  *
//  * ───────────────────────────────────────────────────────────────────────────
//  *  ENTANGLED ENVIRONMENT  – ≥ 5 cfgs, ≥ 8 tools, dense overlap
//  * ───────────────────────────────────────────────────────────────────────────
//  * | Explicitness · Lvl | Trigger cue example                   | PATCH – tiny fix      | AUGMENT – 1 tool / filter  | REFINE – multi-field edit   |
//  * |--------------------|---------------------------------------|-----------------------|-----------------------------|-----------------------------|
//  * | DIRECT (L-1)       | “Correct typo in *arxiv_rl_daily*.”    | typo fixed            | + podcast_search            | + arxiv + wording overhaul  |
//  * | IMPLIED (L-2)      | Overlap obvious, not named            | extend headline window| add SEC filter tool         | merge filings & news digest |
//  * | DISCOVERED (L-3)   | Model infers tweak best               | param patch only      | add geo filter & tool       | tools + instr + desc all ok |
//  * ───────────────────────────────────────────────────────────────────────────
//  *
//  *  **Test coverage rule:** create one minimal assertion per cell (27 total).
//  *  All tests must validate:
//  *    • `RESPONSE_TYPE === "UPDATE_AGENT_CONFIG"`
//  *    • Correct `agent_type` chosen
//  *    • Only intended fields edited; purpose unchanged
//  */

// export const m = new Matrix2<AgentCase>([
//   {
//     name: "EnvComplexity",
//     description: "surrounding “noise” the LLM must parse",
//     values: [
//       {
//         name: "STRAIGHTFORWARD",
//         description: "0 existing configs, ≤ 3 tools, little clutter",
//       },
//       {
//         name: "NOISY",
//         description: "1-4 unrelated configs, mid-sized tool palette",
//       },
//       {
//         name: "ENTANGLED",
//         description: "≥ 5 configs or overlapping scopes, 8-plus tools plus larger tool palette (“dense ecosystem”)",
//       },
//     ],
//   },
//   {
//     name: "PromptDifficulty",
//     description: "how much *reasoning* is buried in the user prompt",
//     values: [
//       {
//         name: "L1",
//         description: "one clear action, one obvious tool/constraint",
//       },
//       {
//         name: "L2",
//         description: "either must *ignore noise* OR must weave **two** constraints/tools",
//       },
//       {
//         name: "L3",
//         description: "≥ two filters **and** they must be echoed verbatim in the created instructions (nested / implicit logic allowed)",
//       },
//     ],
//   },
// ]);

// const testCases: {
//   ec: EnvComplexity;
//   pd: PromptDifficulty;
//   input: string;
//   availableTools: string[];
//   expected: {
//     agent_type: PatternBuilder;
//     tools: ToolName[];
//     instructions: PatternBuilder;
//   };
// }[] = [
//   /* ─────────────────────────── DIRECT ─────────────────────────── */
//   {
//     /* DIRECT · PATCH  ─ “Move alerts to 08:00” */
//     ec: EC.STRAIGHTFORWARD,
//     pd: PD.L1,
//     input: "Move my flight_tracker_daily alerts to 08:00 every morning.",
//     availableTools: ["flight_price_tracker"],
//     expected: {
//       agent_type: pb().alt("flight", "tracker"),
//       tools: ["flight_price_tracker"],
//       instructions: pb().time(8),
//     },
//   },
//   {
//     /* DIRECT · AUGMENT ─ add google_search for opening hours */
//     ec: EC.STRAIGHTFORWARD,
//     pd: PD.L2,
//     input:
//       "Please update the historical_sites_search agent to also use google_search so it can include opening hours.",
//     availableTools: ["google_search", "historical_sites_search_api"],
//     expected: {
//       agent_type: pb().alt("historical", "sites"),
//       tools: ["google_search", "historical_sites_search_api"],
//       instructions: pb().alt("opening hours", "hours"),
//     },
//   },
//   {
//     /* DIRECT · REFINE ─ broaden to ADA + tweak wording */
//     ec: EC.STRAIGHTFORWARD,
//     pd: PD.L3,
//     input:
//       "Expand the crypto_price_tracker_hourly agent to track ADA as well and update its description accordingly.",
//     availableTools: ["crypto_price_feed"],
//     expected: {
//       agent_type: pb().alt("crypto", "price"),
//       tools: ["crypto_price_feed"],
//       instructions: pb().alt("ADA", "Cardano"),
//     },
//   },

//   /* ─────────────────────────── IMPLIED ────────────────────────── */
//   {
//     /* IMPLIED · PATCH ─ change send-time to 09:00 */
//     ec: EC.NOISY,
//     pd: PD.L1,
//     input:
//       "Could the family weekend events digest arrive at 09:00 on Thursdays instead?",
//     availableTools: ["city_events_search"],
//     expected: {
//       agent_type: pb().alt("city", "events"),
//       tools: ["city_events_search"],
//       instructions: pb().time(9),
//     },
//   },
//   {
//     /* IMPLIED · AUGMENT ─ add news headline check for sales */
//     ec: EC.NOISY,
//     pd: PD.L2,
//     input:
//       "I'd like the weekly flight-deal monitor to pull any news articles about airline sales that could affect prices.",
//     availableTools: ["flight_price_tracker", "news_search"],
//     expected: {
//       agent_type: pb().alt("flight", "price"),
//       tools: ["flight_price_tracker", "news_search"],
//       instructions: pb().alt("news", "sale"),
//     },
//   },
//   {
//     /* IMPLIED · REFINE ─ include Monday holidays in weekend digest */
//     ec: EC.NOISY,
//     pd: PD.L3,
//     input:
//       "Please include Monday public-holiday events in my weekend family events digest and update the description to reflect that.",
//     availableTools: ["city_events_search"],
//     expected: {
//       agent_type: pb().alt("city", "events"),
//       tools: ["city_events_search"],
//       instructions: pb().alt("Monday", "public"),
//     },
//   },

//   /* ────────────────────────── DISCOVERED ───────────────────────── */
//   {
//     /* DISCOVERED · PATCH ─ extend headline window to 48 h */
//     ec: EC.ENTANGLED,
//     pd: PD.L1,
//     input:
//       "I need a headline collector that grabs articles from the last 48 hours.",
//     availableTools: ["news_search"],
//     expected: {
//       agent_type: pb().alt("news", "headlines"),
//       tools: ["news_search"],
//       instructions: pb().alt("48"),
//     },
//   },
//   {
//     /* DISCOVERED · AUGMENT ─ tighter BTC alert (5 % in 30 min) */
//     ec: EC.ENTANGLED,
//     pd: PD.L2,
//     input:
//       "Send a one-liner when Bitcoin moves at least 5 % within half an hour.",
//     availableTools: ["crypto_price_feed"],
//     expected: {
//       agent_type: pb().alt("crypto", "price"),
//       tools: ["crypto_price_feed"],
//       instructions: pb().alt("5", "30"),
//     },
//   },
//   {
//     /* DISCOVERED · REFINE ─ AI-&-robotics digest with arXiv on Fridays */
//     ec: EC.ENTANGLED,
//     pd: PD.L3,
//     input:
//       "Monitor AI and robotics podcasts and arXiv papers every Friday and send me a digest.",
//     availableTools: ["arxiv_search", "podcast_search"],
//     expected: {
//       agent_type: pb().alt("podcast", "ai"),
//       tools: ["arxiv_search", "podcast_search"],
//       instructions: pb().all("robotics", pb().alt("arxiv", "arXiv")),
//     },
//   },
// ];

// // for (const {
// //   ec,
// //   pd,
// //   input,
// //   expected: { tools, agent_type, instructions },
// // } of testCases) {
// //     m.addCase({},{} as any)
// // //   m.addCase(ec, pd, {
// // //     input,
// // //     expected: {
// // //       RESPONSE_TYPE: "UPDATE_AGENT_CONFIG" as const,
// // //       RESPONSE_UPDATE_AGENT_CONFIG: {
// // //         agent_type: expect.any(String),
// // //         description: expect.any(String),
// // //         instructions: expect.any(String),
// // //         tools: expect.arrayContaining(tools),
// // //       },
// // //     },
// // //     meta: { availableTools: tools.map((tool) => toolFn(tool)) },
// // //     assert: (parsed) => {
// // //       expect(parsed.RESPONSE_UPDATE_AGENT_CONFIG.agent_type).toMatchPattern(
// // //         agent_type,
// // //       );
// // //       expect(parsed.RESPONSE_UPDATE_AGENT_CONFIG.instructions).toMatchPattern(
// // //         instructions,
// // //       );
// // //     },
// // //   });
// // }

// // /* kick off the generator */
// // runMatrix(m);
