import { AgentAvailableTool } from "@/agents/supervisor-workflow/dto.js";
import { getChatLLM } from "@/helpers/llm.js";
import { ProtocolResult } from "@/laml/index.js";
import { Logger } from "beeai-framework";
import { describe, expect, it } from "vitest";
import { AgentConfigInitializer } from "./agent-config-initializer.js";
import { ExistingAgentConfig } from "./dto.js";
import { protocol } from "./protocol.js";
import { clone } from "remeda";

// ----------------------------------------------------------------------------------------------------
// HELPERS
// ----------------------------------------------------------------------------------------------------
const logger = Logger.root.child({
  name: "test",
});

interface TestDataItem {
  name?: string;
  input: string;
  existingConfigs?: ExistingAgentConfig[];
  availableTools?: AgentAvailableTool[];
  expected: Partial<ProtocolResult<typeof protocol>>;
}

const testGenerator = (dataset: TestDataItem[]) => {
  const agentConfigCreator = new AgentConfigInitializer(logger);
  dataset.map((item) => {
    it(item.name || item.input, async () => {
      const resp = await agentConfigCreator.run(llm, {
        task: item.input,
        availableTools: item.availableTools || [],
        existingConfigs: item.existingConfigs || [],
      });

      expect(resp.parsed).toMatchObject(item.expected);
    });
  });
};
const llm = getChatLLM("supervisor");

// ----------------------------------------------------------------------------------------------------
// TEST DATA
// ----------------------------------------------------------------------------------------------------
const TOOLS_ENTRIES = [
  {
    toolName: "arxiv_search",
    description:
      "Search arXiv preprints by keyword, subject area, and date; returns title, authors, abstract, and PDF link.",
  },
  {
    toolName: "city_events_search",
    description:
      "Query municipal event listings with filters for date, venue, and category; returns structured JSON.",
  },
  {
    toolName: "crypto_price_feed",
    description:
      "Stream current and historical cryptocurrency prices for major exchanges.",
  },
  {
    toolName: "flight_price_tracker",
    description:
      "Track airfare quotes for specific routes and dates; supports hourly polling.",
  },
  {
    toolName: "google_search",
    description:
      "A lightweight utility that fires off a query to Google Search and returns the top-ranked results (title, URL, snippet, and source site) in a compact JSON array. Ideal for quickly grabbing fresh, relevant links when your LLM needs up-to-date information without crawling the entire web.",
  },
  {
    toolName: "health_inspection_db",
    description:
      "Look up restaurant inspection scores and violations by name or address.",
  },
  {
    toolName: "historical_sites_search_api",
    description:
      "A purpose-built search endpoint that taps authoritative heritage databases (e.g., UNESCO, national registers, archaeological gazetteers) and returns structured JSON for each site: name, era, coordinates, jurisdiction, brief description, and citation links. Ideal when an LLM needs precise, geo-tagged information on historical or archaeological sites without piecing together data from scattered sources.",
  },
  {
    toolName: "movie_db_search",
    description:
      "Query upcoming and past film releases, including cast, synopsis, and release dates.",
  },
  {
    toolName: "news_search",
    description:
      "Query a curated index of newspapers, magazines, and wire-services for articles that match a keyword or topic. Supports source and date filters, returning structured results with headline, outlet, publication date, snippet, and article URL.",
  },
  {
    toolName: "phrase_generator",
    description:
      "Generate vocabulary lists and example sentences for supported languages.",
  },
  {
    toolName: "podcast_search",
    description:
      "Search a catalogue of podcast episodes by keyword and date; returns title, show, release date, and audio URL.",
  },
  {
    toolName: "sec_filings_search",
    description:
      "Query the SEC EDGAR database for U.S. public-company filings. Accepts filters for ticker or CIK, form type (8-K, 10-K, 10-Q, S-1, 13D/G, 4, etc.), keyword, and filing-date range.",
  },
  {
    toolName: "weather_alert_feed",
    description:
      "Stream National Weather Service alerts with geolocation filters.",
  },
] as const;
type ToolName = (typeof TOOLS_ENTRIES)[number]["toolName"];
const TOOLS = new Map<ToolName, AgentAvailableTool>(
  TOOLS_ENTRIES.map((e) => [e.toolName, e]),
);
function tool<Name extends ToolName>(name: Name) {
  return clone(TOOLS.get(name)!);
}

const AGENT_CONFIGS_ENTRIES = [
  {
    agentType: "arxiv_rl_daily",
    description: "Daily RL arXiv digest.",
    instructions:
      "At 07:00 Prague time search arxiv_search for new submissions tagged " +
      "cs.LG or cs.AI whose abstract mentions “reinforcement learning” and send " +
      "a three-sentence summary for each paper.",
    tools: ["arxiv_search"],
  },
  {
    agentType: "city_events_weekend",
    description: "Weekend family events.",
    instructions:
      "Every Thursday query city_events_search for family-friendly events in " +
      "the user’s city scheduled for the coming weekend (Fri-Sun). Return name, " +
      "venue, start time and ticket price.",
    tools: ["city_events_search"],
  },
  {
    agentType: "crypto_price_tracker_hourly",
    description: "Tracks BTC & ETH prices every hour.",
    instructions:
      "Fetch Bitcoin and Ethereum spot prices every hour with crypto_price_feed and alert on > 3 % moves.",
    tools: ["crypto_price_feed"],
  },
  {
    agentType: "flight_tracker_daily",
    description: "Monitors PRG→NRT fares once per day.",
    instructions:
      "Query fare once per day and alert on drops below €750 using flight_price_tracker.",
    tools: ["flight_price_tracker"],
  },
  {
    agentType: "flight_price_tracker_weekly",
    description: "Weekly flight-deal monitor.",
    instructions:
      "Once a week track round-trip fares on user-defined routes with " +
      "flight_price_tracker and alert when the price drops below the user’s " +
      "target threshold.",
    tools: ["flight_price_tracker"],
  },
  {
    agentType: "historical_sites_search",
    description: "Agent for searching historical sites in a city.",
    instructions:
      "Context: You are an agent specialized in finding historical sites in a given city. You have access to web search tools to gather information about popular historical landmarks, museums, and sites of interest. Users will provide the city and any specific interests they have. Objective: Provide a list of historical sites to visit, including brief descriptions and any relevant visiting information such as opening hours or ticket prices. Response format: Present the information in a list format with each site having a name, description, and visiting details.",
    tools: ["historical_sites_search_api"],
  },
  {
    agentType: "news_headlines_24h",
    description: "Gathers news headlines the past 24 hours.",
    instructions: `You are an agent specializing in collecting news headlines. You have access to a news_search tool that allows you to find articles based on keywords and time filters. Users will provide a time frame and one or more search terms for the news they want collected.

Objective: Collect news headlines that contain the user-supplied keywords within the requested time window (default: past 24 hours). Use the news_search tool to execute the query, filtering results to match the specified period. Provide a list of headline URLs together with concise summaries.

Response format: Begin with a brief sentence that restates the search terms and time frame. Then list each headline on its own line, showing the URL first and a short summary after an em-dash or colon. For example:

News headlines matching “<keywords>” from the past 24 hours:  
1. URL: [headline_url_1] — Summary: [headline_summary_1]  
2. URL: [headline_url_2] — Summary: [headline_summary_2]`,
    tools: ["news_search"],
  },
  {
    agentType: "phrase_generator",
    description: "Daily vocabulary exercise agent.",
    instructions:
      "Every weekday at 07:00 Prague time, generate a Spanish ‘word of the day’ " +
      "with part-of-speech, IPA pronunciation, an English translation and one " +
      "example sentence. Finish with a short multiple-choice quiz. Use the " +
      "phrase_generator tool only.",
    tools: ["phrase_generator"],
  },
  {
    agentType: "podcast_ai_weekly",
    description: "Weekly AI-podcast digest.",
    instructions:
      "Every Friday at 18:00 Prague time, query podcast_search for AI-related " +
      "episodes published in the last 7 days and send a three-sentence summary " +
      "for each.",
    tools: ["podcast_search"],
  },
  {
    agentType: "scifi_movies_weekly",
    description: "Upcoming sci-fi releases digest.",
    instructions:
      "Each Monday compile a list of new or upcoming science-fiction movies " +
      "releasing in the next 30 days using movie_db_search, including synopsis " +
      "and release date.",
    tools: ["movie_db_search"],
  },
  {
    agentType: "weather_tornado_immediate",
    description: "Instant tornado warnings.",
    instructions:
      "Continuously monitor weather_alert_feed for tornado watches or " +
      "warnings within 50 km of the user’s coordinates and notify immediately.",
    tools: ["weather_alert_feed"],
  },
] as const satisfies ExistingAgentConfig[];
type AgentConfigName = (typeof AGENT_CONFIGS_ENTRIES)[number]["agentType"];
const AGENT_CONFIGS = new Map<AgentConfigName, ExistingAgentConfig>(
  AGENT_CONFIGS_ENTRIES.map((e) => [e.agentType, e]),
);
function agentConfig<Name extends AgentConfigName>(name: Name) {
  return clone(AGENT_CONFIGS.get(name)!);
}

// ----------------------------------------------------------------------------------------------------
// TEST
// ----------------------------------------------------------------------------------------------------

describe("Agent config creator - laml", () => {
  /**
   * ============================================================================
   * TEST-MATRIX · CREATE_AGENT_CONFIG
   * ============================================================================
   *
   * Use these guidelines when the agent **must produce an all-new agent
   * configuration** (not reuse or modify an existing one).
   *
   * Grid: 3 outer categories (environment clutter) ×
   *       3 inner levels (prompt difficulty).
   *
   * ── Legend ────────────────────────────────────────────────────────────────
   *   • Environment → existingConfigs & availableTools shown to the agent
   *   • Prompt      → wording clarity and number of constraints
   *   • Reasoning   → key cognitive step the LLM must solve
   *   • Assert      → the one thing your `expect()` must verify in that cell
   * ------------------------------------------------------------------------
   *
   * 1. STRAIGHTFORWARD  (green-field, happy-path)
   * ──────────────────────────────────────────────────────────────────────────
   *   L-1
   *     Environment : 0 configs · 1 relevant tool
   *     Prompt      : clear, explicit single task
   *     Reasoning   : direct 1-to-1 mapping
   *     Assert      : correct tool selected & boiler-plate fields exist
   *
   *   L-2
   *     Environment : 0 configs · 2–3 tools (only 1 fits)
   *     Prompt      : same task, mild synonym / simple filter
   *     Reasoning   : ignore noise
   *     Assert      : irrelevant tools excluded
   *
   *   L-3
   *     Environment : 0 configs · ≤5 mixed tools
   *     Prompt      : adds 1–2 extra filters (date-range, synopsis, etc.)
   *     Reasoning   : weave filters into instructions
   *     Assert      : instructions mention every filter
   *
   * 2. MODERATE  (some clutter to consider)
   * ──────────────────────────────────────────────────────────────────────────
   *   L-1
   *     Environment : 1 existing config that **doesn’t** match · 2–3 tools
   *     Prompt      : straightforward single-tool request
   *     Reasoning   : decide CREATE vs SELECT → choose CREATE
   *     Assert      : new config proposed
   *
   *   L-2
   *     Environment : 1–2 unrelated configs · 3–4 tools (2 relevant)
   *     Prompt      : merge two info sources (“news + podcast”)
   *     Reasoning   : pick 2 tools, drop others
   *     Assert      : both relevant tools included
   *
   *   L-3
   *     Environment : several configs (one loosely related) · 5–6 tools
   *     Prompt      : multi-filter (geo + price cap, etc.)
   *     Reasoning   : craft rich instructions, avoid false SELECT
   *     Assert      : description covers **all** constraints
   *
   * 3. COMPLEX  (dense ecosystem, implicit mapping)
   * ──────────────────────────────────────────────────────────────────────────
   *   L-1
   *     Environment : many configs (none adequate) · 5–8 tools (2 relevant)
   *     Prompt      : vague domain wording, single goal
   *     Reasoning   : semantic mapping to correct tools
   *     Assert      : correct tools chosen despite ambiguity
   *
   *   L-2
   *     Environment : overlapping configs · 8–10 tools (3 relevant)
   *     Prompt      : conditional / cross-domain fusion requirement
   *     Reasoning   : orchestrate 2–3 tools, reject near-match config
   *     Assert      : CREATE (not UPDATE) + orchestration steps present
   *
   *   L-3
   *     Environment : large config set influencing behaviour · 10+ tools
   *     Prompt      : nested, implicit ask (“fear-and-greed index …”)
   *     Reasoning   : conditional inclusion, derived metrics, multi-step summary
   *     Assert      : comprehensive instructions; all and *only* correct tools
   *
   * ------------------------------------------------------------------------
   * HOW TO USE
   * ------------------------------------------------------------------------
   * 1. Pick a cell → decide env clutter & prompt trickiness.
   * 2. Configure `existingConfigs`, `availableTools`, and `input` to match.
   * 3. Assert `RESPONSE_TYPE === "CREATE_AGENT_CONFIG"` plus the rule under
   *    **Assert** above.
   * 4. Cover every cell at least once for full spectrum testing.
   * ============================================================================
   */
  describe("CREATE_AGENT_CONFIG", () => {
    /* ---------- 1 · STRAIGHTFORWARD -------------------------------------- */
    describe("Straightforward", () => {
      /* L-1 already fully covered by existing tests ----------------------- */
      describe(`Low complexity (L-1)`, () => {
        testGenerator([
          {
            availableTools: [tool("news_search")],
            input:
              "Collect news headlines containing related to AI from the past 24 hours.",
            expected: {
              RESPONSE_TYPE: "CREATE_AGENT_CONFIG",
              RESPONSE_CREATE_AGENT_CONFIG: {
                agent_type: expect.any(String),
                description: expect.any(String),
                instructions: expect.any(String),
                tools: ["news_search"],
              },
            },
          },
          {
            availableTools: [tool("podcast_search")],
            input:
              "Find podcasts released this week discussing breakthroughs in gene editing and give me concise episode summaries.",
            expected: {
              RESPONSE_TYPE: "CREATE_AGENT_CONFIG",
              RESPONSE_CREATE_AGENT_CONFIG: {
                agent_type: expect.any(String),
                description: expect.any(String),
                instructions: expect.any(String),
                tools: ["podcast_search"],
              },
            },
          },
          {
            availableTools: [tool("crypto_price_feed")],
            input:
              "Track Bitcoin and Ethereum prices for the next 8 hours and alert me if either moves more than 3 %.",
            expected: {
              RESPONSE_TYPE: "CREATE_AGENT_CONFIG",
              RESPONSE_CREATE_AGENT_CONFIG: {
                agent_type: expect.any(String),
                description: expect.any(String),
                instructions: expect.any(String),
                tools: ["crypto_price_feed"],
              },
            },
          },
          {
            availableTools: [tool("city_events_search")],
            input:
              "List all family-friendly events happening in Central Park this weekend, including start times and ticket info.",
            expected: {
              RESPONSE_TYPE: "CREATE_AGENT_CONFIG",
              RESPONSE_CREATE_AGENT_CONFIG: {
                agent_type: expect.any(String),
                description: expect.any(String),
                instructions: expect.any(String),
                tools: ["city_events_search"],
              },
            },
          },
          {
            availableTools: [tool("arxiv_search")],
            input:
              "Give me a daily digest of new arXiv papers about reinforcement learning, summarized in 3 sentences each.",
            expected: {
              RESPONSE_TYPE: "CREATE_AGENT_CONFIG",
              RESPONSE_CREATE_AGENT_CONFIG: {
                agent_type: expect.any(String),
                description: expect.any(String),
                instructions: expect.any(String),
                tools: ["arxiv_search"],
              },
            },
          },
          {
            availableTools: [tool("health_inspection_db")],
            input:
              "Notify me whenever a restaurant in my city scores below 80 in its latest health inspection.",
            expected: {
              RESPONSE_TYPE: "CREATE_AGENT_CONFIG",
              RESPONSE_CREATE_AGENT_CONFIG: {
                agent_type: expect.any(String),
                description: expect.any(String),
                instructions: expect.any(String),
                tools: ["health_inspection_db"],
              },
            },
          },
          {
            availableTools: [tool("flight_price_tracker")],
            input:
              "Monitor round-trip fares from Prague to Tokyo in October and alert when the price drops below €700.",
            expected: {
              RESPONSE_TYPE: "CREATE_AGENT_CONFIG",
              RESPONSE_CREATE_AGENT_CONFIG: {
                agent_type: expect.any(String),
                description: expect.any(String),
                instructions: expect.any(String),
                tools: ["flight_price_tracker"],
              },
            },
          },
          {
            availableTools: [tool("sec_filings_search")],
            input:
              "Monitor recent 8-K SEC filings by S&P 500 companies that announce upcoming stock splits, and send a summary of company name, split ratio, and the effective date.",
            expected: {
              RESPONSE_TYPE: "CREATE_AGENT_CONFIG",
            },
          },
          {
            availableTools: [tool("phrase_generator")],
            input:
              "Create a Spanish word-of-the-day exercise with a short quiz every morning at 7 AM local time.",
            expected: {
              RESPONSE_TYPE: "CREATE_AGENT_CONFIG",
              RESPONSE_CREATE_AGENT_CONFIG: {
                agent_type: expect.any(String),
                description: expect.any(String),
                instructions: expect.any(String),
                tools: ["phrase_generator"],
              },
            },
          },
          {
            availableTools: [tool("movie_db_search")],
            input:
              "Send me a weekly list of science-fiction movies premiering in theatres or streaming in the next month.",
            expected: {
              RESPONSE_TYPE: "CREATE_AGENT_CONFIG",
              RESPONSE_CREATE_AGENT_CONFIG: {
                agent_type: expect.any(String),
                description: expect.any(String),
                instructions: expect.any(String),
                tools: ["movie_db_search"],
              },
            },
          },
          {
            availableTools: [tool("weather_alert_feed")],
            input:
              "Set up an agent that warns me immediately if there’s a tornado watch or warning within 50 km of my location.",
            expected: {
              RESPONSE_TYPE: "CREATE_AGENT_CONFIG",
              RESPONSE_CREATE_AGENT_CONFIG: {
                agent_type: expect.any(String),
                description: expect.any(String),
                instructions: expect.any(String),
                tools: ["weather_alert_feed"],
              },
            },
          },
        ]);
      });
      /* L-2 – 0 configs · 2–3 tools (only 1 fits) ------------------------- */
      describe("Medium complexity (L-2)", () => {
        testGenerator([
          {
            name: "Ignore irrelevant tools, pick only the matching one",
            availableTools: [
              tool("news_search"),
              tool("podcast_search"),
              tool("google_search"),
            ],
            input:
              "Give me news headlines about renewable energy from the last 12 hours.",
            expected: {
              RESPONSE_TYPE: "CREATE_AGENT_CONFIG",
              RESPONSE_CREATE_AGENT_CONFIG: {
                tools: ["news_search"],
                agent_type: expect.any(String),
                instructions: expect.any(String),
                description: expect.any(String),
              },
            },
          },
          {
            name: "Movie releases only: ignore news & google search",
            availableTools: [
              tool("movie_db_search"),
              tool("news_search"),
              tool("google_search"),
            ],
            input: "List sci-fi movie premieres next month with release dates.",
            expected: {
              RESPONSE_TYPE: "CREATE_AGENT_CONFIG",
              RESPONSE_CREATE_AGENT_CONFIG: {
                tools: ["movie_db_search"],
                agent_type: expect.any(String),
                description: expect.any(String),
                instructions: expect.any(String),
              },
            },
          },
          {
            name: "Flight tracker only – ignore crypto noise",
            availableTools: [
              tool("flight_price_tracker"),
              tool("crypto_price_feed"),
            ],
            input: "Track flights from Boston to Reykjavík in July under $450.",
            expected: {
              RESPONSE_TYPE: "CREATE_AGENT_CONFIG",
              RESPONSE_CREATE_AGENT_CONFIG: {
                tools: ["flight_price_tracker"],
                agent_type: expect.any(String),
                description: expect.any(String),
                instructions: expect.any(String),
              },
            },
          },
          {
            name: "arXiv digest – ignore google & city-events",
            availableTools: [
              tool("arxiv_search"),
              tool("google_search"),
              tool("city_events_search"),
            ],
            input: "Summarise new arXiv papers on computer vision daily.",
            expected: {
              RESPONSE_TYPE: "CREATE_AGENT_CONFIG",
              RESPONSE_CREATE_AGENT_CONFIG: {
                tools: ["arxiv_search"],
                agent_type: expect.any(String),
                description: expect.any(String),
                instructions: expect.any(String),
              },
            },
          },
          {
            name: "Severe-weather alerts only",
            availableTools: [
              tool("weather_alert_feed"),
              tool("sec_filings_search"),
            ],
            input: "Warn me of severe thunderstorm warnings within 80 km.",
            expected: {
              RESPONSE_TYPE: "CREATE_AGENT_CONFIG",
              RESPONSE_CREATE_AGENT_CONFIG: {
                tools: ["weather_alert_feed"],
                agent_type: expect.any(String),
                description: expect.any(String),
                instructions: expect.any(String),
              },
            },
          },
          {
            name: "Family events – ignore podcasts & google",
            availableTools: [
              tool("city_events_search"),
              tool("podcast_search"),
              tool("google_search"),
            ],
            input: "Find family-friendly events in Rome this weekend.",
            expected: {
              RESPONSE_TYPE: "CREATE_AGENT_CONFIG",
              RESPONSE_CREATE_AGENT_CONFIG: {
                tools: ["city_events_search"],
                agent_type: expect.any(String),
                description: expect.any(String),
                instructions: expect.any(String),
              },
            },
          },
          {
            name: "Health-inspection alerts only",
            availableTools: [
              tool("health_inspection_db"),
              tool("crypto_price_feed"),
            ],
            input: "Alert if any restaurant scores below 82 in my city.",
            expected: {
              RESPONSE_TYPE: "CREATE_AGENT_CONFIG",
              RESPONSE_CREATE_AGENT_CONFIG: {
                tools: ["health_inspection_db"],
                agent_type: expect.any(String),
                description: expect.any(String),
                instructions: expect.any(String),
              },
            },
          },
          {
            name: "Spanish word-a-day – ignore arxiv & google",
            availableTools: [
              tool("phrase_generator"),
              tool("arxiv_search"),
              tool("google_search"),
            ],
            input: "Spanish word of the day at 07:00 with a usage quiz.",
            expected: {
              RESPONSE_TYPE: "CREATE_AGENT_CONFIG",
              RESPONSE_CREATE_AGENT_CONFIG: {
                tools: ["phrase_generator"],
                agent_type: expect.any(String),
                description: expect.any(String),
                instructions: expect.any(String),
              },
            },
          },
          {
            name: "SEC filings only – ignore news & google",
            availableTools: [
              tool("sec_filings_search"),
              tool("news_search"),
              tool("google_search"),
            ],
            input: "Track new 8-K filings mentioning ‘dividend’.",
            expected: {
              RESPONSE_TYPE: "CREATE_AGENT_CONFIG",
              RESPONSE_CREATE_AGENT_CONFIG: {
                tools: ["sec_filings_search"],
                agent_type: expect.any(String),
                description: expect.any(String),
                instructions: expect.any(String),
              },
            },
          },
          {
            name: "AI podcasts only – ignore movie db noise",
            availableTools: [
              tool("podcast_search"),
              tool("movie_db_search"),
              tool("google_search"),
            ],
            input: "Fetch daily podcasts about transformers in NLP.",
            expected: {
              RESPONSE_TYPE: "CREATE_AGENT_CONFIG",
              RESPONSE_CREATE_AGENT_CONFIG: {
                tools: ["podcast_search"],
                agent_type: expect.any(String),
                description: expect.any(String),
                instructions: expect.any(String),
              },
            },
          },
        ]);
      });

      /* L-3 – 0 configs · ≤5 mixed tools + extra filters ------------------ */
      describe("High complexity (L-3)", () => {
        testGenerator([
          {
            name: "All filters woven into instructions",
            availableTools: [
              tool("news_search"),
              tool("crypto_price_feed"),
              tool("podcast_search"),
              tool("google_search"),
              tool("arxiv_search"),
            ],
            input:
              "Collect European climate-change headlines published between 1 April 2025 and 10 April 2025. Include publication date in each summary.",
            expected: {
              RESPONSE_TYPE: "CREATE_AGENT_CONFIG",
              RESPONSE_CREATE_AGENT_CONFIG: {
                tools: ["news_search"],
                agent_type: expect.any(String),
                // ensure date & geo filters survived
                instructions: expect.stringContaining("1 April"),
                description: expect.any(String),
              },
            },
          },
          {
            name: "US tech headlines with date range filter",
            availableTools: [
              tool("news_search"),
              tool("crypto_price_feed"),
              tool("google_search"),
              tool("arxiv_search"),
            ],
            input:
              "Collect US tech headlines published between 10 March 2025 and 15 March 2025. Include the publication date in each summary.",
            expected: {
              RESPONSE_TYPE: "CREATE_AGENT_CONFIG",
              RESPONSE_CREATE_AGENT_CONFIG: {
                tools: ["news_search"],
                agent_type: expect.any(String),
                description: expect.any(String),
                // prove the date filter survived
                instructions: expect.stringContaining("10 March"),
              },
            },
          },
          {
            name: "April-2025 vaccine-research podcasts, host creds",
            availableTools: [
              tool("podcast_search"),
              tool("news_search"),
              tool("google_search"),
              tool("movie_db_search"),
            ],
            input:
              "Send me podcasts released in April 2025 discussing breakthroughs in vaccine research, and note each host’s credentials.",
            expected: {
              RESPONSE_TYPE: "CREATE_AGENT_CONFIG",
              RESPONSE_CREATE_AGENT_CONFIG: {
                tools: ["podcast_search"],
                agent_type: expect.any(String),
                instructions: expect.stringContaining("April 2025"),
                description: expect.any(String),
              },
            },
          },
          {
            name: "48-hour arXiv CV & eess filter",
            availableTools: [
              tool("arxiv_search"),
              tool("google_search"),
              tool("crypto_price_feed"),
              tool("city_events_search"),
            ],
            input:
              "Get arXiv papers on computer vision categories cs.CV and eess.IV from the last 48 hours; give two-sentence abstracts.",
            expected: {
              RESPONSE_TYPE: "CREATE_AGENT_CONFIG",
              RESPONSE_CREATE_AGENT_CONFIG: {
                tools: ["arxiv_search"],
                agent_type: expect.any(String),
                instructions: expect.stringContaining("48"),
                description: expect.any(String),
              },
            },
          },
          {
            name: "Prague → Sydney flights, December window & nonstop filter",
            availableTools: [
              tool("flight_price_tracker"),
              tool("google_search"),
              tool("movie_db_search"),
              tool("news_search"),
              tool("crypto_price_feed"),
            ],
            input:
              "Monitor flight fares from Prague to Sydney for travel dates 1–15 December 2025; alert if price < €900 and flights are nonstop only.",
            expected: {
              RESPONSE_TYPE: "CREATE_AGENT_CONFIG",
              RESPONSE_CREATE_AGENT_CONFIG: {
                tools: ["flight_price_tracker"],
                agent_type: expect.any(String),
                instructions: expect.stringContaining("€900"),
                description: expect.any(String),
              },
            },
          },
          {
            name: "Paris Bastille Day weekend events under €40",
            availableTools: [
              tool("city_events_search"),
              tool("podcast_search"),
              tool("weather_alert_feed"),
              tool("google_search"),
              tool("news_search"),
            ],
            input:
              "List family-friendly events in Paris over Bastille Day weekend (12–14 July). Ticket price must be under €40.",
            expected: {
              RESPONSE_TYPE: "CREATE_AGENT_CONFIG",
              RESPONSE_CREATE_AGENT_CONFIG: {
                tools: ["city_events_search"],
                agent_type: expect.any(String),
                instructions: expect.stringContaining("€40"),
                description: expect.any(String),
              },
            },
          },
          {
            name: "German B2 vocab at 06:30 with quiz",
            availableTools: [
              tool("phrase_generator"),
              tool("arxiv_search"),
              tool("google_search"),
              tool("city_events_search"),
            ],
            input:
              "Create a daily German B2 vocabulary exercise at 06:30 local time that finishes with a fill-in-the-blank quiz.",
            expected: {
              RESPONSE_TYPE: "CREATE_AGENT_CONFIG",
              RESPONSE_CREATE_AGENT_CONFIG: {
                tools: ["phrase_generator"],
                agent_type: expect.any(String),
                instructions: expect.stringContaining("06:30"),
                description: expect.any(String),
              },
            },
          },
          {
            name: "Tesla SEC filings excluding 10-Q/10-K",
            availableTools: [
              tool("sec_filings_search"),
              tool("news_search"),
              tool("google_search"),
              tool("crypto_price_feed"),
            ],
            input:
              "Fetch SEC filings by Tesla since 1 Jan 2025 but exclude 10-Q and 10-K forms; summarise type and key points.",
            expected: {
              RESPONSE_TYPE: "CREATE_AGENT_CONFIG",
              RESPONSE_CREATE_AGENT_CONFIG: {
                tools: ["sec_filings_search"],
                agent_type: expect.any(String),
                instructions: expect.any(String),
                description: expect.any(String),
              },
            },
          },
          {
            name: "Sushi health inspections < 70, LA, past 30 days",
            availableTools: [
              tool("health_inspection_db"),
              tool("news_search"),
              tool("google_search"),
              tool("flight_price_tracker"),
            ],
            input:
              "Alert me when a sushi restaurant in Los Angeles scores below 70 in the past 30 days.",
            expected: {
              RESPONSE_TYPE: "CREATE_AGENT_CONFIG",
              RESPONSE_CREATE_AGENT_CONFIG: {
                tools: ["health_inspection_db"],
                agent_type: expect.any(String),
                instructions: expect.stringContaining("70"),
                description: expect.any(String),
              },
            },
          },
          {
            name: "Hurricane alerts within 100 km of Miami, June-Nov",
            availableTools: [
              tool("weather_alert_feed"),
              tool("news_search"),
              tool("google_search"),
              tool("crypto_price_feed"),
              tool("city_events_search"),
            ],
            input:
              "Notify me of any hurricane watch or warning within 100 km of Miami during the Atlantic hurricane season (June–November) and rank by severity.",
            expected: {
              RESPONSE_TYPE: "CREATE_AGENT_CONFIG",
              RESPONSE_CREATE_AGENT_CONFIG: {
                tools: ["weather_alert_feed"],
                agent_type: expect.any(String),
                instructions: expect.stringContaining("100 km"),
                description: expect.any(String),
              },
            },
          },
        ]);
      });
    });

    /* ---------- 2 · MODERATE ------------------------------------------- */
    describe("Moderate", () => {
      /* L-1 – 1 unrelated config · 2–3 tools ------------------------------ */
      describe("Low complexity (L-1)", () => {
        testGenerator([
          {
            name: "Existing unrelated config present → still CREATE a podcast agent",
            existingConfigs: [agentConfig("news_headlines_24h")],
            availableTools: [tool("podcast_search"), tool("news_search")],
            input:
              "Find podcast episodes on artificial intelligence from last week.",
            expected: {
              RESPONSE_TYPE: "CREATE_AGENT_CONFIG",
              RESPONSE_CREATE_AGENT_CONFIG: {
                tools: ["podcast_search"],
                agent_type: expect.any(String),
                instructions: expect.any(String),
                description: expect.any(String),
              },
            },
          },
          {
            name: "Health inspection alert, unrelated headlines config present",
            existingConfigs: [agentConfig("news_headlines_24h")],
            availableTools: [tool("health_inspection_db"), tool("news_search")],
            input:
              "Warn me when any bar scores below 85 in health inspections.",
            expected: {
              RESPONSE_TYPE: "CREATE_AGENT_CONFIG",
              RESPONSE_CREATE_AGENT_CONFIG: {
                tools: ["health_inspection_db"],
                agent_type: expect.any(String),
                instructions: expect.any(String),
                description: expect.any(String),
              },
            },
          },
          {
            name: "Weather tornado alerts, unrelated configs",
            existingConfigs: [agentConfig("news_headlines_24h")],
            availableTools: [tool("weather_alert_feed"), tool("google_search")],
            input:
              "Alert me immediately if a tornado warning is issued nearby.",
            expected: {
              RESPONSE_TYPE: "CREATE_AGENT_CONFIG",
              RESPONSE_CREATE_AGENT_CONFIG: {
                tools: ["weather_alert_feed"],
                agent_type: expect.any(String),
                instructions: expect.any(String),
                description: expect.any(String),
              },
            },
          },
          {
            name: "Daily arXiv quantum papers",
            existingConfigs: [agentConfig("news_headlines_24h")],
            availableTools: [tool("arxiv_search"), tool("google_search")],
            input:
              "Summarise new arXiv papers about quantum algorithms every day.",
            expected: {
              RESPONSE_TYPE: "CREATE_AGENT_CONFIG",
              RESPONSE_CREATE_AGENT_CONFIG: {
                tools: ["arxiv_search"],
                agent_type: expect.any(String),
                instructions: expect.any(String),
                description: expect.any(String),
              },
            },
          },
          {
            name: "Weekly sci-fi movie list",
            existingConfigs: [agentConfig("historical_sites_search")],
            availableTools: [tool("movie_db_search"), tool("google_search")],
            input: "Send me a list of sci-fi films premiering next week.",
            expected: {
              RESPONSE_TYPE: "CREATE_AGENT_CONFIG",
              RESPONSE_CREATE_AGENT_CONFIG: {
                tools: ["movie_db_search"],
                agent_type: expect.any(String),
                instructions: expect.any(String),
                description: expect.any(String),
              },
            },
          },
          {
            name: "Crypto price hourly alert",
            existingConfigs: [agentConfig("historical_sites_search")],
            availableTools: [tool("crypto_price_feed"), tool("news_search")],
            input: "Track ETH price hourly; alert on > 4 % moves.",
            expected: {
              RESPONSE_TYPE: "CREATE_AGENT_CONFIG",
              RESPONSE_CREATE_AGENT_CONFIG: {
                tools: ["crypto_price_feed"],
                agent_type: expect.any(String),
                instructions: expect.any(String),
                description: expect.any(String),
              },
            },
          },
          {
            name: "Flight tracker, unrelated historic config present",
            existingConfigs: [agentConfig("historical_sites_search")],
            availableTools: [
              tool("flight_price_tracker"),
              tool("google_search"),
            ],
            input: "Monitor flights from Amsterdam to Tokyo under €650.",
            expected: {
              RESPONSE_TYPE: "CREATE_AGENT_CONFIG",
              RESPONSE_CREATE_AGENT_CONFIG: {
                tools: ["flight_price_tracker"],
                agent_type: expect.any(String),
                instructions: expect.any(String),
                description: expect.any(String),
              },
            },
          },
          {
            name: "Weekend events agent",
            existingConfigs: [agentConfig("news_headlines_24h")],
            availableTools: [
              tool("city_events_search"),
              tool("podcast_search"),
            ],
            input: "Show me family events in Dublin this weekend.",
            expected: {
              RESPONSE_TYPE: "CREATE_AGENT_CONFIG",
              RESPONSE_CREATE_AGENT_CONFIG: {
                tools: ["city_events_search"],
                agent_type: expect.any(String),
                instructions: expect.any(String),
                description: expect.any(String),
              },
            },
          },
          {
            name: "AI podcast finder",
            existingConfigs: [agentConfig("historical_sites_search")],
            availableTools: [tool("podcast_search"), tool("news_search")],
            input: "Daily podcasts about AI safety, please.",
            expected: {
              RESPONSE_TYPE: "CREATE_AGENT_CONFIG",
              RESPONSE_CREATE_AGENT_CONFIG: {
                tools: ["podcast_search"],
                agent_type: expect.any(String),
                instructions: expect.any(String),
                description: expect.any(String),
              },
            },
          },
          {
            name: "Daily Spanish word exercise",
            existingConfigs: [agentConfig("news_headlines_24h")],
            availableTools: [tool("phrase_generator"), tool("google_search")],
            input: "Spanish word-of-the-day every morning 8 AM.",
            expected: {
              RESPONSE_TYPE: "CREATE_AGENT_CONFIG",
              RESPONSE_CREATE_AGENT_CONFIG: {
                tools: ["phrase_generator"],
                agent_type: expect.any(String),
                instructions: expect.any(String),
                description: expect.any(String),
              },
            },
          },
        ]);
      });

      /* L-2 – unrelated configs · 3–4 tools (2 relevant) ------------------ */
      describe("Medium complexity (L-2)", () => {
        testGenerator([
          {
            name: "Fusion of news + podcast sources",
            existingConfigs: [
              agentConfig("news_headlines_24h"),
              agentConfig("historical_sites_search"),
            ],
            availableTools: [
              tool("news_search"),
              tool("podcast_search"),
              tool("movie_db_search"),
              tool("google_search"),
            ],
            input:
              "Every morning list news headlines AND podcast episodes about quantum computing from the past 24 hours.",
            expected: {
              RESPONSE_TYPE: "CREATE_AGENT_CONFIG",
              RESPONSE_CREATE_AGENT_CONFIG: {
                tools: expect.arrayContaining([
                  "news_search",
                  "podcast_search",
                ]),
                agent_type: expect.any(String),
                instructions: expect.any(String),
                description: expect.any(String),
              },
            },
          },
          {
            name: "EV news + SEC filings daily digest",
            existingConfigs: [agentConfig("historical_sites_search")],
            availableTools: [
              tool("news_search"),
              tool("sec_filings_search"),
              tool("movie_db_search"),
              tool("google_search"),
            ],
            input:
              "Each morning gather news headlines AND SEC filings about electric-vehicle companies from the past 24 hours.",
            expected: {
              RESPONSE_TYPE: "CREATE_AGENT_CONFIG",
              RESPONSE_CREATE_AGENT_CONFIG: {
                tools: expect.arrayContaining([
                  "news_search",
                  "sec_filings_search",
                ]),
                agent_type: expect.any(String),
                instructions: expect.any(String),
                description: expect.any(String),
              },
            },
          },
          {
            name: "Wildfire news + weather alerts",
            existingConfigs: [
              agentConfig("news_headlines_24h"),
              agentConfig("historical_sites_search"),
            ],
            availableTools: [
              tool("news_search"),
              tool("weather_alert_feed"),
              tool("google_search"),
              tool("podcast_search"),
            ],
            input:
              "Send me wildfire-related headlines and any corresponding weather alerts for California in the past day.",
            expected: {
              RESPONSE_TYPE: "CREATE_AGENT_CONFIG",
              RESPONSE_CREATE_AGENT_CONFIG: {
                tools: expect.arrayContaining([
                  "news_search",
                  "weather_alert_feed",
                ]),
                agent_type: expect.any(String),
                instructions: expect.any(String),
                description: expect.any(String),
              },
            },
          },
          {
            name: "Flight deals + city events combo",
            existingConfigs: [
              agentConfig("news_headlines_24h"),
              agentConfig("historical_sites_search"),
            ],
            availableTools: [
              tool("flight_price_tracker"),
              tool("city_events_search"),
              tool("google_search"),
              tool("movie_db_search"),
            ],
            input:
              "Every Friday find flight deals from Berlin to Lisbon under €120 for next month AND list top 3 weekend events in Lisbon.",
            expected: {
              RESPONSE_TYPE: "CREATE_AGENT_CONFIG",
              RESPONSE_CREATE_AGENT_CONFIG: {
                tools: expect.arrayContaining([
                  "flight_price_tracker",
                  "city_events_search",
                ]),
                agent_type: expect.any(String),
                instructions: expect.any(String),
                description: expect.any(String),
              },
            },
          },
          {
            name: "RL arXiv + headlines digest",
            existingConfigs: [
              agentConfig("historical_sites_search"),
              agentConfig("flight_tracker_daily"),
            ],
            availableTools: [
              tool("arxiv_search"),
              tool("news_search"),
              tool("podcast_search"),
              tool("google_search"),
            ],
            input:
              "Daily summary of new reinforcement-learning arXiv papers plus any news headlines about RL breakthroughs.",
            expected: {
              RESPONSE_TYPE: "CREATE_AGENT_CONFIG",
              RESPONSE_CREATE_AGENT_CONFIG: {
                tools: expect.arrayContaining(["arxiv_search", "news_search"]),
                agent_type: expect.any(String),
                instructions: expect.any(String),
                description: expect.any(String),
              },
            },
          },
          {
            name: "Crypto price + filings correlation report",
            existingConfigs: [agentConfig("news_headlines_24h")],
            availableTools: [
              tool("crypto_price_feed"),
              tool("sec_filings_search"),
              tool("google_search"),
              tool("podcast_search"),
            ],
            input:
              "Each morning correlate Bitcoin price moves with any SEC filings that mention cryptocurrency.",
            expected: {
              RESPONSE_TYPE: "CREATE_AGENT_CONFIG",
              RESPONSE_CREATE_AGENT_CONFIG: {
                tools: expect.arrayContaining([
                  "crypto_price_feed",
                  "sec_filings_search",
                ]),
                agent_type: expect.any(String),
                instructions: expect.any(String),
                description: expect.any(String),
              },
            },
          },
          {
            name: "Movie releases + podcast tie-ins",
            existingConfigs: [agentConfig("historical_sites_search")],
            availableTools: [
              tool("movie_db_search"),
              tool("podcast_search"),
              tool("google_search"),
              tool("news_search"),
            ],
            input:
              "Each week list upcoming science-fiction releases and any podcasts discussing them.",
            expected: {
              RESPONSE_TYPE: "CREATE_AGENT_CONFIG",
              RESPONSE_CREATE_AGENT_CONFIG: {
                tools: expect.arrayContaining([
                  "movie_db_search",
                  "podcast_search",
                ]),
                agent_type: expect.any(String),
                instructions: expect.any(String),
                description: expect.any(String),
              },
            },
          },
          {
            name: "Food-safety inspections + local headlines",
            existingConfigs: [
              agentConfig("news_headlines_24h"),
              agentConfig("historical_sites_search"),
            ],
            availableTools: [
              tool("health_inspection_db"),
              tool("news_search"),
              tool("google_search"),
              tool("city_events_search"),
            ],
            input:
              "Alert me when any restaurant scores < 80 and include related local news coverage.",
            expected: {
              RESPONSE_TYPE: "CREATE_AGENT_CONFIG",
              RESPONSE_CREATE_AGENT_CONFIG: {
                tools: expect.arrayContaining([
                  "health_inspection_db",
                  "news_search",
                ]),
                agent_type: expect.any(String),
                instructions: expect.any(String),
                description: expect.any(String),
              },
            },
          },
          {
            name: "Crypto headlines + podcast combo",
            existingConfigs: [
              agentConfig("historical_sites_search"),
              agentConfig("flight_tracker_daily"),
            ],
            availableTools: [
              tool("news_search"),
              tool("podcast_search"),
              tool("crypto_price_feed"),
              tool("google_search"),
            ],
            input:
              "Provide daily crypto-currency headlines and related podcast episodes.",
            expected: {
              RESPONSE_TYPE: "CREATE_AGENT_CONFIG",
              RESPONSE_CREATE_AGENT_CONFIG: {
                tools: expect.arrayContaining([
                  "news_search",
                  "podcast_search",
                ]),
                agent_type: expect.any(String),
                instructions: expect.any(String),
                description: expect.any(String),
              },
            },
          },
          {
            name: "SEC filings + podcasts about AI startups",
            existingConfigs: [agentConfig("news_headlines_24h")],
            availableTools: [
              tool("sec_filings_search"),
              tool("podcast_search"),
              tool("google_search"),
              tool("news_search"),
            ],
            input:
              "Every morning fetch SEC filings mentioning AI startups and any podcasts analysing them.",
            expected: {
              RESPONSE_TYPE: "CREATE_AGENT_CONFIG",
              RESPONSE_CREATE_AGENT_CONFIG: {
                tools: expect.arrayContaining([
                  "sec_filings_search",
                  "podcast_search",
                ]),
                agent_type: expect.any(String),
                instructions: expect.any(String),
                description: expect.any(String),
              },
            },
          },
        ]);
      });

      /* L-3 – several configs · 5–6 tools · multi-filter ------------------ */
      describe("High complexity (L-3)", () => {
        testGenerator([
          {
            name: "Multi-filter flight tracker creation",
            existingConfigs: [
              agentConfig("news_headlines_24h"),
              agentConfig("historical_sites_search"),
              agentConfig("crypto_price_tracker_hourly"),
            ],
            availableTools: [
              tool("flight_price_tracker"),
              tool("weather_alert_feed"),
              tool("google_search"),
              tool("city_events_search"),
              tool("podcast_search"),
            ],
            input:
              "Monitor flights from London to New York in November; only alert me to results under $500 and airlines that include a free checked bag.",
            expected: {
              RESPONSE_TYPE: "CREATE_AGENT_CONFIG",
              RESPONSE_CREATE_AGENT_CONFIG: {
                tools: ["flight_price_tracker"],
                agent_type: expect.any(String),
                instructions: expect.stringContaining("$500"),
                description: expect.any(String),
              },
            },
          },
          {
            name: "Sushi rodent alert SF, score < 85",
            existingConfigs: [
              agentConfig("news_headlines_24h"),
              agentConfig("historical_sites_search"),
              agentConfig("crypto_price_tracker_hourly"),
            ],
            availableTools: [
              tool("health_inspection_db"),
              tool("news_search"),
              tool("google_search"),
              tool("city_events_search"),
              tool("movie_db_search"),
            ],
            input:
              "Monitor sushi restaurants in San Francisco; alert when latest health-inspection score < 85 AND ‘rodent’ appears in violations.",
            expected: {
              RESPONSE_TYPE: "CREATE_AGENT_CONFIG",
              RESPONSE_CREATE_AGENT_CONFIG: {
                tools: ["health_inspection_db"],
                agent_type: expect.any(String),
                instructions: expect.stringContaining("85"),
                description: expect.any(String),
              },
            },
          },
          {
            name: "BTC & ETH daytime tracker (skip weekends)",
            existingConfigs: [
              agentConfig("news_headlines_24h"),
              agentConfig("historical_sites_search"),
              agentConfig("flight_tracker_daily"),
            ],
            availableTools: [
              tool("crypto_price_feed"),
              tool("news_search"),
              tool("google_search"),
              tool("weather_alert_feed"),
              tool("podcast_search"),
            ],
            input:
              "Track Bitcoin and Ethereum prices hourly between 06:00 and 18:00 Prague time, Monday–Friday only, alert on ±2 % swings.",
            expected: {
              RESPONSE_TYPE: "CREATE_AGENT_CONFIG",
              RESPONSE_CREATE_AGENT_CONFIG: {
                tools: ["crypto_price_feed"],
                agent_type: expect.any(String),
                instructions: expect.stringContaining("18:00"),
                description: expect.any(String),
              },
            },
          },
          {
            name: "Berlin outdoor concerts ≤ €30 in August",
            existingConfigs: [
              agentConfig("city_events_weekend"),
              agentConfig("news_headlines_24h"),
              agentConfig("flight_price_tracker_weekly"),
            ],
            availableTools: [
              tool("city_events_search"),
              tool("weather_alert_feed"),
              tool("google_search"),
              tool("news_search"),
              tool("podcast_search"),
            ],
            input:
              "Find family-friendly outdoor concerts in Berlin during August with ticket prices below €30 and a user rating above 4★.",
            expected: {
              RESPONSE_TYPE: "CREATE_AGENT_CONFIG",
              RESPONSE_CREATE_AGENT_CONFIG: {
                tools: ["city_events_search"],
                agent_type: expect.any(String),
                instructions: expect.stringContaining("€30"),
                description: expect.any(String),
              },
            },
          },
          {
            name: "Quantum-computing papers 2025 < 250-word abstract",
            existingConfigs: [
              agentConfig("arxiv_rl_daily"),
              agentConfig("news_headlines_24h"),
              agentConfig("historical_sites_search"),
            ],
            availableTools: [
              tool("arxiv_search"),
              tool("google_search"),
              tool("news_search"),
              tool("crypto_price_feed"),
              tool("podcast_search"),
            ],
            input:
              "Send me arXiv quantum-computing papers published in 2025 whose abstracts are < 250 words; summarise in two bullets.",
            expected: {
              RESPONSE_TYPE: "CREATE_AGENT_CONFIG",
              RESPONSE_CREATE_AGENT_CONFIG: {
                tools: ["arxiv_search"],
                agent_type: expect.any(String),
                instructions: expect.stringContaining("250"),
                description: expect.any(String),
              },
            },
          },
          {
            name: "Miami hurricane warnings < 200 km June–Nov",
            existingConfigs: [
              agentConfig("weather_tornado_immediate"),
              agentConfig("news_headlines_24h"),
              agentConfig("historical_sites_search"),
            ],
            availableTools: [
              tool("weather_alert_feed"),
              tool("news_search"),
              tool("google_search"),
              tool("crypto_price_feed"),
              tool("city_events_search"),
            ],
            input:
              "Send daily alerts for hurricane warnings within 200 km of Miami during June through November; include severity level.",
            expected: {
              RESPONSE_TYPE: "CREATE_AGENT_CONFIG",
              RESPONSE_CREATE_AGENT_CONFIG: {
                tools: ["weather_alert_feed"],
                agent_type: expect.any(String),
                instructions: expect.stringContaining("200 km"),
                description: expect.any(String),
              },
            },
          },
          {
            name: "LA↔Tokyo flights April bags×2 < $700",
            existingConfigs: [
              agentConfig("flight_tracker_daily"),
              agentConfig("news_headlines_24h"),
              agentConfig("crypto_price_tracker_hourly"),
            ],
            availableTools: [
              tool("flight_price_tracker"),
              tool("google_search"),
              tool("weather_alert_feed"),
              tool("city_events_search"),
              tool("podcast_search"),
            ],
            input:
              "Monitor round-trip fares from Los Angeles to Tokyo for travel in April; alert when price < $700 and airline includes two free checked bags.",
            expected: {
              RESPONSE_TYPE: "CREATE_AGENT_CONFIG",
              RESPONSE_CREATE_AGENT_CONFIG: {
                tools: ["flight_price_tracker"],
                agent_type: expect.any(String),
                instructions: expect.stringContaining("$700"),
                description: expect.any(String),
              },
            },
          },
          {
            name: "PG-13 sci-fi movies 1–31 May runtime < 140 min",
            existingConfigs: [
              agentConfig("scifi_movies_weekly"),
              agentConfig("news_headlines_24h"),
              agentConfig("historical_sites_search"),
            ],
            availableTools: [
              tool("movie_db_search"),
              tool("google_search"),
              tool("news_search"),
              tool("podcast_search"),
              tool("crypto_price_feed"),
            ],
            input:
              "Weekly list of sci-fi movies releasing between 1 May and 31 May 2025 that are rated PG-13 and shorter than 140 minutes.",
            expected: {
              RESPONSE_TYPE: "CREATE_AGENT_CONFIG",
              RESPONSE_CREATE_AGENT_CONFIG: {
                tools: ["movie_db_search"],
                agent_type: expect.any(String),
                instructions: expect.stringContaining("140"),
                description: expect.any(String),
              },
            },
          },
          {
            name: "Spanish biz vocab 09:00 weekdays, numeric examples",
            existingConfigs: [
              agentConfig("phrase_generator"),
              agentConfig("news_headlines_24h"),
              agentConfig("historical_sites_search"),
            ],
            availableTools: [
              tool("phrase_generator"),
              tool("google_search"),
              tool("news_search"),
              tool("city_events_search"),
              tool("podcast_search"),
            ],
            input:
              "Generate a Spanish business vocabulary list every weekday at 09:00 with at least one numeric example sentence.",
            expected: {
              RESPONSE_TYPE: "CREATE_AGENT_CONFIG",
              RESPONSE_CREATE_AGENT_CONFIG: {
                tools: ["phrase_generator"],
                agent_type: expect.any(String),
                instructions: expect.stringContaining("09:00"),
                description: expect.any(String),
              },
            },
          },
          {
            name: "FAANG insider-trading filings < 48 h",
            existingConfigs: [
              agentConfig("news_headlines_24h"),
              agentConfig("crypto_price_tracker_hourly"),
              agentConfig("historical_sites_search"),
            ],
            availableTools: [
              tool("sec_filings_search"),
              tool("google_search"),
              tool("news_search"),
              tool("crypto_price_feed"),
              tool("podcast_search"),
            ],
            input:
              "Collect any SEC filings from FAANG companies mentioning insider trading in the past 48 hours and summarise key points.",
            expected: {
              RESPONSE_TYPE: "CREATE_AGENT_CONFIG",
              RESPONSE_CREATE_AGENT_CONFIG: {
                tools: ["sec_filings_search"],
                agent_type: expect.any(String),
                instructions: expect.stringContaining("48"),
                description: expect.any(String),
              },
            },
          },
        ]);
      });
    });

    /* ---------- 3 · COMPLEX -------------------------------------------- */
    describe("Complex", () => {
      /* L-1 – many configs · 5–8 tools (2 relevant) ----------------------- */
      describe("Low complexity (L-1)", () => {
        testGenerator([
          {
            name: "Market sentiment for Bitcoin & Ethereum (prices + headlines)",
            existingConfigs: [
              agentConfig("news_headlines_24h"),
              agentConfig("historical_sites_search"),
              agentConfig("crypto_price_tracker_hourly"),
            ],
            availableTools: [
              tool("crypto_price_feed"),
              tool("news_search"),
              tool("google_search"),
              tool("sec_filings_search"),
              tool("city_events_search"),
            ],
            input:
              "Track Bitcoin and Ethereum price movements in real time and collect the latest crypto-related headlines so I can gauge overall market sentiment.",
            expected: {
              RESPONSE_TYPE: "CREATE_AGENT_CONFIG",
              RESPONSE_CREATE_AGENT_CONFIG: {
                tools: expect.arrayContaining([
                  "crypto_price_feed",
                  "news_search",
                ]),
                agent_type: expect.any(String),
                instructions: expect.stringContaining("sentiment"),
                description: expect.any(String),
              },
            },
          },

          {
            name: "Academic buzz on quantum gravity",
            existingConfigs: [
              agentConfig("news_headlines_24h"),
              agentConfig("historical_sites_search"),
              agentConfig("crypto_price_tracker_hourly"),
              agentConfig("flight_tracker_daily"),
            ],
            availableTools: [
              tool("arxiv_search"),
              tool("news_search"),
              tool("google_search"),
              tool("sec_filings_search"),
              tool("city_events_search"),
            ],
            input:
              "Each day gather newly published arXiv papers that mention “quantum gravity” and the latest science-news headlines covering the same topic.",
            expected: {
              RESPONSE_TYPE: "CREATE_AGENT_CONFIG",
              RESPONSE_CREATE_AGENT_CONFIG: {
                tools: expect.arrayContaining(["arxiv_search", "news_search"]),
                agent_type: expect.any(String),
                instructions: expect.stringContaining("quantum gravity"),
                description: expect.any(String),
              },
            },
          },
          {
            name: "Market mood for renewable energy stocks",
            existingConfigs: [
              agentConfig("news_headlines_24h"),
              agentConfig("historical_sites_search"),
              agentConfig("flight_tracker_daily"),
              agentConfig("crypto_price_tracker_hourly"),
            ],
            availableTools: [
              tool("news_search"),
              tool("sec_filings_search"),
              tool("google_search"),
              tool("crypto_price_feed"),
              tool("podcast_search"),
              tool("city_events_search"),
            ],
            input:
              "Monitor SEC filings that mention ESG by major renewable-energy companies and collect the latest headlines about renewable-energy stocks each day.",
            expected: {
              RESPONSE_TYPE: "CREATE_AGENT_CONFIG",
              RESPONSE_CREATE_AGENT_CONFIG: {
                tools: expect.arrayContaining([
                  "news_search",
                  "sec_filings_search",
                ]),
                agent_type: expect.any(String),
                instructions: expect.stringContaining("ESG"),
                description: expect.any(String),
              },
            },
          },
          {
            name: "Public sentiment on space tourism",
            existingConfigs: [
              agentConfig("news_headlines_24h"),
              agentConfig("historical_sites_search"),
              agentConfig("flight_tracker_daily"),
              agentConfig("podcast_ai_weekly"),
            ],
            availableTools: [
              tool("news_search"),
              tool("podcast_search"),
              tool("google_search"),
              tool("crypto_price_feed"),
              tool("sec_filings_search"),
            ],
            input:
              "Daily collect news headlines containing “space tourism” and podcast episodes released in the last 7 days discussing space tourism; give short summaries.",
            expected: {
              RESPONSE_TYPE: "CREATE_AGENT_CONFIG",
              RESPONSE_CREATE_AGENT_CONFIG: {
                tools: expect.arrayContaining([
                  "news_search",
                  "podcast_search",
                ]),
                agent_type: expect.any(String),
                instructions: expect.stringContaining("space tourism"),
                description: expect.any(String),
              },
            },
          },
          {
            name: "Watch corporate filings & headlines on quantum chips",
            existingConfigs: [
              agentConfig("news_headlines_24h"),
              agentConfig("crypto_price_tracker_hourly"),
              agentConfig("flight_tracker_daily"),
              agentConfig("arxiv_rl_daily"),
            ],
            availableTools: [
              tool("news_search"),
              tool("sec_filings_search"),
              tool("google_search"),
              tool("podcast_search"),
              tool("city_events_search"),
              tool("crypto_price_feed"),
            ],
            input:
              "Monitor SEC filings that mention “quantum chip” and gather matching news headlines; send a daily summary.",
            expected: {
              RESPONSE_TYPE: "CREATE_AGENT_CONFIG",
              RESPONSE_CREATE_AGENT_CONFIG: {
                tools: expect.arrayContaining([
                  "news_search",
                  "sec_filings_search",
                ]),
                agent_type: expect.any(String),
                instructions: expect.stringContaining("quantum chip"),
                description: expect.any(String),
              },
            },
          },
          {
            name: "AI ethics chatter tracker",
            existingConfigs: [
              agentConfig("news_headlines_24h"),
              agentConfig("historical_sites_search"),
              agentConfig("podcast_ai_weekly"),
              agentConfig("flight_tracker_daily"),
            ],
            availableTools: [
              tool("news_search"),
              tool("podcast_search"),
              tool("google_search"),
              tool("sec_filings_search"),
              tool("city_events_search"),
            ],
            input:
              "Gather daily news headlines and podcast episodes that discuss “AI ethics” so I can monitor the conversation.",
            expected: {
              RESPONSE_TYPE: "CREATE_AGENT_CONFIG",
              RESPONSE_CREATE_AGENT_CONFIG: {
                tools: expect.arrayContaining([
                  "news_search",
                  "podcast_search",
                ]),
                agent_type: expect.any(String),
                instructions: expect.stringContaining("AI ethics"),
                description: expect.any(String),
              },
            },
          },
          {
            name: "On-chain buzz for memecoins",
            existingConfigs: [
              agentConfig("news_headlines_24h"),
              agentConfig("crypto_price_tracker_hourly"),
              agentConfig("podcast_ai_weekly"),
              agentConfig("flight_tracker_daily"),
            ],
            availableTools: [
              tool("crypto_price_feed"),
              tool("news_search"),
              tool("google_search"),
              tool("podcast_search"),
              tool("sec_filings_search"),
            ],
            input:
              "Track Dogecoin and Shiba Inu prices every hour and collect matching crypto-news headlines; highlight any price swing larger than 4 %.",
            expected: {
              RESPONSE_TYPE: "CREATE_AGENT_CONFIG",
              RESPONSE_CREATE_AGENT_CONFIG: {
                tools: expect.arrayContaining([
                  "crypto_price_feed",
                  "news_search",
                ]),
                agent_type: expect.any(String),
                instructions: expect.stringContaining("Dogecoin"),
                description: expect.any(String),
              },
            },
          },
          {
            name: "Cultural heritage talk tracker",
            existingConfigs: [
              agentConfig("historical_sites_search"),
              agentConfig("news_headlines_24h"),
              agentConfig("podcast_ai_weekly"),
              agentConfig("flight_tracker_daily"),
            ],
            availableTools: [
              tool("historical_sites_search_api"),
              tool("news_search"),
              tool("google_search"),
              tool("podcast_search"),
              tool("city_events_search"),
            ],
            input:
              "Whenever a new UNESCO World Heritage site is proposed, collect its details and any news headlines about it.",
            expected: {
              RESPONSE_TYPE: "CREATE_AGENT_CONFIG",
              RESPONSE_CREATE_AGENT_CONFIG: {
                tools: expect.arrayContaining([
                  "historical_sites_search_api",
                  "news_search",
                ]),
                agent_type: expect.any(String),
                instructions: expect.stringContaining("UNESCO"),
                description: expect.any(String),
              },
            },
          },
          {
            name: "Cryptocurrency regulation rumours",
            existingConfigs: [
              agentConfig("news_headlines_24h"),
              agentConfig("crypto_price_tracker_hourly"),
              agentConfig("podcast_ai_weekly"),
            ],
            availableTools: [
              tool("news_search"),
              tool("sec_filings_search"),
              tool("google_search"),
              tool("podcast_search"),
              tool("crypto_price_feed"),
            ],
            input:
              "Collect breaking news headlines and recent SEC filings that mention forthcoming cryptocurrency regulation; summarise key points.",
            expected: {
              RESPONSE_TYPE: "CREATE_AGENT_CONFIG",
              RESPONSE_CREATE_AGENT_CONFIG: {
                tools: expect.arrayContaining([
                  "news_search",
                  "sec_filings_search",
                ]),
                agent_type: expect.any(String),
                instructions: expect.stringContaining("regulation"),
                description: expect.any(String),
              },
            },
          },
          {
            name: "Electric-car battery breakthroughs",
            existingConfigs: [
              agentConfig("news_headlines_24h"),
              agentConfig("flight_tracker_daily"),
              agentConfig("historical_sites_search"),
            ],
            availableTools: [
              tool("news_search"),
              tool("arxiv_search"),
              tool("google_search"),
              tool("podcast_search"),
              tool("sec_filings_search"),
            ],
            input:
              "Gather the latest arXiv papers and news headlines on electric-car battery breakthroughs each morning.",
            expected: {
              RESPONSE_TYPE: "CREATE_AGENT_CONFIG",
              RESPONSE_CREATE_AGENT_CONFIG: {
                tools: expect.arrayContaining(["news_search", "arxiv_search"]),
                agent_type: expect.any(String),
                instructions: expect.stringContaining("battery"),
                description: expect.any(String),
              },
            },
          },
        ]);
      });

      /* L-2 – overlapping configs · 8–10 tools (3 relevant) -------------- */
      describe("Medium complexity (L-2)", () => {
        testGenerator([
          {
            name: "Conditional: alert on cheap flight then show 5-day weather forecast",
            existingConfigs: [
              agentConfig("news_headlines_24h"),
              agentConfig("flight_tracker_daily"),
              agentConfig("crypto_price_tracker_hourly"),
            ],
            availableTools: [
              tool("flight_price_tracker"),
              tool("weather_alert_feed"),
              tool("news_search"),
              tool("google_search"),
              tool("podcast_search"),
              tool("city_events_search"),
              tool("crypto_price_feed"),
              tool("historical_sites_search_api"),
              tool("arxiv_search"),
              tool("movie_db_search"),
            ],
            input:
              "If flights from San Francisco to Maui next month drop below $400, alert me and send the current 5-day weather outlook for Maui.",
            expected: {
              RESPONSE_TYPE: "CREATE_AGENT_CONFIG",
              RESPONSE_CREATE_AGENT_CONFIG: {
                tools: expect.arrayContaining([
                  "flight_price_tracker",
                  "weather_alert_feed",
                ]),
                agent_type: expect.any(String),
                instructions: expect.stringContaining("$400"),
                description: expect.any(String),
              },
            },
          },
          {
            name: "BTC crash → news + filings report",
            existingConfigs: [
              agentConfig("news_headlines_24h"),
              agentConfig("crypto_price_tracker_hourly"),
              agentConfig("flight_tracker_daily"),
            ],
            availableTools: [
              tool("crypto_price_feed"),
              tool("news_search"),
              tool("sec_filings_search"),
              tool("google_search"),
              tool("podcast_search"),
              tool("city_events_search"),
              tool("flight_price_tracker"),
              tool("weather_alert_feed"),
              tool("arxiv_search"),
              tool("movie_db_search"),
            ],
            input:
              "If Bitcoin drops more than 5 % in a day, send me the latest crypto headlines and any SEC filings that mention Bitcoin.",
            expected: {
              RESPONSE_TYPE: "CREATE_AGENT_CONFIG",
              RESPONSE_CREATE_AGENT_CONFIG: {
                tools: expect.arrayContaining([
                  "crypto_price_feed",
                  "news_search",
                  "sec_filings_search",
                ]),
                agent_type: expect.any(String),
                instructions: expect.stringContaining("5"),
                description: expect.any(String),
              },
            },
          },
          {
            name: "Paris→Rome flight deal → events + weather",
            existingConfigs: [
              agentConfig("flight_tracker_daily"),
              agentConfig("news_headlines_24h"),
              agentConfig("crypto_price_tracker_hourly"),
            ],
            availableTools: [
              tool("flight_price_tracker"),
              tool("city_events_search"),
              tool("weather_alert_feed"),
              tool("news_search"),
              tool("google_search"),
              tool("podcast_search"),
              tool("crypto_price_feed"),
              tool("historical_sites_search_api"),
              tool("arxiv_search"),
              tool("movie_db_search"),
            ],
            input:
              "If flights from Paris to Rome next month drop below €150, alert me and include a 5-day Rome weather outlook and top weekend events.",
            expected: {
              RESPONSE_TYPE: "CREATE_AGENT_CONFIG",
              RESPONSE_CREATE_AGENT_CONFIG: {
                tools: expect.arrayContaining([
                  "flight_price_tracker",
                  "weather_alert_feed",
                  "city_events_search",
                ]),
                agent_type: expect.any(String),
                instructions: expect.stringContaining("€150"),
                description: expect.any(String),
              },
            },
          },
          {
            name: "Daily AI mega-digest (papers, podcasts, news)",
            existingConfigs: [
              agentConfig("news_headlines_24h"),
              agentConfig("arxiv_rl_daily"),
              agentConfig("podcast_ai_weekly"),
            ],
            availableTools: [
              tool("arxiv_search"),
              tool("podcast_search"),
              tool("news_search"),
              tool("google_search"),
              tool("crypto_price_feed"),
              tool("sec_filings_search"),
              tool("city_events_search"),
              tool("flight_price_tracker"),
              tool("weather_alert_feed"),
              tool("movie_db_search"),
            ],
            input:
              "Breakfast brief: latest AI arXiv papers, top AI podcasts, and AI-related news headlines in one digest.",
            expected: {
              RESPONSE_TYPE: "CREATE_AGENT_CONFIG",
              RESPONSE_CREATE_AGENT_CONFIG: {
                tools: expect.arrayContaining([
                  "arxiv_search",
                  "podcast_search",
                  "news_search",
                ]),
                agent_type: expect.any(String),
                instructions: expect.stringContaining("digest"),
                description: expect.any(String),
              },
            },
          },
          {
            name: "Tokyo storm alert → news + flight price",
            existingConfigs: [
              agentConfig("weather_tornado_immediate"),
              agentConfig("flight_tracker_daily"),
              agentConfig("news_headlines_24h"),
            ],
            availableTools: [
              tool("weather_alert_feed"),
              tool("news_search"),
              tool("flight_price_tracker"),
              tool("google_search"),
              tool("podcast_search"),
              tool("crypto_price_feed"),
              tool("sec_filings_search"),
              tool("city_events_search"),
              tool("arxiv_search"),
              tool("movie_db_search"),
            ],
            input:
              "If severe storm alerts are issued for Tokyo, fetch the latest news headlines and PRG→NRT flight-price changes.",
            expected: {
              RESPONSE_TYPE: "CREATE_AGENT_CONFIG",
              RESPONSE_CREATE_AGENT_CONFIG: {
                tools: expect.arrayContaining([
                  "weather_alert_feed",
                  "news_search",
                  "flight_price_tracker",
                ]),
                agent_type: expect.any(String),
                instructions: expect.stringContaining("storm"),
                description: expect.any(String),
              },
            },
          },
          {
            name: "ETH > $4 000 → filings + podcasts",
            existingConfigs: [
              agentConfig("crypto_price_tracker_hourly"),
              agentConfig("news_headlines_24h"),
              agentConfig("podcast_ai_weekly"),
            ],
            availableTools: [
              tool("crypto_price_feed"),
              tool("sec_filings_search"),
              tool("podcast_search"),
              tool("news_search"),
              tool("google_search"),
              tool("city_events_search"),
              tool("flight_price_tracker"),
              tool("weather_alert_feed"),
              tool("arxiv_search"),
              tool("movie_db_search"),
            ],
            input:
              "When Ethereum crosses $4 000, send relevant SEC filings and the latest crypto podcasts.",
            expected: {
              RESPONSE_TYPE: "CREATE_AGENT_CONFIG",
              RESPONSE_CREATE_AGENT_CONFIG: {
                tools: expect.arrayContaining([
                  "crypto_price_feed",
                  "sec_filings_search",
                  "podcast_search",
                ]),
                agent_type: expect.any(String),
                instructions: expect.stringContaining("4 000"),
                description: expect.any(String),
              },
            },
          },
          {
            name: "UNESCO update → site + news + events",
            existingConfigs: [
              agentConfig("historical_sites_search"),
              agentConfig("news_headlines_24h"),
              agentConfig("city_events_weekend"),
            ],
            availableTools: [
              tool("historical_sites_search_api"),
              tool("news_search"),
              tool("city_events_search"),
              tool("google_search"),
              tool("weather_alert_feed"),
              tool("podcast_search"),
              tool("crypto_price_feed"),
              tool("sec_filings_search"),
              tool("arxiv_search"),
              tool("movie_db_search"),
            ],
            input:
              "Whenever a new UNESCO heritage site is announced in Europe, send site details, related headlines, and top cultural events nearby.",
            expected: {
              RESPONSE_TYPE: "CREATE_AGENT_CONFIG",
              RESPONSE_CREATE_AGENT_CONFIG: {
                tools: expect.arrayContaining([
                  "historical_sites_search_api",
                  "news_search",
                  "city_events_search",
                ]),
                agent_type: expect.any(String),
                instructions: expect.stringContaining("heritage"),
                description: expect.any(String),
              },
            },
          },
          {
            name: "Insider-trading filings → news + google sentiment",
            existingConfigs: [
              agentConfig("news_headlines_24h"),
              agentConfig("flight_tracker_daily"),
              agentConfig("crypto_price_tracker_hourly"),
            ],
            availableTools: [
              tool("sec_filings_search"),
              tool("google_search"),
              tool("news_search"),
              tool("city_events_search"),
              tool("podcast_search"),
              tool("crypto_price_feed"),
              tool("weather_alert_feed"),
              tool("arxiv_search"),
              tool("movie_db_search"),
            ],
            input:
              "When new insider-trading SEC filings appear, compile market-sentiment snippets from Google and list the top related headlines.",
            expected: {
              RESPONSE_TYPE: "CREATE_AGENT_CONFIG",
              RESPONSE_CREATE_AGENT_CONFIG: {
                tools: expect.arrayContaining([
                  "sec_filings_search",
                  "google_search",
                  "news_search",
                ]),
                agent_type: expect.any(String),
                instructions: expect.stringContaining("insider"),
                description: expect.any(String),
              },
            },
          },
          {
            name: "Food-safety alerts → inspections + news + events",
            existingConfigs: [
              agentConfig("city_events_weekend"),
              agentConfig("news_headlines_24h"),
              agentConfig("historical_sites_search"),
            ],
            availableTools: [
              tool("health_inspection_db"),
              tool("news_search"),
              tool("city_events_search"),
              tool("google_search"),
              tool("podcast_search"),
              tool("weather_alert_feed"),
              tool("crypto_price_feed"),
              tool("arxiv_search"),
              tool("movie_db_search"),
              tool("flight_price_tracker"),
            ],
            input:
              "Each day collect any restaurant scoring below 80, link related headlines, and suggest a safe alternative event nearby.",
            expected: {
              RESPONSE_TYPE: "CREATE_AGENT_CONFIG",
              RESPONSE_CREATE_AGENT_CONFIG: {
                tools: expect.arrayContaining([
                  "health_inspection_db",
                  "news_search",
                  "city_events_search",
                ]),
                agent_type: expect.any(String),
                instructions: expect.stringContaining("80"),
                description: expect.any(String),
              },
            },
          },
          {
            name: "Tornado watch → weather + news + events",
            existingConfigs: [
              agentConfig("weather_tornado_immediate"),
              agentConfig("news_headlines_24h"),
              agentConfig("city_events_weekend"),
            ],
            availableTools: [
              tool("weather_alert_feed"),
              tool("news_search"),
              tool("city_events_search"),
              tool("google_search"),
              tool("podcast_search"),
              tool("crypto_price_feed"),
              tool("flight_price_tracker"),
              tool("sec_filings_search"),
              tool("arxiv_search"),
              tool("movie_db_search"),
            ],
            input:
              "If a tornado watch is issued within 60 km, send a 5-day forecast, latest local headlines, and any shelter events.",
            expected: {
              RESPONSE_TYPE: "CREATE_AGENT_CONFIG",
              RESPONSE_CREATE_AGENT_CONFIG: {
                tools: expect.arrayContaining([
                  "weather_alert_feed",
                  "news_search",
                  "city_events_search",
                ]),
                agent_type: expect.any(String),
                instructions: expect.stringContaining("60"),
                description: expect.any(String),
              },
            },
          },
        ]);
      });

      /* L-3 – large config set · 10+ tools (nested ask) ------------------ */
      describe("High complexity (L-3)", () => {
        const allTools = [
          tool("crypto_price_feed"),
          tool("sec_filings_search"),
          tool("news_search"),
          tool("podcast_search"),
          tool("historical_sites_search_api"),
          tool("city_events_search"),
          tool("weather_alert_feed"),
          tool("flight_price_tracker"),
          tool("movie_db_search"),
          tool("arxiv_search"),
          tool("google_search"),
          tool("health_inspection_db"),
          tool("phrase_generator"),
        ];

        const bigConfigSet = [
          agentConfig("news_headlines_24h"),
          agentConfig("crypto_price_tracker_hourly"),
          agentConfig("flight_tracker_daily"),
          agentConfig("historical_sites_search"),
          agentConfig("podcast_ai_weekly"),
          agentConfig("weather_tornado_immediate"),
          agentConfig("scifi_movies_weekly"),
          agentConfig("arxiv_rl_daily"),
          agentConfig("city_events_weekend"),
          agentConfig("flight_price_tracker_weekly"),
        ];

        testGenerator([
          {
            name: "Composite crypto digest (on-chain sentiment + SEC filings + news)",
            existingConfigs: [
              agentConfig("news_headlines_24h"),
              agentConfig("crypto_price_tracker_hourly"),
              agentConfig("flight_tracker_daily"),
              agentConfig("historical_sites_search"),
            ],
            availableTools: [
              tool("crypto_price_feed"),
              tool("sec_filings_search"),
              tool("news_search"),
              tool("google_search"),
              tool("podcast_search"),
              tool("city_events_search"),
              tool("weather_alert_feed"),
              tool("arxiv_search"),
              tool("movie_db_search"),
              tool("historical_sites_search_api"),
              tool("phrase_generator"),
            ],
            input:
              "Create a daily morning report combining on-chain sentiment for Bitcoin, the latest SEC filings that mention cryptocurrency, and the day’s top crypto headlines. Summarise everything in one digest.",
            expected: {
              RESPONSE_TYPE: "CREATE_AGENT_CONFIG",
              RESPONSE_CREATE_AGENT_CONFIG: {
                tools: expect.arrayContaining([
                  "crypto_price_feed",
                  "sec_filings_search",
                  "news_search",
                ]),
                agent_type: expect.any(String),
                instructions: expect.any(String),
                description: expect.any(String),
              },
            },
          },
          {
            name: "Daily crypto fear-and-greed digest",
            existingConfigs: bigConfigSet,
            availableTools: allTools,
            input:
              "Each morning create a fear-and-greed index for Bitcoin using on-chain sentiment (price feed), SEC filings mentioning crypto, and top crypto news headlines. Summarise insights in one digest.",
            expected: {
              RESPONSE_TYPE: "CREATE_AGENT_CONFIG",
              RESPONSE_CREATE_AGENT_CONFIG: {
                tools: expect.arrayContaining([
                  "crypto_price_feed",
                  "sec_filings_search",
                  "news_search",
                ]),
                agent_type: expect.any(String),
                instructions: expect.stringContaining("fear"),
                description: expect.any(String),
              },
            },
          },
          {
            name: "Weekly sustainability market digest",
            existingConfigs: bigConfigSet,
            availableTools: allTools,
            input:
              "Produce a weekly sustainability market report combining headlines on green energy, SEC filings that mention ESG, and 5-day weather alerts for wildfire-prone regions.",
            expected: {
              RESPONSE_TYPE: "CREATE_AGENT_CONFIG",
              RESPONSE_CREATE_AGENT_CONFIG: {
                tools: expect.arrayContaining([
                  "news_search",
                  "sec_filings_search",
                  "weather_alert_feed",
                ]),
                agent_type: expect.any(String),
                instructions: expect.stringContaining("sustainability"),
                description: expect.any(String),
              },
            },
          },
          {
            name: "Morning AI super-digest",
            existingConfigs: bigConfigSet,
            availableTools: allTools,
            input:
              "Create a morning AI digest that merges new arXiv AI papers, SEC filings mentioning AI, and AI podcasts, highlighting any overlaps.",
            expected: {
              RESPONSE_TYPE: "CREATE_AGENT_CONFIG",
              RESPONSE_CREATE_AGENT_CONFIG: {
                tools: expect.arrayContaining([
                  "arxiv_search",
                  "sec_filings_search",
                  "podcast_search",
                ]),
                agent_type: expect.any(String),
                instructions: expect.stringContaining("digest"),
                description: expect.any(String),
              },
            },
          },
          {
            name: "Travel brief: flights, weather, events",
            existingConfigs: bigConfigSet,
            availableTools: allTools,
            input:
              "Generate a daily travel brief that checks the cheapest PRG→JFK flight, NYC weather alerts, and top weekend events.",
            expected: {
              RESPONSE_TYPE: "CREATE_AGENT_CONFIG",
              RESPONSE_CREATE_AGENT_CONFIG: {
                tools: expect.arrayContaining([
                  "flight_price_tracker",
                  "weather_alert_feed",
                  "city_events_search",
                ]),
                agent_type: expect.any(String),
                instructions: expect.stringContaining("PRG"),
                description: expect.any(String),
              },
            },
          },
          {
            name: "Film-buff digest: movies, podcasts, news",
            existingConfigs: bigConfigSet,
            availableTools: allTools,
            input:
              "Every Friday compile upcoming sci-fi movies, related podcasts, and top headlines; present as a single digest.",
            expected: {
              RESPONSE_TYPE: "CREATE_AGENT_CONFIG",
              RESPONSE_CREATE_AGENT_CONFIG: {
                tools: expect.arrayContaining([
                  "movie_db_search",
                  "podcast_search",
                  "news_search",
                ]),
                agent_type: expect.any(String),
                instructions: expect.stringContaining("digest"),
                description: expect.any(String),
              },
            },
          },
          {
            name: "Global climate-change report",
            existingConfigs: bigConfigSet,
            availableTools: allTools,
            input:
              "Daily climate-change report: newest arXiv climate papers, severe weather alerts worldwide, and policy headlines.",
            expected: {
              RESPONSE_TYPE: "CREATE_AGENT_CONFIG",
              RESPONSE_CREATE_AGENT_CONFIG: {
                tools: expect.arrayContaining([
                  "arxiv_search",
                  "weather_alert_feed",
                  "news_search",
                ]),
                agent_type: expect.any(String),
                instructions: expect.stringContaining("climate"),
                description: expect.any(String),
              },
            },
          },
          {
            name: "Flight deal to Bali → weather & filings",
            existingConfigs: bigConfigSet,
            availableTools: allTools,
            input:
              "If flights from SFO to Bali drop below $500, send a 5-day Bali weather outlook and any SEC filings by major airlines.",
            expected: {
              RESPONSE_TYPE: "CREATE_AGENT_CONFIG",
              RESPONSE_CREATE_AGENT_CONFIG: {
                tools: expect.arrayContaining([
                  "flight_price_tracker",
                  "weather_alert_feed",
                  "sec_filings_search",
                ]),
                agent_type: expect.any(String),
                instructions: expect.stringContaining("$500"),
                description: expect.any(String),
              },
            },
          },
          {
            name: "UNESCO heritage digest",
            existingConfigs: bigConfigSet,
            availableTools: allTools,
            input:
              "Create a daily digest of new UNESCO heritage site updates, related headlines, and relevant archaeology podcasts.",
            expected: {
              RESPONSE_TYPE: "CREATE_AGENT_CONFIG",
              RESPONSE_CREATE_AGENT_CONFIG: {
                tools: expect.arrayContaining([
                  "historical_sites_search_api",
                  "news_search",
                  "podcast_search",
                ]),
                agent_type: expect.any(String),
                instructions: expect.stringContaining("heritage"),
                description: expect.any(String),
              },
            },
          },
          {
            name: "Restaurant safety composite alert",
            existingConfigs: bigConfigSet,
            availableTools: allTools,
            input:
              "Compile a composite daily alert that merges restaurants scoring < 75, any headlines about them, and city events scheduled at the same venues.",
            expected: {
              RESPONSE_TYPE: "CREATE_AGENT_CONFIG",
              RESPONSE_CREATE_AGENT_CONFIG: {
                tools: expect.arrayContaining([
                  "health_inspection_db",
                  "news_search",
                  "city_events_search",
                ]),
                agent_type: expect.any(String),
                instructions: expect.stringContaining("75"),
                description: expect.any(String),
              },
            },
          },
        ]);
      });
    });
  });
  /**
   * ============================================================================
   * TEST-MATRIX · UPDATE_AGENT_CONFIG
   * ============================================================================
   *
   *
   * Use these guidelines when the agent **should update an existing
   * configuration** rather than create a new one or choose from the list.
   *
   * Grid: 3 outer categories (how many configs and their overlap) ×
   *       3 inner levels (complexity of the requested changes).
   *
   *
   *
   * ── Legend ────────────────────────────────────────────────────────────────
   *   • Environment → existingConfigs & availableTools shown to the agent
   *   • Prompt      → how the user expresses the desired change
   *   • Reasoning   → main decision hurdle for the LLM
   *   • Assert      → key `expect()` check for that cell
   * ------------------------------------------------------------------------
   *
   * 1. TARGETED  (straightforward tweak)
   * ──────────────────────────────────────────────────────────────────────────
   *   L-1
   *     Environment : exactly 1 config · tools subset unchanged
   *     Prompt      : explicit reference (“Update the headlines agent …”)
   *     Reasoning   : locate by name → small field edit
   *     Assert      : RESPONSE_TYPE === "UPDATE_AGENT_CONFIG"
   *
   *   L-2
   *     Environment : 1 config · same tool list
   *     Prompt      : multiple, clear tweaks (time window + new keyword)
   *     Reasoning   : update 2–3 fields in place
   *     Assert      : those fields appear in RESPONSE_UPDATE_AGENT_CONFIG
   *
   *   L-3
   *     Environment : 1 config · tools list unchanged
   *     Prompt      : amendment + output-format change
   *     Reasoning   : patch instructions as well as parameters
   *     Assert      : instructions text is modified accordingly
   *
   * 2. MODERATE  (broader revision, some clutter)
   * ──────────────────────────────────────────────────────────────────────────
   *   L-1
   *     Environment : 2 configs (one relevant) · 3–4 tools
   *     Prompt      : “Make the crypto tracker weekly instead of hourly.”
   *     Reasoning   : pick correct config, ignore the unrelated one
   *     Assert      : only the targeted config id is updated
   *
   *   L-2
   *     Environment : 2–3 configs · 4–5 tools
   *     Prompt      : add a second tool *and* adjust a schedule
   *     Reasoning   : extend `tools` array & mutate schedule field
   *     Assert      : new tool appears; obsolete ones untouched
   *
   *   L-3
   *     Environment : several configs incl. a near-match
   *     Prompt      : “Localise the events agent output to Spanish
   *                   and include ticket price ceilings.”
   *     Reasoning   : choose best candidate, update language + add constraint
   *     Assert      : language + new constraint present, wrong agent not touched
   *
   * 3. COMPLEX  (ambiguous reference, dense ecosystem)
   * ──────────────────────────────────────────────────────────────────────────
   *   L-1
   *     Environment : many configs (similar names) · 6–8 tools
   *     Prompt      : vague alias (“Make my headlines bot Europe-only”)
   *     Reasoning   : map alias to correct config, edit geo filter
   *     Assert      : correct config chosen, geo filter injected
   *
   *   L-2
   *     Environment : overlapping configs & deprecated tools
   *     Prompt      : swap old tool for new, keep behaviour identical
   *     Reasoning   : remove deprecated tool, add replacement, maintain logic
   *     Assert      : tool arrays updated - old gone, new present
   *
   *   L-3
   *     Environment : >10 configs (some composite) · 10+ tools
   *     Prompt      : “Consolidate the two separate climate-news agents into
   *                   one and limit daily API calls to 50.”
   *     Reasoning   : merge fields from both configs OR generate diff update
   *                   that deprecates one id in favour of the other
   *     Assert      : RESPONSE_UPDATE_AGENT_CONFIG shows merged behaviour
   *                   and rate-limit parameter
   */

  describe("UPDATE_AGENT_CONFIG", () => {
    testGenerator([
      {
        name: "News headline - Agent specialization requirement leads to UPDATE_AGENT_CONFIG",
        existingConfigs: [agentConfig("news_headlines_24h")],
        availableTools: [tool("news_search")],
        input: "Search headlines news exclusively focused on US president.",
        expected: {
          RESPONSE_TYPE: "UPDATE_AGENT_CONFIG",
        },
      },
      {
        name: "Historical Sites Search - Direct update request leads to UPDATE_AGENT_CONFIG",
        existingConfigs: [agentConfig("historical_sites_search")],
        availableTools: [tool("historical_sites_search_api")],
        input:
          "Update the historical sites search agent to focus on the 13th–15th centuries.",
        expected: {
          RESPONSE_TYPE: "UPDATE_AGENT_CONFIG",
        },
      },
    ]);
  });
  /**
   * ============================================================================
   * TEST-MATRIX · SELECT_AGENT_CONFIG
   * ============================================================================
   *
   * Use these guidelines when the agent **ought to reuse one existing config
   * exactly as it is**, with no edits or new creations.
   *
   * Grid: 3 outer categories (degree of overlap / ambiguity among configs) ×
   *       3 inner levels (clarity of the user’s request).
   *
   *
   * ── Legend ────────────────────────────────────────────────────────────────
   *   • Environment → how many configs compete, which tools they use
   *   • Prompt      → how precise the user is when describing the task
   *   • Reasoning   → key discriminant the LLM must apply
   *   • Assert      → minimal `expect()` for that cell
   * ------------------------------------------------------------------------
   *
   * 1. Unambiguous  (single obvious choice)
   * ──────────────────────────────────────────────────────────────────────────
   *   L-1
   *     Environment : exactly 1 existing config; tools align 1-for-1
   *     Prompt      : near-identical wording to config description
   *     Reasoning   : string match
   *     Assert      : RESPONSE_TYPE === "SELECT_AGENT_CONFIG"
   *
   *   L-2
   *     Environment : 1 perfect config + 1 unrelated config
   *     Prompt      : synonyms / slight paraphrase (“AI stories” vs “AI news”)
   *     Reasoning   : semantic match despite wording drift
   *     Assert      : correct config id selected
   *
   *   L-3
   *     Environment : 1 perfect config + several irrelevant ones
   *     Prompt      : omits explicit tool/key-word but mentions unique schedule
   *     Reasoning   : infer from schedule / target domain
   *     Assert      : only the perfect config returned
   *
   * 2. Competing matches  (multiple plausible configs)
   * ──────────────────────────────────────────────────────────────────────────
   *   L-1
   *     Environment : 2 configs share topic; one matches narrower timespan
   *     Prompt      : “Give me today’s headlines…” (timespan cue)
   *     Reasoning   : choose by timespan specificity
   *     Assert      : narrower-window config selected
   *
   *   L-2
   *     Environment : 3–4 news-type configs varying by language & region
   *     Prompt      : requests Spanish headlines about tech
   *     Reasoning   : match on both language & topic
   *     Assert      : Spanish-tech config chosen
   *
   *   L-3
   *     Environment : overlapping configs with mixed tools (news vs podcast)
   *     Prompt      : explicitly wants *only* podcast episodes
   *     Reasoning   : weigh medium (podcast) over shared topic
   *     Assert      : podcast-specific config chosen
   *
   * 3. Partial coverage  (no perfect fit—pick the best)
   * ──────────────────────────────────────────────────────────────────────────
   *   L-1
   *     Environment : several configs; one covers >70 % of ask
   *     Prompt      : broad (“Give everything you know on EV policy”)
   *     Reasoning   : select most comprehensive available
   *     Assert      : best-coverage config id returned
   *
   *   L-2
   *     Environment : many narrow configs (region, medium) none global
   *     Prompt      : global request; agent must prefer “global-Europe-APAC”
   *     Reasoning   : trade-off breadth vs specialty
   *     Assert      : widest-scope config selected
   *
   *   L-3
   *     Environment : 10+ configs, some deprecated; tools vary
   *     Prompt      : fuzzy, multi-domain request (“climate change chatter”)
   *     Reasoning   : infer dominant medium/topic, tolerate 80 % fit
   *     Assert      : single, closest config chosen; no CREATE/UPDATE triggered
   */

  describe("SELECT_AGENT_CONFIG", () => {
    testGenerator([
      {
        name: "Collect news headlines via existing agent",
        existingConfigs: [agentConfig("news_headlines_24h")],
        availableTools: [tool("news_search")],
        input:
          "Collect news headlines containing related to AI from the past 24 hours.",
        expected: {
          RESPONSE_TYPE: "SELECT_AGENT_CONFIG",
        },
      },
    ]);
  });
  /**
   * ============================================================================
   * TEST-MATRIX · AGENT_CONFIG_UNAVAILABLE
   * ============================================================================
   *
   * Use these guidelines when the agent **cannot** fulfil the task with any
   * combination of the supplied tools & configs, and therefore must answer with
   * `"AGENT_CONFIG_UNAVAILABLE"`.
   *
   * Grid: 3 outer categories (how misleading the tooling landscape is) ×
   *       3 inner levels (prompt complexity).
   *
   * ── Legend ────────────────────────────────────────────────────────────────
   *   • Environment → overlap (or lack) between tools & the user’s need
   *   • Prompt      → clarity and wording tricks
   *   • Reasoning   → pitfall the LLM must detect
   *   • Assert      → single key check for that cell
   * ------------------------------------------------------------------------
   *
   * 1. CLEAR_MISMATCH  (nothing even resembles the needed capability)
   * ──────────────────────────────────────────────────────────────────────────
   *   L-1
   *     Environment : 0 tools in relevant domain
   *     Prompt      : direct ask (“Convert text to speech”)
   *     Reasoning   : immediate capability gap
   *     Assert      : RESPONSE_TYPE === "AGENT_CONFIG_UNAVAILABLE"
   *
   *   L-2
   *     Environment : same as above
   *     Prompt      : synonym phrasing (“narrate this paragraph aloud”)
   *     Reasoning   : recognise synonym still requires TTS
   *     Assert      : same as L-1
   *
   *   L-3
   *     Environment : same gap + extra unrelated constraints
   *     Prompt      : “Read this PDF aloud in German and colour-code words”
   *     Reasoning   : detect combined features all missing
   *     Assert      : same
   *
   * 2. NEAR_MISS  (tools look tempting but are insufficient)
   * ──────────────────────────────────────────────────────────────────────────
   *   L-1
   *     Environment : 1 similar but off-scope tool (e.g., *crypto* price feed)
   *     Prompt      : “Get me live Apple stock quotes every minute.”
   *     Reasoning   : spot asset-class mismatch (equity vs crypto)
   *     Assert      : AGENT_CONFIG_UNAVAILABLE
   *
   *   L-2
   *     Environment : multiple partially related tools
   *     Prompt      : “Monitor SEC 13F filings.”  (tool only fetches 10-K/8-K)
   *     Reasoning   : differentiate filing types
   *     Assert      : unavailable
   *
   *   L-3
   *     Environment : tool covers domain *but* lacks real-time speed / granularity
   *     Prompt      : “Show real-time tornado radar imagery.”
   *     Reasoning   : weather_alert_feed ≠ live radar
   *     Assert      : unavailable
   *
   * 3. AMBIGUOUS_IMPOSSIBLE  (fuzzy or multi-step ask, no tool chain possible)
   * ──────────────────────────────────────────────────────────────────────────
   *   L-1
   *     Environment : several unrelated tools; none compose to meet request
   *     Prompt      : “Do sentiment-driven trading of gold futures.”
   *     Reasoning   : compose? cannot; no market access, no gold tool
   *     Assert      : AGENT_CONFIG_UNAVAILABLE
   *
   *   L-2
   *     Environment : large tool palette with overlaps, but critical step missing
   *     Prompt      : “Turn these podcast episodes into multilingual
   *                   lip-synced videos.”
   *     Reasoning   : needs TTS + video editing—absent
   *     Assert      : unavailable
   *
   *   L-3
   *     Environment : noisy tool list, some deprecated; none safe for policy
   *     Prompt      : “Continuously scrape personal data from social media
   *                   profiles in real time.”
   *     Reasoning   : violates policy *and* lacks tooling
   *     Assert      : unavailable   (should *not* pivot to CREATE/UPDATE/SELECT)
   */

  describe("AGENT_CONFIG_UNAVAILABLE", () => {
    testGenerator([
      {
        name: "Text to speech is not possible due to lack of available agent tool",
        existingConfigs: [],
        availableTools: [tool("google_search")],
        input: "Transform provided text to speech",
        expected: {
          RESPONSE_TYPE: "AGENT_CONFIG_UNAVAILABLE",
        },
      },
    ]);
  });
});
