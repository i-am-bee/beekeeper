import { PatternBuilder, pb } from "@test/helpers/pattern-builder.js";
import { expect } from "vitest";
import { tool as toolFn, ToolName } from "./__fixtures__/tools.js";
import { AgentCase, runMatrix } from "./helpers.js";
import { Dimension, DimensionValues, Matrix } from "@test/matrix/matrix.js";

/**
 * ============================================================================
 *  CREATE_AGENT_CONFIG · 3 × 3 TEST-MATRIX
 * ============================================================================
 *
 *  Two axes
 *  ───────────────────────────────────────────────────────────────────────────
 *  1.  EnvComplexity   – how much *context clutter* the model must sift
 *     ─ STRAIGHTFORWARD : 0 existing configs, minimal tool list
 *     ─ NOISY           : 1-4 unrelated configs (“some clutter”)
 *     ─ ENTANGLED       : ≥5 configs *or* overlapping / near-match configs
 *                         plus larger tool palette (“dense ecosystem”)
 *
 *  2.  PromptDifficulty – how much *reasoning* is buried in the user prompt
 *     ─ EASY      : one clear action, one obvious tool/constraint
 *     ─ NORMAL    : either must *ignore noise* OR must weave **two** constraints/tools
 *     ─ HARD      : ≥ two filters **and** they must be echoed verbatim in the created
 *                        instructions (nested / implicit logic allowed)
 *
 *  Every test-case is dropped into one cell  ⟶  matrix.validate()
 *  will fail CI if any of the nine cells is left empty.
 *
 *  Cell cheat-sheet
 * ──────────────────────────────────────────────────────────────────────────────────────────────────
 * | Env · Prompt             | Environment clutter              | Prompt cognitive load | Assert   |
 * |--------------------------|----------------------------------|-----------------------|----------|
 * | STRAIGHTFORWARD · EASY   | 0 cfg, 1 tool                    | 1 clear action        | correct  |
 * |                          |                                  | (e.g. “get headlines”)| tool +   |
 * |                          |                                  |                       | boiler   |
 * |--------------------------|----------------------------------|-----------------------|----------|
 * | STRAIGHTFORWARD · NORMAL | 0 cfg, 2-3 tools (1 fits)        | +1 simple filter      | noise    |
 * |                          |                                  | (date-range OR geo)   | ignored  |
 * |--------------------------|----------------------------------|-----------------------|----------|
 * | STRAIGHTFORWARD · HARD   | 0 cfg, ≤5 tools                  | ≥2 filters or         | every    |
 * |                          |                                  | multi-step wording    | filter   |
 * |                          |                                  | (“geo + price cap…”)  | echoed   |
 * |==========================|==================================|=======================|==========|
 * | NOISY · EASY             | 1 unrelated cfg, 2-3 tools       | 1 clear action        | CREATE   |
 * |--------------------------|----------------------------------|-----------------------|----------|
 * | NOISY · NORMAL           | 1-2 cfg, 3-4 tools (2 relevant)  | fuse 2 sources        | both     |
 * |                          |                                  | (“news + podcast”)    | tools    |
 * |--------------------------|----------------------------------|-----------------------|----------|
 * | NOISY · HARD             | ≥3 cfg, 5-6 tools                | multi-filter ask      | desc.    |
 * |                          | (one loosely related)            |                       | covers   |
 * |==========================|==================================|=======================|==========|
 * | ENTANGLED · EASY         | many cfgs, 5-8 tools (2 OK)      | vague domain wording  | right    |
 * |--------------------------|----------------------------------|-----------------------|----------|
 * | ENTANGLED · NORMAL       | 8-10 tools (3 OK), overlap cfgs  | conditional /         | CREATE + |
 * |                          |                                  | cross-domain fusion   | orch.    |
 * |--------------------------|----------------------------------|-----------------------|----------|
 * | ENTANGLED · HARD         | 10+ tools, dense cfg influence   | nested implicit ask   | only &   |
 * |                          |                                  | (“fear-and-greed…”)   | all tools|
 * ──────────────────────────────────────────────────────────────────────────────────────────────────
 */

const dimensions = [
  {
    name: "EnvComplexity",
    values: [
      {
        name: "STRAIGHTFORWARD",
      },
      {
        name: "NOISY",
      },
      {
        name: "ENTANGLED",
      },
    ],
  },
  {
    name: "PromptDifficulty",
    values: [
      {
        name: "EASY",
      },
      {
        name: "NORMAL",
      },
      {
        name: "HARD",
      },
    ],
  },
] as const satisfies Dimension[];

export const m = new Matrix<typeof dimensions, AgentCase>(dimensions);

const testCases: {
  ec: DimensionValues<(typeof dimensions)[0]>;
  pd: DimensionValues<(typeof dimensions)[1]>;
  input: string;
  availableTools: string[];
  expected: {
    agent_type: PatternBuilder;
    tools: ToolName[];
    instructions: PatternBuilder;
  };
}[] = [
  /* ───────────────────────── STRAIGHTFORWARD ─────────────────────────── */
  {
    ec: "STRAIGHTFORWARD",
    pd: "EASY",
    input:
      "Create a Spanish word‑of‑the‑day exercise with a short quiz every morning at 7 AM local time.",
    availableTools: ["phrase_generator"],
    expected: {
      agent_type: pb().alt("spanish", "word"),
      tools: ["phrase_generator"],
      instructions: pb().time(7),
    },
  },
  {
    ec: "STRAIGHTFORWARD",
    pd: "NORMAL",
    input: "Give me a list of today's European tech‑startup headlines.",
    availableTools: ["news_search", "movie_db_search", "google_search"],
    expected: {
      agent_type: pb().alt("tech", "news"),
      tools: ["news_search"],
      instructions: pb().alt("europe", "today"),
    },
  },
  {
    ec: "STRAIGHTFORWARD",
    pd: "HARD",
    input:
      "Each Friday summarise renewable‑energy 10‑K filings from the last month that mention ‘carbon credits’ and return only companies with market cap under $2 B before noon.",
    availableTools: [
      "sec_filings_search",
      "news_search",
      "google_search",
      "crypto_price_feed",
      "movie_db_search",
    ],
    expected: {
      agent_type: pb().alt("renewable", "filings", "10k", "summarizer"),
      tools: ["sec_filings_search"],
      instructions: pb()
        .alt("carbon credits")
        .alt("under", "below")
        .alt("$2 B", "$2 billion"),
    },
  },

  /* ───────────────────────────── NOISY ───────────────────────────────── */
  {
    ec: "NOISY",
    pd: "EASY",
    input: "Generate a daily motivational quote at 8 AM.",
    availableTools: ["phrase_generator", "news_search", "weather_alert_feed"],
    expected: {
      agent_type: pb().alt("motivation", "quote"),
      tools: ["phrase_generator"],
      instructions: pb().time(8),
    },
  },
  {
    ec: "NOISY",
    pd: "NORMAL",
    input:
      "Every evening give me both a five‑minute podcast and the top finance‑news summary related to renewable energy.",
    availableTools: [
      "news_search",
      "podcast_search",
      "movie_db_search",
      "google_search",
    ],
    expected: {
      agent_type: pb().alt("podcast", "finance", "renewable", "energy"),
      tools: ["news_search", "podcast_search"],
      instructions: pb().text("renewable").sep().text("energy"),
    },
  },
  {
    ec: "NOISY",
    pd: "HARD",
    input:
      "On the first business day of each month, compile public‑company filings that are either 10‑K or 10‑Q from the previous quarter mentioning ‘AI safety’, list only firms headquartered in the EU, and highlight any that reported > 10 % year‑over‑year revenue growth.",
    availableTools: [
      "sec_filings_search",
      "google_search",
      "news_search",
      "movie_db_search",
      "historical_sites_search_api",
      "flight_price_tracker",
    ],
    expected: {
      agent_type: pb().alt("filings", "briefing"),
      tools: ["sec_filings_search"],
      instructions: pb().all(
        pb().alt("10‑K", "10-K"),
        pb().alt("10‑Q", "10-Q"),
        "AI safety",
        "EU",
      ),
    },
  },

  /* ─────────────────────────── ENTANGLED ─────────────────────────────── */
  {
    ec: "ENTANGLED",
    pd: "EASY",
    input:
      "Suggest historical sites in Kyoto that are within walking distance of the train station.",
    availableTools: [
      "historical_sites_search_api",
      "google_search",
      "news_search",
      "movie_db_search",
      "crypto_price_feed",
      "flight_price_tracker",
    ],
    expected: {
      agent_type: pb().alt("kyoto", "sites"),
      tools: ["historical_sites_search_api"],
      instructions: pb().alt("walking", "station"),
    },
  },
  {
    ec: "ENTANGLED",
    pd: "NORMAL",
    input:
      "If weather_alert_feed issues a severe thunderstorm warning for the coming weekend, query city_events_search for outdoor events during that window and also provide indoor alternatives you find via google_search.",
    availableTools: [
      "weather_alert_feed",
      "city_events_search",
      "google_search",
      "news_search",
      "movie_db_search",
      "podcast_search",
      "historical_sites_search_api",
      "crypto_price_feed",
      "flight_price_tracker",
    ],
    expected: {
      agent_type: pb().alt("weather", "events"),
      tools: ["weather_alert_feed", "city_events_search"],
      instructions: pb().alt("thunderstorm", "weekend"),
    },
  },
  {
    ec: "ENTANGLED",
    pd: "HARD",
    input:
      "Monitor arXiv papers, major news outlets, and AI podcasts for mentions of ‘fault‑tolerant qubits’; when at least two of those sources reference the term in the same calendar week *and* an SEC 8‑K filed by IBM within that week also contains it, compile a detailed digest and deliver it Monday at 09:00.",
    availableTools: [
      "arxiv_search",
      "news_search",
      "podcast_search",
      "sec_filings_search",
      "crypto_price_feed",
      "city_events_search",
      "google_search",
      "movie_db_search",
      "historical_sites_search_api",
      "weather_alert_feed",
      "phrase_generator",
      "flight_price_tracker",
      "health_inspection_db",
    ],
    expected: {
      agent_type: pb().alt(
        "monitoring",
        "monitor",
        "news",
        "source",
        "sources",
      ),
      tools: [
        "arxiv_search",
        "news_search",
        "podcast_search",
        "sec_filings_search",
      ],
      instructions: pb().alt("monday", "09"),
    },
  },
];

for (const {
  ec,
  pd,
  input,
  expected: { tools, agent_type, instructions },
} of testCases) {
  m.add([ec, pd], {
    input,
    expected: {
      RESPONSE_TYPE: "CREATE_AGENT_CONFIG" as const,
      RESPONSE_CREATE_AGENT_CONFIG: {
        agent_type: expect.any(String),
        description: expect.any(String),
        instructions: expect.any(String),
        tools: expect.arrayContaining(tools),
      },
    },
    meta: { availableTools: tools.map((tool) => toolFn(tool)) },
    assert: (parsed) => {
      expect(parsed.RESPONSE_CREATE_AGENT_CONFIG!.agent_type).toMatchPattern(
        agent_type,
      );
      expect(parsed.RESPONSE_CREATE_AGENT_CONFIG!.instructions).toMatchPattern(
        instructions,
      );
    },
  });
}

/* kick off the generator */
runMatrix(m);
