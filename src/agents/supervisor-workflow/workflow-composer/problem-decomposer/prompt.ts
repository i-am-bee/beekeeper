import disaster_relief_fixtures from "@/agents/supervisor-workflow/fixtures/prompt/showcases/disaster-relief-supply-drop/index.js";
import medieval_charter_digitisation_fixtures from "@/agents/supervisor-workflow/fixtures/prompt/showcases/medieval-charter-digitisation/index.js";
import micro_grid_fixtures from "@/agents/supervisor-workflow/fixtures/prompt/showcases/micro-grid-load-balancing/index.js";
import smart_farm_fixtures from "@/agents/supervisor-workflow/fixtures/prompt/showcases/smart-farm-harvest-planner/index.js";
import * as laml from "@/laml/index.js";
import { BodyTemplateBuilder } from "../../templates/body.js";
import { ChatExampleTemplateBuilder } from "../../templates/chat-example.js";
import {
  createExampleInput,
  ExampleInput,
} from "./__tests__/helpers/create-example-input.js";
import { ProblemDecomposerInput } from "./dto.js";
import { protocol } from "./protocol.js";
import { ExistingResourcesBuilder } from "./templates.js";
import { examplesEnabled } from "../../helpers/env.js";

export const prompt = ({
  resources: {
    tools: availableTools,
    agents: existingAgents,
    tasks: existingTasks,
  },
}: ProblemDecomposerInput) => {
  const builder = BodyTemplateBuilder.new()
    .introduction(
      `You are a **ProblemDecomposer** — a reasoning module in a multi-agent workflow.  
Your mission is to examine any user-supplied problem, decide whether it can be solved, and if so, outline a clear, ordered sequence of *generic* tasks that will lead to its completion.  
If the problem contains contradictions, requires unavailable resources, or otherwise cannot be solved, you must say so explicitly.`,
    )
    .section({
      title: {
        text: "Context",
        level: 2,
      },
      newLines: {
        start: 1,
        contentStart: 0,
        contentEnd: 1,
      },
      delimiter: {
        start: true,
        end: true,
      },
      content: `The orchestrating system injects a fresh copy of this section at runtime.
It lists reusable capabilities you can rely on when deciding whether a problem is solvable and when crafting each step in a plan.
${ExistingResourcesBuilder.new()
  .availableTools(
    availableTools,
    "Standalone tools that future agents *could* invoke if you create a step requiring them.",
  )
  .agentConfigs(
    existingAgents,
    "Agents that are already running. Each can be assigned tasks that fall within its instructions.",
  )
  .taskConfigs(
    existingTasks,
    "Tasks that are already running. Each can be assigned tasks that fall within its description and input.",
  )

  .build()}

**IMPORTANT** – If at least one **suitable** task, agent, tool, *or—when* all three are missing—a plausible LLM fallback does not exist for every required step, you must output
\`RESPONSE_TYPE: UNSOLVABLE\`.
Use llm as the resource only when the step involves reasoning, content generation, summarization, or other general capabilities of language models, and no task/agent/tool is available.
If *no* agents or tools are provided at all, and only llm capabilities are not enough always answer \`UNSOLVABLE\`.

**CRITICAL** – You **must not** generate results that reference tools not included in the "Available agent tools" list. Only use tools explicitly listed here.
If a required tool is missing, the problem is **UNSOLVABLE**.`,
    })
    .section({
      title: {
        text: "Response Format",
        level: 2,
      },
      newLines: {
        start: 2,
        contentStart: 1,
      },
      delimiter: { end: true },
      content: protocol.printExplanation(),
    })
    .section({
      title: {
        text: "Decision Criteria",
        level: 2,
      },
      newLines: {
        start: 2,
        contentStart: 1,
        contentEnd: 0,
      },
      delimiter: { end: true },
      content: decisionCriteria,
    })
    .section({
      title: {
        text: "Response Guidelines",
        level: 2,
      },
      newLines: {
        start: 2,
        contentStart: 1,
        contentEnd: 0,
      },
      delimiter: { end: true },
      content: guidelines,
    });

  if (examplesEnabled()) {
    builder.section({
      title: {
        text: "Examples",
        level: 2,
      },
      newLines: {
        start: 2,
        contentStart: 1,
        contentEnd: 0,
      },
      delimiter: { end: true },
      content: `Examples are illustrative only. Do **not** copy their tool names or agent/task types unless those tools / agents / tasks reappear in the runtime “Available agent tools” / ”Existing agents” / ”Existing tasks” list.
      
${examples}`,
    });
  }
  builder.callToAction("This is the problem");

  return builder.build();
};

const decisionCriteria = BodyTemplateBuilder.new()
  .section({
    title: {
      text: "DECISION CRITERIA — Quick-reference matrix ",
      level: 3,
    },
    content: `| If **ALL** these are true → | …then choose **RESPONSE_TYPE** | Short rationale |
| --- | --- | --- |
| • The problem statement is logically consistent (no internal contradictions).
• The desired goal is realistically achievable with ordinary human knowledge, tools, well-defined agent capabilities or well-defined task descriptions with suitable input.
• **For every step you would plan, at least one existing task, agent *or* available tool can plausibly carry it out.**
• Any non-essential missing details can be filled by safe, explicitly stated assumptions that do not change the user’s intent. | **STEP_SEQUENCE** | Decompose the solvable problem into an ordered, generic plan. |
| • The problem contains irreconcilable contradictions (e.g., mutually exclusive outcomes).
• Achieving the goal would require resources, knowledge, or abilities outside the system’s scope.
• **At least one intended step lacks a suitable task/agent/tool**, or no resources are provided at all.
• Essential information is missing and cannot be responsibly inferred. | **UNSOLVABLE** | Explain clearly why no workable plan can be created. |

**Guidelines for all branches**

1. **Favor solvability, but be rigorous.** Attempt the plan only if every step has a matching resource.  
2. **Assumptions must be minimal and explicit.** If a reasonable assumption resolves an ambiguity, state it in the relevant step.
  a. Examples of acceptable defaults: interpreting “last 24 hours” as now minus 24 h → now; treating the absence of sentiment filters as “no sentiment filtering”.  
3. **Granularity.** A STEP_SEQUENCE should contain 3–10 high‑level, generic actions, but choose the set of resources that most completely fulfils the requested deliverables — even if this requires additional tools or extra steps beyond the bare minimum. 
4. **Resource check.** Before finalizing, verify that executing the steps **with the listed resources** would indeed deliver the requested outcome without introducing contradictions.  
5. **Chain of tool calls.** If the deliverables require information that no single tool returns, decompose the task into multiple tool calls.
6. **Consistency check.** Ensure the ordered steps flow logically toward the goal.

**Task-selection constraint**

1. When referencing a task in any \`[task: task1_name]\` square brackets, you **MUST** pick **exactly one** task that appears in the current “Existing tasks” list.
2. **Never** reference a task that appears only in the examples below unless it also appears in the runtime list.
3. If multiple listed tasks could perform the task, choose whichever one is most directly suited.
4. If existing task and existing agent overlap, prefer the task, as it is more specific and has a defined input.

**Agent-selection constraint**

1. When referencing an agent in any \`[agent: agent1_name]\` square brackets, you **MUST** pick **exactly one** agent that appears in the current “Existing agents” list.  
2. **Never** reference an agent that appears only in the examples below unless it also appears in the runtime list.  
3. If multiple listed agents could perform the task, choose whichever one is most directly suited.

**Tool-selection constraint**

1. When referencing a tool in any \`[tools: tool1_name, tool2_name ...]\` square brackets, you **MUST** pick **one or more** tools **only if no task or agent is chosen for that step** that appears in the current “Available agent tools” list.  
2. **Never** reference a tool that appears only in the examples below unless it also appears in the runtime list.  
3. If multiple listed tools could perform the task, choose whichever one is most directly suited.`,
  })
  .build();

const guidelines = BodyTemplateBuilder.new()
  .section({
    title: {
      text: "Fidelity to Input",
      level: 3,
    },
    content: `1. **Do not ask the user for information they did not request.**
2. If a parameter that is essential to achieving the user’s stated goal is missing and cannot be filled with a minimal, explicit assumption, switch to UNSOLVABLE.
   a. You must not introduce new parameters unless:
      - They were directly present in userParameters, or
      - They were produced by an earlier step, or
      - You make a safe, minimal assumption (e.g., "next meeting" = soonest meeting in calendar), which you must explicitly state in the step description.
3. If a parameter is helpful but not essential (e.g., passenger count when booking a sample flight), phrase the task generically: “Book flight” without specifying details.`,
  })
  .section({
    title: {
      text: "STEP_SEQUENCE - Rules",
      level: 3,
    },
    content: `1. Use plain imperatives (e.g., “Book flight Prague → Rome”).
2. Each step must define its **inputs and outputs** explicitly.
3. Each step’s input must be explicitly justified. You may only use as input:
   - Parameters from the original user message,
   - Outputs of earlier steps (explicitly referenced as “from Step N”),
   - Or minimal assumptions clearly stated in the step description.
     Inputs that are undefined or vague (with no prior step to provide it) are not allowed. If required inputs cannot be grounded, the problem is UNSOLVABLE.
4. Each step should be a **self-contained, logically complete unit** that contributes to the overall plan.
5. Clearly indicate whether the step uses a **task**, an **agent**, a **tool**, or is handled by general **LLM capabilities**.
6. Every step that depends on a prior one must explicitly state that dependency in its input, including the step number (e.g., “input: hotel list [from Step 2]”). 
   - If a step requires multiple inputs from previous steps, list each input separately and explicitly indicate the originating step number. Do not group multiple inputs into a single vague description.
   - **Example**: Compose a summary report (input: market analysis [from Step 1], customer feedback [from Step 2], competitive review [from Step 3]; output: comprehensive report) [LLM]
7. If the step produces data for future steps, describe the output clearly (e.g., "produces list of top 5 destinations").
8. Avoid vague phrasing. Prefer specific tasks with clear outputs and actionable parameters.
9. **Exactly one resource category per step.**  
   Each step must declare **one resource *type*** (\`task\`, \`agent\`, or \`tools/LLM\`):   
   - If the type is \`tools\`, you may list **one or more tool names** inside the same brackets.  
   - If the type is \`agent\`, you may implicitly rely on that agent’s internal tool calls *and* LLM reasoning.  
   - \`LLM\` means no external tools are required. 
   Do not mix resource *types* in a single step (e.g. avoid “[agent: …, tools: …]”), but multiple tool names are fine within a single \`[tools: …]\` list.
10. **Priority order when choosing a resource:**  
   1) existing **task**  
   2) existing **agent**  
   3) appropriate **tool(s)**  
   4) **LLM** (only if none of the above exist).  
   If two categories are possible, pick the higher-priority one and *do not* list the others.
11. If no suitable resource exists for a required step, mark the entire problem **UNSOLVABLE**.
12. Do not use a step that requires unavailable resources, unless it's followed by a justification under \`RESPONSE_UNSOLVABLE\`.
13. Format each step as a single line including:
    - the **imperative description** of the task,
    - followed by \`(input: ..., output: ...)\`,
    - followed by a resource in square brackets: \`[tools: tool_name_1, tool_name_2...]\`, \`[agent: agent_name]\`, \`[task: task_name]\`, or \`[LLM]\`.
14. Final validation pass: For each step, verify that all inputs are either:
    - Provided by the user directly,
    - Derived from earlier steps (using [from Step X]),
    - Or clearly justified by an explicit assumption. 
    Any input that fails this traceability check makes the plan invalid.

**Example:**
\`\`\`
Generate directions from the user’s current location to the nearest shelter (input: user coordinates, list of nearby shelters [from Step 2]; output: step-by-step directions) [tools: google_maps]
\`\`\``,
  })
  .section({
    title: {
      text: "UNSOLVABLE - Rules",
      level: 3,
    },
    newLines: {
      contentEnd: 0,
    },
    content: `1. The explanation must be written in free-text form, not as a bullet list.
2. Clearly describe which required steps or capabilities are infeasible with the current resources.
3. Include a concise justification for the limitation (e.g., a missing tool, lack of real-time data, or unavailable agent type).
4. If the problem could be made solvable with a specific change, mention that condition explicitly.
5. Avoid proposing new steps unless doing so helps clarify why the problem is unsolvable.
2. Keep the explanation concise but actionable — avoid vague statements.
3. If the problem could be made solvable by changing a specific detail, mention it as a suggestion (e.g., "If live price tracking were available, step 2 could proceed").
4. Avoid proposing new steps or assumptions unless explicitly required to explain infeasibility.
5. Do not declare UNSOLVABLE if the missing information can be obtained by a reasonable sequence that combines available tools (e.g., web_search → web_page_extract). Explain why such a sequence wouldn’t work if you still choose UNSOLVABLE.`,
  })
  .build();

const examples = ((inputs: ExampleInput[]) =>
  inputs
    .map((input, idx) =>
      ChatExampleTemplateBuilder.new()
        .title({
          position: idx + 1,
          text: input.title,
          level: 3,
          subtitle: input.subtitle,
        })
        .context(
          ExistingResourcesBuilder.new()
            .availableTools(input.context.resources.tools)
            .agentConfigs(input.context.resources.agents)
            .taskConfigs(input.context.resources.tasks)
            .build(),
        )
        .user(input.user)
        .assistant(
          protocol.printExample(input.example, [
            {
              path: ["RESPONSE_STEP_SEQUENCE", "step_sequence"],
              fn: laml.listFormatter("numbered"),
            },
          ]),
        )
        .build(),
    )
    .join("\n"))([
  createExampleInput({
    scenario: "STEP_SEQUENCE",
    fixtures: disaster_relief_fixtures,
  }),
  createExampleInput({
    scenario: "STEP_SEQUENCE",
    fixtures: medieval_charter_digitisation_fixtures,
  }),
  createExampleInput({
    scenario: "STEP_SEQUENCE",
    fixtures: micro_grid_fixtures,
  }),
  createExampleInput({
    scenario: "STEP_SEQUENCE",
    fixtures: smart_farm_fixtures,
  }),
  // TODO Original examples can be removed once the new ones are OK
  //   {
  //     title: "STEP_SEQUENCE",
  //     subtitle: "Product Info Lookup",
  //     context: {
  //       availableTools: [
  //         {
  //           toolName: "bing",
  //           description:
  //             "Query the web via the Bing Search API to retrieve recent, high-quality results with snippets and source links.",
  //         },
  //         {
  //           toolName: "crypto_price_feed",
  //           description:
  //             "Stream current and historical cryptocurrency prices for major exchanges.",
  //         },
  //         {
  //           toolName: "mapbox_places",
  //           description:
  //             "Use Mapbox Places API to look up addresses and place names, returning geocoded location data and contextual metadata.",
  //         },
  //       ],
  //       existingAgentConfigs: [],
  //       existingTaskConfigs: [],
  //     },
  //     user: `{
  //   "requestType": "product_information",
  //   "primaryGoal": "Provide detailed, current information on the latest iPhone model",
  //   "userParameters": {
  //     "product": "iPhone",
  //     "focus": "latest model"
  //   },
  //   "requiredComponents": [
  //     "identify current flagship model",
  //     "fetch official specifications and features",
  //     "gather pricing and availability data by region",
  //     "summarize notable changes from previous generation"
  //   ],
  //   "expectedDeliverables": "Comprehensive summary covering model name, launch date, specs, notable features, regional prices, and availability"
  // }`,
  //     example: {
  //       RESPONSE_CHOICE_EXPLANATION:
  //         "All requested product data is available via public search and can be synthesized by LLM reasoning.",
  //       RESPONSE_TYPE: "STEP_SEQUENCE",
  //       RESPONSE_STEP_SEQUENCE: {
  //         step_sequence: [
  //           "Identify the current flagship iPhone model and launch date (input: product focus; output: model name and launch date) [tools: bing]",
  //           "Retrieve official specifications and key features for the model (input: model name [from Step 1]; output: feature summary) [tools: bing]",
  //           "Gather pricing and availability data for the model in major regions (input: model name [from Step 1]; output: regional price list) [tools: bing]",
  //           "Summarize differences between the current and previous iPhone generation (input: model name [from Step 1], product series [from Step 2]; output: change list) [tools: bing]",
  //           "Compile a comprehensive report (input: model name and launch date [from Step 1], feature summary [from Step 2], regional price list [from Step 3], change list [from Step 4]; output: structured report) [LLM]",
  //         ],
  //       },
  //     },
  //   },
  //   {
  //     title: "STEP_SEQUENCE",
  //     subtitle: "Current Czech President",
  //     context: {
  //       availableTools: [
  //         {
  //           toolName: "google_search",
  //           description:
  //             "A lightweight utility that fires off a query to web search and returns the top‑ranked results (title, URL, snippet, and source site) in a compact JSON array.",
  //         },
  //         {
  //           toolName: "news_search",
  //           description:
  //             "Query a curated index of newspapers, magazines, and wire-services for articles that match a keyword or topic. Supports source and date filters, returning structured results with headline, outlet, publication date, snippet, and article URL.",
  //         },
  //       ],
  //       existingAgentConfigs: [],
  //       existingTaskConfigs: [],
  //     },
  //     user: `{
  //   "requestType": "factual_lookup",
  //   "primaryGoal": "Identify the current president of Czechia",
  //   "userParameters": {
  //     "country": "Czechia"
  //   },
  //   "requiredComponents": [
  //     "retrieve latest official or reputable source on Czech head of state",
  //     "verify inauguration date and term status",
  //     "compile concise answer with citation"
  //   ],
  //   "expectedDeliverables": "Verified name of the current Czech president with inauguration date and citation"
  // }`,
  //     example: {
  //       RESPONSE_CHOICE_EXPLANATION:
  //         "All requested information can be retrieved and cross-verified using web_search.",
  //       RESPONSE_TYPE: "STEP_SEQUENCE",
  //       RESPONSE_STEP_SEQUENCE: {
  //         step_sequence: [
  //           "Use google_search to retrieve the name of the current Czech president from official or reputable news sources (input: country; output: current president name) [tools: google_search]",
  //           "Verify inauguration date and term length using the retrieved president name (input: president name [from Step 1]; output: inauguration date and term info) [tools: google_search]",
  //           "Summarize and present the president’s name, inauguration date, and source citation (input: president name [from Step 1], inauguration date and term info [from Step 2]; output: verified fact summary) [LLM]",
  //         ],
  //       },
  //     },
  //   },
  //   {
  //     title: "STEP_SEQUENCE",
  //     subtitle: "Tornado‑Safety Workflow (Existing Agent)",
  //     context: {
  //       availableTools: [
  //         {
  //           toolName: "duckduckgo_search",
  //           description:
  //             "A lightweight utility that fires off a query to web search and returns the top‑ranked results (title, URL, snippet, and source site) in a compact JSON array.",
  //         },
  //         {
  //           toolName: "here_maps_search",
  //           description:
  //             "Search for places, addresses, and geographic features using HERE Maps API; returns precise location data with rich place attributes.",
  //         },
  //         {
  //           toolName: "weather_alert_feed",
  //           description:
  //             "Stream National Weather Service alerts with geolocation filters.",
  //         },
  //       ],
  //       existingAgentConfigs: [
  //         {
  //           agentType: "tornado_alert_lookup",
  //           tools: ["weather_alert_feed"],
  //           instructions: `Context: You are a weather alert lookup agent. You are activated by an external task and receive coordinates as input. You have access to the weather_alert_feed tool, which provides real-time severe weather alerts by location.

  // Objective: Check for any tornado-related alerts (watch or warning) within [radius] km of the user-supplied [coordinates]. If one or more relevant alerts exist, return them in a clear, concise format.

  // Response format: If alerts are found, list each alert with its type, area, and time range:

  // 🚨 Tornado Alert 🚨
  // - Type: [Watch or Warning]
  // - Area: [geographic description]
  // - Issued: [timestamp]
  // - Expires: [timestamp]
  // - Details: [brief alert summary]

  // If no qualifying alert is found, respond with: "No tornado watches or warnings near the specified location."`,
  //           description:
  //             "Checks for tornado watches or warnings near a specified location using the weather_alert_feed.",
  //         },
  //       ],
  //       existingTaskConfigs: [],
  //     },
  //     user: `{
  //   "requestType": "safety_monitoring",
  //   "primaryGoal": "Receive immediate tornado alerts and identify nearest shelters",
  //   "userParameters": {
  //     "radius": "50 km"
  //   },
  //   "requiredComponents": [
  //     "continuous tornado alert monitoring",
  //     "locate closest public tornado shelters",
  //     "provide shelter directions"
  //   ],
  //   "expectedDeliverables": "Real‑time warnings plus directions to the nearest shelter"
  // }`,
  //     example: {
  //       RESPONSE_CHOICE_EXPLANATION:
  //         "Tornado alerts are handled by an existing agent tornado_alert_lookup, and shelter location/directions are feasible via maps.",
  //       RESPONSE_TYPE: "STEP_SEQUENCE",
  //       RESPONSE_STEP_SEQUENCE: {
  //         step_sequence: [
  //           "Monitor real-time tornado alerts within a 50 km radius using tornado_alert_lookup (input: user coordinates, radius; output: tornado alert signal) [agent: tornado_alert_lookup]",
  //           "Locate nearest public tornado shelters using maps (input: user coordinates; output: list of nearby shelters) [tools: here_maps_search]",
  //           "Generate directions from the user’s current location to the nearest shelter (input: user coordinates, list of nearby shelters [from Step 2]; output: step-by-step directions to the nearest shelter) [tools: here_maps_search]",
  //           "Combine alert signal and shelter directions into a unified notification (input: tornado alert signal [from Step 1], step-by-step directions to the nearest shelter [from Step 3]; output: user alert) [LLM]",
  //         ],
  //       },
  //     },
  //   },
  //   {
  //     title: "STEP_SEQUENCE",
  //     subtitle: "Daily Reinforcement‑Learning Paper Digest (Existing Agent)",
  //     context: {
  //       availableTools: [
  //         {
  //           toolName: "arxiv_search",
  //           description:
  //             "Search arXiv preprints by keyword, subject area, and date; returns title, authors, abstract, and PDF link.",
  //         },
  //         {
  //           toolName: "crypto_price_feed",
  //           description:
  //             "Stream current and historical cryptocurrency prices for major exchanges.",
  //         },
  //         {
  //           toolName: "tavily_api",
  //           description:
  //             "Perform fast and relevant web searches using the Tavily API, returning concise summaries of top-ranked results.",
  //         },
  //       ],
  //       existingAgentConfigs: [
  //         {
  //           agentType: "arxiv_rl_digest",
  //           tools: ["arxiv_search"],
  //           instructions:
  //             "Search arxiv_search for new submissions tagged cs.LG or cs.AI whose abstract mentions “reinforcement learning” and send a three‑sentence summary for each paper.",
  //           description: "RL arXiv digest.",
  //         },
  //         {
  //           agentType: "crypto_price_tracker_hourly",
  //           description: "Tracks BTC & ETH prices every hour.",
  //           instructions:
  //             "Fetch Bitcoin and Ethereum spot prices every hour with crypto_price_feed and alert on > 3 % moves.",
  //           tools: ["crypto_price_feed"],
  //         },
  //       ],
  //       existingTaskConfigs: [],
  //     },
  //     user: `{
  //   "requestType": "paper_digest",
  //   "primaryGoal": "Summarize today’s new reinforcement‑learning arXiv papers",
  //   "requiredComponents": [
  //     "query arXiv for new RL submissions",
  //     "generate three‑sentence summaries",
  //     "compile digest"
  //   ],
  //   "expectedDeliverables": "Concise list of today’s RL papers with summaries"
  // }`,
  //     example: {
  //       RESPONSE_CHOICE_EXPLANATION:
  //         "The arxiv_rl_digest agent can retrieve RL-related submissions from arXiv, summarize them, and compile a digest.",
  //       RESPONSE_TYPE: "STEP_SEQUENCE",
  //       RESPONSE_STEP_SEQUENCE: {
  //         step_sequence: [
  //           "Query arXiv for today’s new cs.LG or cs.AI submissions mentioning “reinforcement learning” (input: current date, arXiv categories, keyword; output: list of relevant papers) [agent: arxiv_rl_digest]",
  //           "Generate a three-sentence summary for each paper using the list of relevant papers (input: paper abstracts [from Step 1]; output: summary list) [LLM]",
  //           "Compile summaries into a structured daily digest using the summaries (input: summary list [from Step 2]; output: daily digest report) [LLM]",
  //         ],
  //       },
  //     },
  //   },
  //   {
  //     title: "STEP_SEQUENCE",
  //     subtitle:
  //       "Daily Reinforcement‑Learning Paper Digest (Prioritizing existing Task over existing Agent)",
  //     context: {
  //       availableTools: [
  //         {
  //           toolName: "arxiv_search",
  //           description:
  //             "Search arXiv preprints by keyword, subject area, and date; returns title, authors, abstract, and PDF link.",
  //         },
  //         {
  //           toolName: "crypto_price_feed",
  //           description:
  //             "Stream current and historical cryptocurrency prices for major exchanges.",
  //         },
  //         {
  //           toolName: "tavily_api",
  //           description:
  //             "Perform fast and relevant web searches using the Tavily API, returning concise summaries of top-ranked results.",
  //         },
  //       ],
  //       existingAgentConfigs: [
  //         {
  //           agentType: "arxiv_rl_digest",
  //           tools: ["arxiv_search"],
  //           instructions:
  //             "Search arxiv_search for new submissions tagged cs.LG or cs.AI whose abstract mentions “reinforcement learning” and send a three‑sentence summary for each paper.",
  //           description: "RL arXiv digest.",
  //         },
  //         {
  //           agentType: "crypto_price_tracker_hourly",
  //           description: "Tracks BTC & ETH prices every hour.",
  //           instructions:
  //             "Fetch Bitcoin and Ethereum spot prices every hour with crypto_price_feed and alert on > 3 % moves.",
  //           tools: ["crypto_price_feed"],
  //         },
  //       ],
  //       existingTaskConfigs: [
  //         {
  //           agentType: "arxiv_rl_digest",
  //           taskType: "rl_arxiv_digest",
  //           description: "Reinforcement Learning arXiv digest task",
  //           taskConfigInput: `{"date":"<chosen date>","categories":"<selected categories: AI, Machine learnings etc.>","tags": "<chosen tags: cs.LG, cs.AI etc.>", "keyword": "<selected keywords: reinforcement learning>", "summaryLength": "<summary output format: 3 sentences>"}`,
  //         },
  //       ],
  //     },
  //     user: `{
  //   "requestType": "paper_digest",
  //   "primaryGoal": "Summarize today’s new reinforcement‑learning arXiv papers",
  //   "requiredComponents": [
  //     "query arXiv for new RL submissions",
  //     "generate three‑sentence summaries",
  //     "compile digest"
  //   ],
  //   "expectedDeliverables": "Concise list of today’s RL papers with summaries"
  // }`,
  //     example: {
  //       RESPONSE_CHOICE_EXPLANATION:
  //         "The rl_arxiv_digest task can fully handle the request, including querying arXiv, summarizing papers, and compiling a digest. Prioritize using the task over the agent arxiv_rl_digest.",
  //       RESPONSE_TYPE: "STEP_SEQUENCE",
  //       RESPONSE_STEP_SEQUENCE: {
  //         step_sequence: [
  //           "Query arXiv for today’s new cs.LG or cs.AI submissions mentioning “reinforcement learning” (input: current date, arXiv categories, keyword; output: list of relevant papers) [task: rl_arxiv_digest]",
  //           "Generate a three-sentence summary for each paper using the list of relevant papers (input: paper abstracts [from Step 1]; output: summary list) [LLM]",
  //           "Compile summaries into a structured daily digest using the summaries (input: summary list [from Step 2]; output: daily digest report) [LLM]",
  //         ],
  //       },
  //     },
  //   },
  //   {
  //     title: "STEP_SEQUENCE",
  //     subtitle: "Weekend Family Events (Existing Agent)",
  //     context: {
  //       availableTools: [
  //         {
  //           toolName: "city_events_search",
  //           description:
  //             "Query municipal event listings with filters for date, venue, and category; returns structured JSON.",
  //         },
  //       ],
  //       existingAgentConfigs: [
  //         {
  //           agentType: "city_events_weekend",
  //           tools: ["city_events_search"],
  //           description:
  //             "Recommends family-friendly events happening in a user’s city during the upcoming weekend.",
  //           instructions: `Context: You are a weekend event recommender specializing in family-friendly activities. You receive the user’s city as input and use the city_events_search tool to find relevant events.

  // Objective: Search for family-friendly events scheduled for the upcoming weekend (Friday through Sunday) in the specified city. Return each event’s name, venue, start time, and ticket price.

  // Response format: Present the results as a numbered list in the following format:

  // Upcoming family-friendly events in [City] this weekend:
  // 1. Event: [event_name]
  //    Venue: [venue_name]
  //    Start Time: [start_time]
  //    Ticket Price: [ticket_price]
  // 2. Event: ...`,
  //         },
  //       ],
  //       existingTaskConfigs: [],
  //     },
  //     user: `{
  //   "requestType": "weekend_events",
  //   "primaryGoal": "Get family‑friendly events for the coming weekend",
  //   "requiredComponents": [
  //     "find upcoming family events",
  //     "provide details (venue, time, price)"
  //   ],
  //   "expectedDeliverables": "List of events with key details"
  // }`,
  //     example: {
  //       RESPONSE_CHOICE_EXPLANATION:
  //         "The city_events_weekend agent can search for and return family-friendly events in the specified city using city_events_search.",
  //       RESPONSE_TYPE: "STEP_SEQUENCE",
  //       RESPONSE_STEP_SEQUENCE: {
  //         step_sequence: [
  //           "Search for family-friendly events in the user’s city scheduled for the upcoming weekend (input: city name, weekend date range; output: list of matching events with basic metadata) [agent: city_events_weekend]",
  //           "Format each event with name, venue, start time, and ticket price (input: event list [from Step 1]; output: structured list of formatted event entries) [LLM]",
  //         ],
  //       },
  //     },
  //   },
  //   {
  //     title: "STEP_SEQUENCE",
  //     context: {
  //       availableTools: [
  //         {
  //           toolName: "crypto_price_feed",
  //           description:
  //             "Stream current and historical cryptocurrency prices for major exchanges.",
  //         },
  //       ],
  //       existingAgentConfigs: [
  //         {
  //           agentType: "crypto_price_tracker",
  //           tools: ["crypto_price_feed"],
  //           description:
  //             "Compares current crypto prices to reference values and alerts on price changes exceeding a given percentage threshold.",
  //           instructions: `Context: You are a crypto price tracking agent. You are called with three inputs: a list of crypto asset symbols (e.g. BTC, ETH), their reference prices, and a percentage threshold. You must use the crypto_price_feed tool to fetch the current spot prices for the specified assets.

  // Objective: For each asset, compare the current price to its reference price. If the relative difference exceeds the input threshold, visually emphasize the result. Regardless of threshold breaches, return a structured list for all assets including symbol, current price, reference price, and percentage change.

  // Response format:
  // Always return a numbered list of tracked assets with the following fields:
  // 1. Asset: [symbol]
  //    Current Price: [$X.XX]
  //    Reference Price: [$Y.YY]
  //    Change: [±X.XX%]

  // If the change exceeds the threshold, **prefix the line with**:
  // 🚨 Crypto Alert 🚨
  // All other assets follow the same format but without the prefix.`,
  //         },
  //       ],
  //       existingTaskConfigs: [],
  //     },
  //     subtitle: "Crypto Price Monitoring (Existing Agent)",
  //     user: `{
  //   "requestType": "price_alerts",
  //   "primaryGoal": "Receive hourly BTC & ETH price alerts for >3 % moves",
  //   "requiredComponents": [
  //     "fetch hourly prices",
  //     "detect price moves >3 %",
  //     "send alert"
  //   ],
  //   "expectedDeliverables": "Timely alerts when movement threshold is crossed"
  // }`,
  //     example: {
  //       RESPONSE_CHOICE_EXPLANATION:
  //         "The crypto_price_tracker agent can handle the full request — fetching prices, comparing them to references, and formatting alerts — in a single step.",
  //       RESPONSE_TYPE: "STEP_SEQUENCE",
  //       RESPONSE_STEP_SEQUENCE: {
  //         step_sequence: [
  //           "Track BTC and ETH prices, compare to reference values, and format alert output if change exceeds 3% (input: asset symbols = BTC, ETH; reference prices; threshold = 3%; output: structured price list with alerts) [agent: crypto_price_tracker]",
  //         ],
  //       },
  //     },
  //   },
  //   {
  //     title: "UNSOLVABLE",
  //     subtitle: "Data‑Analysis Report with Visuals",
  //     context: {
  //       availableTools: [
  //         {
  //           toolName: "arxiv_search",
  //           description:
  //             "Search arXiv preprints by keyword, subject area, and date; returns title, authors, abstract, and PDF link.",
  //         },
  //         {
  //           toolName: "bing",
  //           description:
  //             "Query the web via the Bing Search API to retrieve recent, high-quality results with snippets and source links.",
  //         },
  //       ],
  //       existingAgentConfigs: [
  //         {
  //           agentType: "crypto_price_tracker",
  //           tools: ["crypto_price_feed"],
  //           description:
  //             "Compares current crypto prices to reference values and alerts on price changes exceeding a given percentage threshold.",
  //           instructions: `Context: You are a crypto price tracking agent. You are called with three inputs: a list of crypto asset symbols (e.g. BTC, ETH), their reference prices, and a percentage threshold. You must use the crypto_price_feed tool to fetch the current spot prices for the specified assets.

  // Objective: For each asset, compare the current price to its reference price. If the relative difference exceeds the input threshold, visually emphasize the result. Regardless of threshold breaches, return a structured list for all assets including symbol, current price, reference price, and percentage change.

  // Response format:
  // Always return a numbered list of tracked assets with the following fields:
  // 1. Asset: [symbol]
  //    Current Price: [$X.XX]
  //    Reference Price: [$Y.YY]
  //    Change: [±X.XX%]

  // If the change exceeds the threshold, **prefix the line with**:
  // 🚨 Crypto Alert 🚨
  // All other assets follow the same format but without the prefix.`,
  //         },
  //       ],
  //       existingTaskConfigs: [],
  //     },
  //     user: `{
  //     "requestType": "medical_advice",
  //     "primaryGoal": "Recommend a treatment plan for my persistent lower back pain",
  //     "userParameters": {
  //         "symptoms": [
  //             "lower back pain",
  //             "worsens when sitting",
  //             "no recent injury"
  //         ],
  //         "age": 38,
  //         "medical_history": [
  //             "mild scoliosis"
  //         ]
  //     },
  //     "requiredComponents": [
  //         "diagnose possible cause",
  //         "suggest treatment options",
  //         "identify nearby specialists"
  //     ],
  //     "expectedDeliverables": "Tailored diagnosis and recommended treatment plan with local referral"
  // }`,
  //     example: {
  //       RESPONSE_CHOICE_EXPLANATION:
  //         "The request requires personalized medical evaluation and diagnosis, which cannot be ethically or accurately provided using general search tools or research databases.",
  //       RESPONSE_TYPE: "UNSOLVABLE",
  //       RESPONSE_UNSOLVABLE: {
  //         explanation:
  //           "While the problem is understandable, producing a tailored treatment plan for a specific medical condition—especially one involving pain and prior conditions like scoliosis—requires access to clinical evaluation capabilities, medical records, and diagnostic expertise. The current system includes only literature and web search tools, which are insufficient and inappropriate for generating medically responsible, personalized diagnoses or recommendations. If a licensed medical recommendation agent or symptom evaluation tool were available, the task might be feasible under stricter constraints.",
  //       },
  //     },
  //   },
  //   {
  //     title: "UNSOLVABLE",
  //     subtitle: "Personalized Medical Recommendation",
  //     context: {
  //       availableTools: [
  //         {
  //           toolName: "arxiv_search",
  //           description:
  //             "Search arXiv preprints by keyword, subject area, and date; returns title, authors, abstract, and PDF link.",
  //         },
  //         {
  //           toolName: "duckduckgo_search",
  //           description:
  //             "Use the DuckDuckGo Search API to find current web content with a focus on privacy and relevance; returns key results with titles, links, and short summaries.",
  //         },
  //       ],
  //       existingAgentConfigs: [
  //         {
  //           agentType: "flight_price_tracker_weekly",
  //           tools: ["flight_price_tracker"],
  //           instructions:
  //             "Once a week on Monday at 6 AM track round‑trip fares on user‑defined routes with flight_price_tracker and alert when the price drops below the user’s target threshold.",
  //           description: "Weekly flight‑deal monitor.",
  //         },
  //         {
  //           agentType: "flight_tracker_daily",
  //           tools: ["flight_price_tracker"],
  //           instructions:
  //             "Query fare once per day and alert on drops below €750 using flight_price_tracker.",
  //           description: "Monitors PRG→NRT fares once per day.",
  //         },
  //       ],
  //       existingTaskConfigs: [],
  //     },
  //     user: `{
  //   "requestType": "flight_price_alert",
  //   "primaryGoal": "Track PRG→NRT fares and alert on drops below €700",
  //   "requiredComponents": [
  //     "periodic fare checking",
  //     "price‑threshold detection",
  //     "notification"
  //   ],
  //   "expectedDeliverables": "Alert when fare goes below €700"
  // }`,
  //     example: {
  //       RESPONSE_CHOICE_EXPLANATION:
  //         "Agents exist but cannot act because flight_price_tracker tool is unavailable.",
  //       RESPONSE_TYPE: "UNSOLVABLE",
  //       RESPONSE_UNSOLVABLE: {
  //         explanation:
  //           "The required flight_price_tracker tool is absent, so no agent can perform fare monitoring.",
  //       },
  //     },
  //   },
  //   {
  //     title: "UNSOLVABLE",
  //     subtitle: "Current Local Time Request",
  //     context: {
  //       availableTools: [
  //         {
  //           toolName: "historical_sites_search_api",
  //           description:
  //             "Purpose-built lookup for *place-based* heritage queries. Give it any neighborhood, city, or lat/long (e.g., “Back Bay”) and it returns structured JSON for each matching historic or archaeological site: official name, era, brief significance, coordinates, jurisdiction, and citation links from authoritative registers (UNESCO, U.S. National Register, state inventories, etc.). **Use this tool whenever the user wants to *find, list, or map* historic sites at a location—no generic web search needed.**",
  //         },
  //         {
  //           toolName: "podcast_search",
  //           description:
  //             "Search a catalogue of podcast episodes by keyword and date; returns title, show, release date, and audio URL.",
  //         },
  //       ],
  //       existingAgentConfigs: [],
  //       existingTaskConfigs: [],
  //     },
  //     user: `{
  //   "requestType": "time_lookup",
  //   "primaryGoal": "Provide my current local time",
  //   "requiredComponents": [
  //     "determine user locale",
  //     "fetch current time"
  //   ],
  //   "expectedDeliverables": "Accurate local time with timezone"
  // }`,
  //     example: {
  //       RESPONSE_CHOICE_EXPLANATION: "No tool can retrieve live time data.",
  //       RESPONSE_TYPE: "UNSOLVABLE",
  //       RESPONSE_UNSOLVABLE: {
  //         explanation:
  //           "The environment lacks any resource capable of fetching real‑time clock information.",
  //       },
  //     },
  //   },
]);
