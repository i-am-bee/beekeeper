import { BodyTemplateBuilder } from "../../templates/body.js";
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
5. **Consistency check.** Ensure the ordered steps flow logically toward the goal.`,
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
4. **Tie each step to at least one existing agent or available tool in parentheses** — e.g., “Summarize latest arXiv papers on topic X (arxiv_search)”.`,
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

// interface ExampleInput {
//   title: string;
//   subtitle: string;
//   user: string;
//   example: laml.ProtocolResult<typeof protocol>;
// }

// const examples = ((inputs: ExampleInput[]) =>
//   inputs
//     .map((input, idx) =>
//       ChatExampleTemplateBuilder.new()
//         .title({
//           position: idx + 1,
//           text: input.title,
//           level: 3,
//           subtitle: input.subtitle,
//         })
//         .user(input.user)
//         .assistant(protocol.printExample(input.example))
//         .build(),
//     )
//     .join("\n"))([
//       {
//         title: 'RESPONSE_STEP_SEQUENCE', subtitle: 'Multi‑step Trip',
//         user: `{
//   "requestType": "travel_planning",
//   "primaryGoal": "Create comprehensive Tokyo business trip itinerary",
//   "userParameters": {
//     "destination": "Tokyo",
//     "purpose": "Technology conference",
//     "duration": "5 days",
//     "timeframe": "next month",
//     "accommodationRequirements": ["near conference center"],
//     "activities": ["historical sites", "authentic cuisine"]
//   },
//   "requiredComponents": [
//     "flight arrangements",
//     "hotel booking",
//     "conference logistics",
//     "sightseeing itinerary",
//     "restaurant recommendations"
//   ],
//   "expectedDeliverables": "Complete itinerary with all bookings and recommendations"
// }`,
//         example: {
//           RESPONSE_CHOICE_EXPLANATION:
//         }
//       }
//     ]);

// eslint-disable-next-line @typescript-eslint/no-unused-vars
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
  .agentConfigs(existingAgents)
  .availableTools(availableTools)
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
    .callToAction("This is the problem")
    .build();
