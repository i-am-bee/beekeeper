import { AvailableTool } from "@/agents/registry/dto.js";
import * as laml from "@/laml/index.js";
import { BodyTemplateBuilder } from "../../templates/body.js";
import { ChatExampleTemplateBuilder } from "../../templates/chat-example.js";
import { AgentConfigTiny } from "../task-initializer/agent-config-initializer/dto.js";
import { ProblemDecomposerInput } from "./dto.js";
import { protocol } from "./protocol.js";
import { ExistingResourcesBuilder } from "./templates.js";

const decisionCriteria = BodyTemplateBuilder.new()
  .section({
    title: {
      text: "DECISION CRITERIA — Quick-reference matrix ",
      level: 3,
    },
    content: `| If **ALL** these are true → | …then choose **RESPONSE_TYPE** | Short rationale |
| --- | --- | --- |
| • The problem statement is logically consistent (no internal contradictions).<br>• The desired goal is realistically achievable with ordinary human knowledge, tools, or well-defined agent capabilities.<br>• **For every step you would plan, at least one existing agent *or* available tool can plausibly carry it out.**<br>• Any missing details can be filled by safe, **explicitly stated** assumptions that do not change the user’s intent. | **STEP_SEQUENCE** | Decompose the solvable problem into an ordered, generic plan. |
| • The problem contains irreconcilable contradictions (e.g., mutually exclusive outcomes).<br>• Achieving the goal would require resources, knowledge, or abilities outside the system’s scope.<br>• **At least one intended step lacks a suitable agent/tool**, or no resources are provided at all.<br>• Essential information is missing and cannot be responsibly inferred. | **UNSOLVABLE** | Explain clearly why no workable plan can be created. |

**Guidelines for all branches**

1. **Favor solvability, but be rigorous.** Attempt the plan only if every step has a matching resource.  
2. **Assumptions must be minimal and explicit.** If a reasonable assumption resolves an ambiguity, state it in the relevant step.  
3. **Granularity.** A **STEP_SEQUENCE** should list 3 – 10 high-level, generic actions (not tool calls or implementation details).  
4. **Resource check.** Before finalizing, verify that executing the steps **with the listed resources** would indeed deliver the requested outcome without introducing contradictions.  
5. **Consistency check.** Ensure the ordered steps flow logically toward the goal.

**Tool-selection constraint**

* When referencing a tool in any \`(tool_name)\` parenthesis, you **MUST** pick **exactly one** tool that appears in the current “Available agent tools” list.  
* **Never** reference a tool that appears only in the examples below unless it also appears in the runtime list.  
* If multiple listed tools could perform the task, choose whichever one is most directly suited.
`,
  })
  .build();

const guidelines = BodyTemplateBuilder.new()
  .section({
    title: {
      text: "Fidelity to Input",
      level: 3,
    },
    content: `1. **Do not invent, assume, or request extra information.**
2. If a parameter is vital and absent, switch to **UNSOLVABLE** rather than adding a “Collect X from user” step.
3. If a parameter is helpful but not essential (e.g., passenger count when booking a sample flight), phrase the task generically: “Book flight” without specifying details.`,
  })
  .section({
    title: {
      text: "STEP_SEQUENCE - Rules",
      level: 3,
    },
    content: `1. Use plain imperatives (e.g., “Book flight Prague → Rome”).
2. Each task should be executable by a single specialized agent.
3. Optional hints may follow in parentheses, but avoid concrete tool or vendor names unless the user supplied them.
4. **Tie each step to at least one existing agent or available tool in parentheses** — e.g., “Summarize latest arXiv papers on topic X (arxiv_search)”.
5. **The tool name you list MUST obey the Tool-selection constraint above.**`,
  })
  .section({
    title: {
      text: "UNSOLVABLE - Rules",
      level: 3,
    },
    newLines: {
      contentEnd: 0,
    },
    content: `Return a short bulleted list (inside the block) stating **which step(s)** cannot be executed and why, plus a minimal change that would make it solvable if one exists.`,
  })
  .build();

interface ExampleInput {
  title: string;
  subtitle: string;
  user: string;
  context: {
    availableTools: AvailableTool[];
    existingAgentConfigs: AgentConfigTiny[];
  };
  example: laml.ProtocolResult<typeof protocol>;
}

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
            .availableTools(input.context.availableTools)
            .agentConfigs(input.context.existingAgentConfigs)
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
  {
    title: "RESPONSE_STEP_SEQUENCE",
    subtitle: "Multi‑step Trip",
    context: {
      availableTools: [
        {
          toolName: "arxiv_search",
          description:
            "Search arXiv preprints by keyword, subject area, and date; returns title, authors, abstract, and PDF link.",
        },
        {
          toolName: "web_search",
          description:
            "A lightweight utility that fires off a query to web search and returns the top‑ranked results (title, URL, snippet, and source site) in a compact JSON array.",
        },
        {
          toolName: "maps",
          description:
            "Searches for geographic locations, businesses, and directions using maps data.",
        },
      ],
      existingAgentConfigs: [],
    },
    user: `{
  "requestType": "travel_planning",
  "primaryGoal": "Create comprehensive Tokyo business trip itinerary",
  "userParameters": {
    "destination": "Tokyo",
    "purpose": "Technology conference",
    "duration": "5 days",
    "timeframe": "next month",
    "accommodationRequirements": ["near conference center"],
    "activities": ["historical sites", "authentic cuisine"]
  },
  "requiredComponents": [
    "flight arrangements",
    "hotel booking",
    "conference logistics",
    "sightseeing itinerary",
    "restaurant recommendations"
  ],
  "expectedDeliverables": "Complete itinerary with all bookings and recommendations"
}`,
    example: {
      RESPONSE_CHOICE_EXPLANATION:
        "All requested subtasks can be completed using web_search and maps.",
      RESPONSE_TYPE: "STEP_SEQUENCE",
      RESPONSE_STEP_SEQUENCE: {
        step_sequence: [
          "Search flight options to Tokyo that match the requested timeframe (web_search)",
          "Identify hotels near the conference centre that fit the accommodation requirements (maps)",
          "Gather conference schedule, venue location, and registration details (web_search)",
          "Plan a sightseeing route covering historical sites and authentic‑cuisine spots (maps)",
          "Compile a five‑day itinerary combining flights, accommodation, conference logistics, sightseeing, and dining recommendations (web_search)",
        ],
      },
    },
  },
  {
    title: "STEP_SEQUENCE",
    subtitle: "Latest iPhone Information",
    context: {
      availableTools: [
        {
          toolName: "arxiv_search",
          description:
            "Search arXiv preprints by keyword, subject area, and date; returns title, authors, abstract, and PDF link.",
        },
        {
          toolName: "web_search",
          description:
            "A lightweight utility that fires off a query to web search and returns the top‑ranked results (title, URL, snippet, and source site) in a compact JSON array.",
        },
        {
          toolName: "maps",
          description:
            "Searches for geographic locations, businesses, and directions using maps data.",
        },
      ],
      existingAgentConfigs: [],
    },
    user: `{
  "requestType": "product_information",
  "primaryGoal": "Provide detailed, current information on the latest iPhone model",
  "userParameters": {
    "product": "iPhone",
    "focus": "latest model"
  },
  "requiredComponents": [
    "identify current flagship model",
    "fetch official specifications and features",
    "gather pricing and availability data by region",
    "summarize notable changes from previous generation"
  ],
  "expectedDeliverables": "Comprehensive summary covering model name, launch date, specs, notable features, regional prices, and availability"
}`,
    example: {
      RESPONSE_CHOICE_EXPLANATION:
        "Up‑to‑date specifications and pricing are retrievable via web_search.",
      RESPONSE_TYPE: "STEP_SEQUENCE",
      RESPONSE_STEP_SEQUENCE: {
        step_sequence: [
          "Identify the current flagship iPhone model and launch date (web_search)",
          "Retrieve official specifications and key features (web_search)",
          "Collect pricing and availability data for major regions (web_search)",
          "Summarize notable changes from the previous generation (web_search)",
          "Compile a concise, cited report covering specs, features, prices, and availability (web_search)",
        ],
      },
    },
  },
  {
    title: "STEP_SEQUENCE",
    subtitle: "Current Czech President",

    context: {
      availableTools: [
        {
          toolName: "arxiv_search",
          description:
            "Search arXiv preprints by keyword, subject area, and date; returns title, authors, abstract, and PDF link.",
        },
        {
          toolName: "web_search",
          description:
            "A lightweight utility that fires off a query to web search and returns the top‑ranked results (title, URL, snippet, and source site) in a compact JSON array.",
        },
        {
          toolName: "maps",
          description:
            "Searches for geographic locations, businesses, and directions using maps data.",
        },
      ],
      existingAgentConfigs: [],
    },
    user: `{
  "requestType": "factual_lookup",
  "primaryGoal": "Identify the current president of Czechia",
  "userParameters": {
    "country": "Czechia"
  },
  "requiredComponents": [
    "retrieve latest official or reputable source on Czech head of state",
    "verify inauguration date and term status",
    "compile concise answer with citation"
  ],
  "expectedDeliverables": "Verified name of the current Czech president with inauguration date and citation"
}`,
    example: {
      RESPONSE_CHOICE_EXPLANATION:
        "A simple factual lookup can be handled by web_search.",
      RESPONSE_TYPE: "STEP_SEQUENCE",
      RESPONSE_STEP_SEQUENCE: {
        step_sequence: [
          "Retrieve the name of the current Czech president from reputable sources (web_search)",
          "Verify inauguration date and term status with an independent source (web_search)",
          "Deliver a concise answer including name, inauguration date, and citation (web_search)",
        ],
      },
    },
  },
  {
    title: "STEP_SEQUENCE",
    subtitle: "Tornado‑Safety Workflow (Existing Agent)",
    context: {
      availableTools: [
        {
          toolName: "arxiv_search",
          description:
            "Search arXiv preprints by keyword, subject area, and date; returns title, authors, abstract, and PDF link.",
        },
        {
          toolName: "web_search",
          description:
            "A lightweight utility that fires off a query to web search and returns the top‑ranked results (title, URL, snippet, and source site) in a compact JSON array.",
        },
        {
          toolName: "maps",
          description:
            "Searches for geographic locations, businesses, and directions using maps data.",
        },
        {
          toolName: "weather_alert_feed",
          description:
            "Stream National Weather Service alerts with geolocation filters.",
        },
      ],
      existingAgentConfigs: [
        {
          agentType: "weather_tornado_immediate",
          tools: ["weather_alert_feed"],
          instructions:
            "Continuously monitor weather_alert_feed for tornado watches or warnings within 50 km of the user’s coordinates and notify immediately.",
          description: "Instant tornado warnings.",
        },
      ],
    },
    user: `{
  "requestType": "safety_monitoring",
  "primaryGoal": "Receive immediate tornado alerts and identify nearest shelters",
  "userParameters": {
    "radius": "50 km"
  },
  "requiredComponents": [
    "continuous tornado alert monitoring",
    "locate closest public tornado shelters",
    "provide shelter directions"
  ],
  "expectedDeliverables": "Real‑time warnings plus directions to the nearest shelter"
}`,
    example: {
      RESPONSE_CHOICE_EXPLANATION:
        "The existing weather_tornado_immediate agent covers alerts, and maps can locate shelters.",
      RESPONSE_TYPE: "STEP_SEQUENCE",
      RESPONSE_STEP_SEQUENCE: {
        step_sequence: [
          "Maintain continuous monitoring for tornado watches or warnings within 50 km (weather_tornado_immediate)",
          "Identify the nearest certified tornado shelters to the user’s location (maps)",
          "Provide step‑by‑step directions from the user’s location to the selected shelter (maps)",
          "Send immediate notifications combining the alert and shelter directions whenever a warning is detected (weather_tornado_immediate)",
        ],
      },
    },
  },
  {
    title: "STEP_SEQUENCE",
    subtitle: "Daily Reinforcement‑Learning Paper Digest (Existing Agent)",
    context: {
      availableTools: [
        {
          toolName: "arxiv_search",
          description:
            "Search arXiv preprints by keyword, subject area, and date; returns title, authors, abstract, and PDF link.",
        },
      ],
      existingAgentConfigs: [
        {
          agentType: "arxiv_rl_daily",
          tools: ["arxiv_search"],
          instructions:
            "At 07:00 Prague time search arxiv_search for new submissions tagged cs.LG or cs.AI whose abstract mentions “reinforcement learning” and send a three‑sentence summary for each paper.",
          description: "Daily RL arXiv digest.",
        },
      ],
    },
    user: `{
  "requestType": "paper_digest",
  "primaryGoal": "Summarize today’s new reinforcement‑learning arXiv papers",
  "requiredComponents": [
    "query arXiv for new RL submissions",
    "generate three‑sentence summaries",
    "compile digest"
  ],
  "expectedDeliverables": "Concise list of today’s RL papers with summaries"
}`,
    example: {
      RESPONSE_CHOICE_EXPLANATION:
        "arxiv_rl_daily already performs these steps using arxiv_search.",
      RESPONSE_TYPE: "STEP_SEQUENCE",
      RESPONSE_STEP_SEQUENCE: {
        step_sequence: [
          "Retrieve today’s new cs.LG or cs.AI submissions mentioning “reinforcement learning” (arxiv_rl_daily)",
          "Generate a three‑sentence summary for each paper (arxiv_rl_daily)",
          "Compile the summaries into a single daily digest (arxiv_rl_daily)",
        ],
      },
    },
  },
  {
    title: "STEP_SEQUENCE",
    subtitle: "Weekend Family Events (Existing Agent)",
    context: {
      availableTools: [
        {
          toolName: "city_events_search",
          description:
            "Query municipal event listings with filters for date, venue, and category; returns structured JSON.",
        },
      ],
      existingAgentConfigs: [
        {
          agentType: "city_events_weekend",
          tools: ["city_events_search"],
          instructions:
            "Every Thursday query city_events_search for family‑friendly events in the user’s city scheduled for the coming weekend (Fri–Sun). Return name, venue, start time, and ticket price.",
          description: "Weekend family events.",
        },
      ],
    },
    user: `{
  "requestType": "weekend_events",
  "primaryGoal": "Get family‑friendly events for the coming weekend",
  "requiredComponents": [
    "find upcoming family events",
    "provide details (venue, time, price)"
  ],
  "expectedDeliverables": "List of events with key details"
}`,
    example: {
      RESPONSE_CHOICE_EXPLANATION:
        "city_events_weekend is designed to gather weekend family events via city_events_search.",
      RESPONSE_TYPE: "STEP_SEQUENCE",
      RESPONSE_STEP_SEQUENCE: {
        step_sequence: [
          "Query city_events_search for family‑friendly events scheduled for the forthcoming Fri–Sun in the user’s city (city_events_weekend)",
          "Extract name, venue, start time, and ticket price for each event (city_events_weekend)",
          "Present the compiled list to the user (city_events_weekend)",
        ],
      },
    },
  },
  {
    title: "STEP_SEQUENCE",
    context: {
      existingAgentConfigs: [
        {
          agentType: "crypto_price_tracker_hourly",
          tools: ["crypto_price_feed"],
          instructions:
            "Fetch Bitcoin and Ethereum spot prices every hour with crypto_price_feed and alert on > 3 % moves.",
          description: "Tracks BTC & ETH prices every hour.",
        },
      ],
      availableTools: [
        {
          toolName: "crypto_price_feed",
          description:
            "Stream current and historical cryptocurrency prices for major exchanges.",
        },
      ],
    },
    subtitle: "Crypto Price Monitoring (Existing Agent)",
    user: `{
  "requestType": "price_alerts",
  "primaryGoal": "Receive hourly BTC & ETH price alerts for >3 % moves",
  "requiredComponents": [
    "fetch hourly prices",
    "detect price moves >3 %",
    "send alert"
  ],
  "expectedDeliverables": "Timely alerts when movement threshold is crossed"
}`,
    example: {
      RESPONSE_CHOICE_EXPLANATION:
        "crypto_price_tracker_hourly already schedules hourly checks and alerts using crypto_price_feed.",
      RESPONSE_TYPE: "STEP_SEQUENCE",
      RESPONSE_STEP_SEQUENCE: {
        step_sequence: [
          "Fetch current BTC and ETH spot prices every hour (crypto_price_tracker_hourly)",
          "Detect any price movement greater than 3 % from the previous hour (crypto_price_tracker_hourly)",
          "Send an alert to the user when the threshold is exceeded (crypto_price_tracker_hourly)",
        ],
      },
    },
  },
  {
    title: "UNSOLVABLE",
    subtitle: "Data‑Analysis Report with Visuals",
    context: {
      existingAgentConfigs: [],
      availableTools: [
        {
          toolName: "arxiv_search",
          description:
            "Search arXiv preprints by keyword, subject area, and date; returns title, authors, abstract, and PDF link.",
        },
        {
          toolName: "web_search",
          description:
            "A lightweight utility that fires off a query to web search and returns the top-ranked results (title, URL, snippet, and source site) in a compact JSON array.",
        },
      ],
    },
    user: `{
  "requestType": "data_analysis",
  "primaryGoal": "Generate e‑commerce trend report with visuals",
  "analysisRequirements": [
    "seasonal trend detection",
    "top‑product ranking",
    "demographic correlations",
    "visualization creation"
  ],
  "expectedDeliverables": "Complete report with charts and insights"
}`,
    example: {
      RESPONSE_CHOICE_EXPLANATION:
        "Data processing and visualization require tools not present in the environment.",
      RESPONSE_TYPE: "UNSOLVABLE",
      RESPONSE_UNSOLVABLE: {
        explanation:
          "Essential analytics and charting capabilities are missing from the available resources.",
      },
    },
  },
  {
    title: "UNSOLVABLE",
    subtitle: "Flight‑Price Alert with Missing Tool",
    context: {
      existingAgentConfigs: [
        {
          agentType: "flight_price_tracker_weekly",
          tools: ["flight_price_tracker"],
          instructions:
            "Once a week on Monday at 6 AM track round‑trip fares on user‑defined routes with flight_price_tracker and alert when the price drops below the user’s target threshold.",
          description: "Weekly flight‑deal monitor.",
        },
        {
          agentType: "flight_tracker_daily",
          tools: ["flight_price_tracker"],
          instructions:
            "Query fare once per day and alert on drops below €750 using flight_price_tracker.",
          description: "Monitors PRG→NRT fares once per day.",
        },
      ],
      availableTools: [],
    },
    user: `{
  "requestType": "flight_price_alert",
  "primaryGoal": "Track PRG→NRT fares and alert on drops below €700",
  "requiredComponents": [
    "periodic fare checking",
    "price‑threshold detection",
    "notification"
  ],
  "expectedDeliverables": "Alert when fare goes below €700"
}`,
    example: {
      RESPONSE_CHOICE_EXPLANATION:
        "Agents exist but cannot act because flight_price_tracker tool is unavailable.",
      RESPONSE_TYPE: "UNSOLVABLE",
      RESPONSE_UNSOLVABLE: {
        explanation:
          "The required flight_price_tracker tool is absent, so no agent can perform fare monitoring.",
      },
    },
  },
  {
    title: "UNSOLVABLE",
    subtitle: "Current Local Time Request",
    context: {
      existingAgentConfigs: [],
      availableTools: [
        {
          toolName: "arxiv_search",
          description:
            "Search arXiv preprints by keyword, subject area, and date; returns title, authors, abstract, and PDF link.",
        },
        {
          toolName: "web_search",
          description:
            "A lightweight utility that fires off a query to web search and returns the top-ranked results (title, URL, snippet, and source site) in a compact JSON array.",
        },
      ],
    },
    user: `{
  "requestType": "time_lookup",
  "primaryGoal": "Provide my current local time",
  "requiredComponents": [
    "determine user locale",
    "fetch current time"
  ],
  "expectedDeliverables": "Accurate local time with timezone"
}`,
    example: {
      RESPONSE_CHOICE_EXPLANATION: "No tool can retrieve live time data.",
      RESPONSE_TYPE: "UNSOLVABLE",
      RESPONSE_UNSOLVABLE: {
        explanation:
          "The environment lacks any resource capable of fetching real‑time clock information.",
      },
    },
  },
]);

export const prompt = ({
  availableTools,
  existingAgents,
}: ProblemDecomposerInput) =>
  BodyTemplateBuilder.new()
    .introduction(
      `You are a **ProblemDecomposer** — a reasoning module in a multi-agent workflow.  
Your mission is to examine any user-supplied problem, decide whether it can be solved, and if so, outline a clear, ordered sequence of *generic* tasks that will lead to its completion.  
If the problem contains contradictions, requires unavailable resources, or otherwise cannot be solved, you must say so explicitly.`,
    )
    .section({
      title: {
        text: "Existing resources",
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

  .build()}

**IMPORTANT** – If at least one **suitable** agent *or* tool does **not** exist for every step you would otherwise propose, you **must** output  
\`RESPONSE_TYPE: UNSOLVABLE\` and explicitly name the unattainable step(s).  
If *no* agents or tools are provided at all, always answer \`UNSOLVABLE\`.`,
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
    })
    .section({
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
      content: `Examples are illustrative only. Do **not** copy their tool names or agent types unless those tools / agents reappear in the runtime “Available agent tools” / ”Existing agents” list.
      
${examples}`,
    })
    .callToAction("This is the problem")
    .build();
