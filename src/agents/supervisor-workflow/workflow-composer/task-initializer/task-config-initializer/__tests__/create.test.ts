// TODO This should be update due to: src/agents/supervisor-workflow/workflow-composer/task-initializer/task-config-initializer/__tests__/create.test.ts

// /**
//  * ============================================================================
//  *  CREATE_TASK_CONFIG · 3 × 3 TEST‑MATRIX  (TaskConfigInitializer)
//  * ============================================================================
//  *
//  *  Two orthogonal axes
//  *  ───────────────────────────────────────────────────────────────────────────
//  *  1.  EnvComplexity   – how much *context clutter* the model must sift
//  *      STRAIGHTFORWARD : 0 task‑configs, 1 focused agent‑config
//  *      NOISY           : 1‑3 unrelated configs (some clutter)
//  *      ENTANGLED       : ≥5 configs *or* overlapping / near‑match configs
//  *
//  *  2.  PromptDifficulty – how much *reasoning* is buried in the user prompt
//  *      L1  : one clear action, one obvious parameter
//  *      L2  : either must *ignore noise* OR must weave **two** constraints
//  *      L3  : ≥ two filters **and** they must be echoed verbatim in the created
//  *             task_config_input (nested / implicit logic allowed)
//  *
//  *  Cell cheat‑sheet
//  * ───────────────────────────────────────────────────────────────────────────────────────────────
//  * | Env · Lvl            | Environment clutter                | Prompt cognitive load        | Assert   |
//  * |----------------------|------------------------------------|------------------------------|----------|
//  * | STRAIGHTFORWARD · L1 | 0 task‑cfg, 1 agent                | 1 clear action               | agent +  |
//  * |                      |                                    | (e.g. “collect AI news”)     | param    |
//  * |----------------------|------------------------------------|------------------------------|----------|
//  * | STRAIGHTFORWARD · L2 | 0 task‑cfg, 1 agent                | +1 simple filter             | noise    |
//  * |                      |                                    | (date‑range OR rating)       | ignored  |
//  * |----------------------|------------------------------------|------------------------------|----------|
//  * | STRAIGHTFORWARD · L3 | 0 task‑cfg, 1 agent                | ≥2 filters or nested phrasing| every    |
//  * |                      |                                    | (“re‑* verbs + ≥6 letters”)  | filter   |
//  * |======================|====================================|==============================|==========|
//  * | NOISY · L1           | 1‑3 unrelated cfgs                 | 1 clear action               | right    |
//  * |----------------------|------------------------------------|------------------------------|----------|
//  * | NOISY · L2           | 1‑3 cfgs                           | 2 constraints / ignore noise | both     |
//  * |                      |                                    | (“outdoor + €20 cap”)        | params   |
//  * |----------------------|------------------------------------|------------------------------|----------|
//  * | NOISY · L3           | 1‑3 cfgs                           | multi‑filter ask             | all      |
//  * |                      |                                    |                              | echoed   |
//  * |======================|====================================|==============================|==========|
//  * | ENTANGLED · L1       | ≥5 cfgs, overlaps                  | vague domain wording         | correct  |
//  * |----------------------|------------------------------------|------------------------------|----------|
//  * | ENTANGLED · L2       | ≥5 cfgs                            | conditional / fusion         | create + |
//  * |                      |                                    |                              | orch.    |
//  * |----------------------|------------------------------------|------------------------------|----------|
//  * | ENTANGLED · L3       | ≥5 cfgs                            | nested implicit ask          | only &   |
//  * |                      |                                    | (“€650 < 18:00, per airline”)| all parms|
//  * ───────────────────────────────────────────────────────────────────────────────────────────────
//  *
//  *  Every test‑case is dropped into one cell  ⟶  matrix.validate() will fail‑case is dropped into one cell  ⟶  matrix.validate() will fail
//  *  CI if any of the nine cells is left empty.
//  */

// export const m = new TestMatrix<TaskCase>();

// const testCases: {
//   ec: EnvComplexity;
//   pd: PromptDifficulty;
//   input: string;
//   existingAgentConfigs: AgentConfigType[];
//   existingTaskConfigs: TaskConfigType[];
//   expected: {
//     agent_type: AgentConfigType;
//     task_type: PatternBuilder;
//     task_config_input: PatternBuilder;
//     description?: PatternBuilder;
//   };
// }[] = [
//   /* ─────────────── STRAIGHTFORWARD ROW ─────────────── */
//   {
//     ec: EC.STRAIGHTFORWARD,
//     pd: PD.L1,
//     input: "Collect news headlines related to AI from the past 24 hours.",
//     existingAgentConfigs: ["news_headlines"],
//     existingTaskConfigs: [],
//     expected: {
//       agent_type: "news_headlines",
//       task_type: pb().alt("collect", "news", "headlines"),
//       task_config_input: pb().alt("AI"),
//     },
//   },
//   {
//     ec: EC.STRAIGHTFORWARD,
//     pd: PD.L2,
//     input:
//       "List upcoming sci-fi movies releasing next month that already have an IMDb rating above 7.",
//     existingAgentConfigs: ["scifi_movies_weekly"],
//     existingTaskConfigs: [],
//     expected: {
//       agent_type: "scifi_movies_weekly",
//       task_type: pb().alt("list", "movies", "sci-fi"),
//       task_config_input: pb().alt("rating").alt("7"),
//     },
//   },
//   {
//     ec: EC.STRAIGHTFORWARD,
//     pd: PD.L3,
//     input:
//       "Generate Spanish verbs starting with “re-” that are at least six letters long, include their subjunctive present conjugation, and exclude any with irregular gerunds.",
//     existingAgentConfigs: ["phrase_generator"],
//     existingTaskConfigs: [],
//     expected: {
//       agent_type: "phrase_generator",
//       task_type: pb().alt("verbs", "spanish", "list"),
//       task_config_input: pb().all(
//         pb().alt("re-"),
//         pb().alt("six", "6"),
//         "subjunctive",
//         "exclude",
//         "irregular",
//       ),
//     },
//   },

//   /* ───────────────────────── NOISY ROW ───────────────────────── */
//   {
//     ec: EC.NOISY,
//     pd: PD.L1,
//     input: "Track Bitcoin price and notify me when it drops below $60 000.",
//     existingAgentConfigs: ["crypto_price_tracker_hourly", "phrase_generator"],
//     existingTaskConfigs: ["collect_ai_news_24h"],
//     expected: {
//       agent_type: "crypto_price_tracker_hourly",
//       task_type: pb().alt("track", "bitcoin", "price"),
//       task_config_input: pb().alt("60 000", "$60k", "60000"),
//     },
//   },
//   {
//     ec: EC.NOISY,
//     pd: PD.L2,
//     input:
//       "Find family-friendly outdoor events in my city under €20 for the next two weekends and include an indoor alternative if rain is forecast.",
//     existingAgentConfigs: ["city_events_weekend", "news_headlines"],
//     existingTaskConfigs: ["btc_drop_alert_60k", "spanish_word_of_day_quiz"],
//     expected: {
//       agent_type: "city_events_weekend",
//       task_type: pb().alt("events", "weekend", "family"),
//       task_config_input: pb().alt("20", "€20").alt("indoor"),
//       description: pb().text("indoor").sep().text("outdoor").sep().text("rain"),
//     },
//   },
//   {
//     ec: EC.NOISY,
//     pd: PD.L3,
//     input:
//       "Summarise new arXiv papers tagged cs.AI or stat.ML from the previous week that mention “transformer” and have at least 50 Semantic Scholar citations.",
//     existingAgentConfigs: [
//       "arxiv_rl_daily",
//       "news_headlines",
//       "flight_price_tracker_weekly",
//     ],
//     existingTaskConfigs: [
//       "family_events_under_20",
//       "collect_ai_news_24h",
//       "btc_drop_alert_60k",
//     ],
//     expected: {
//       agent_type: "arxiv_rl_daily",
//       task_type: pb().alt("summarise", "arxiv", "papers"),
//       task_config_input: pb()
//         .alt("cs.AI", "stat.ML")
//         .alt("transformer")
//         .alt("50")
//         .alt("citation")
//         .alt("week", "7d", "7 days"),
//     },
//   },

//   /* ─────────────────────── ENTANGLED ROW ─────────────────────── */
//   // NOTE: All these tests fails currently and honestly I'm not sure if
//   {
//     ec: EC.ENTANGLED,
//     pd: PD.L1,
//     input:
//       "List underrated historical sites in Kyoto within walking distance of the main train station.",
//     existingAgentConfigs: [
//       "historical_sites_search",
//       "news_headlines",
//       "crypto_price_tracker_hourly",
//       "phrase_generator",
//       "flight_price_tracker_weekly",
//       "arxiv_rl_daily",
//     ],
//     existingTaskConfigs: [
//       "collect_ai_news_24h",
//       "btc_drop_alert_60k",
//       "spanish_word_of_day_quiz",
//       "family_events_under_20",
//     ],
//     expected: {
//       agent_type: "historical_sites_search",
//       task_type: pb().alt("historical", "sites", "kyoto"),
//       task_config_input: pb()
//         .alt("train", "station")
//         .alt("walking")
//         .alt("underrated"),
//     },
//   },
//   {
//     ec: EC.ENTANGLED,
//     pd: PD.L2,
//     input:
//       "Find flights from Prague to Tokyo under €650 that depart after 18:00 and include average rainfall in Tokyo for that week.",
//     existingAgentConfigs: [
//       "flight_price_tracker_weekly",
//       "weather_tornado_immediate",
//       "crypto_price_tracker_hourly",
//       "news_headlines",
//       "city_events_weekend",
//       "historical_sites_search",
//       "phrase_generator",
//     ],
//     existingTaskConfigs: [
//       "kyoto_hidden_sites",
//       "collect_ai_news_24h",
//       "family_events_under_20",
//       "btc_drop_alert_60k",
//       "spanish_word_of_day_quiz",
//     ],
//     expected: {
//       agent_type: "flight_price_tracker_weekly",
//       task_type: pb().alt("flights", "tokyo", "prague"),
//       task_config_input: pb()
//         .alt("€650", "650")
//         .alt("18:00", "6pm")
//         .alt("rainfall"),
//     },
//   },
//   {
//     ec: EC.ENTANGLED,
//     pd: PD.L3,
//     input:
//       "Whenever Bitcoin sets a new all-time high within 24 h of an SEC 8-K filing by any S&P 500 company mentioning “blockchain”, compile a correlation report combining both events.",
//     existingAgentConfigs: [
//       "crypto_price_tracker_hourly",
//       "news_headlines",
//       "arxiv_rl_daily",
//       "city_events_weekend",
//       "historical_sites_search",
//       "phrase_generator",
//       "podcast_ai_weekly",
//     ],
//     existingTaskConfigs: [
//       "kyoto_hidden_sites",
//       "family_events_under_20",
//       "collect_ai_news_24h",
//       "btc_drop_alert_60k",
//     ],
//     expected: {
//       agent_type: "crypto_price_tracker_hourly",
//       task_type: pb().alt("correlation", "bitcoin", "8-K"),
//       task_config_input: pb()
//         .alt("all-time", "ATH")
//         .alt("24")
//         .alt("blockchain"),
//     },
//   },
// ];

// for (const {
//   ec,
//   pd,
//   input,
//   existingAgentConfigs,
//   existingTaskConfigs,
//   expected: { agent_type, task_type, task_config_input },
// } of testCases) {
//   m.addCase(ec, pd, {
//     input,
//     expected: {
//       RESPONSE_TYPE: "CREATE_TASK_CONFIG" as const,
//       RESPONSE_CREATE_TASK_CONFIG: {
//         agent_type,
//         task_type: expect.any(String),
//         description: expect.any(String),
//         task_config_input: expect.any(String),
//       },
//     },
//     meta: {
//       existingAgentConfigs: existingAgentConfigs.map(agentConfig),
//       existingTaskConfigs: existingTaskConfigs.map(taskConfig),
//     },
//     assert: (parsed) => {
//       expect(parsed.RESPONSE_CREATE_TASK_CONFIG.task_type).toMatchPattern(
//         task_type,
//       );
//       expect(
//         parsed.RESPONSE_CREATE_TASK_CONFIG.task_config_input,
//       ).toMatchPattern(task_config_input);
//     },
//   });
// }

// /* kick off the generator */
// runMatrix(m);
