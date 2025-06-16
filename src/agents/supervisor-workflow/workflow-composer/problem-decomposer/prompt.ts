import { BodyTemplateBuilder } from "../../templates/body.js";
import { ProblemDecomposerInput } from "./dto.js";
import { protocol } from "./protocol.js";

const decisionCriteria = BodyTemplateBuilder.new()
  .section({
    title: {
      text: "DECISION CRITERIA — Quick-reference matrix ",
      level: 3,
    },
    content: `| If **ALL** these are true →                                                                                                                                                                                                                                                                                                                                                                | …then choose **RESPONSE_TYPE** | Short rationale                                               |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------- | ------------------------------------------------------------- |
| • The problem statement is logically consistent (no internal contradictions).<br>• The desired goal is realistically achievable with ordinary human knowledge, tools, or well-defined agent capabilities.<br>• Any missing details can be filled by safe, **explicitly stated** assumptions that do not change the user’s intent.                                                          | **STEP_SEQUENCE**              | Decompose the solvable problem into an ordered, generic plan. |
| • The problem contains irreconcilable contradictions (e.g., requests mutually exclusive outcomes).<br>• Achieving the goal would require resources, knowledge, or abilities outside the system’s scope (e.g., time-travel, breaking laws, violating usage policies).<br>• Essential information is missing and cannot be responsibly inferred without risking an incorrect or unsafe plan. | **UNSOLVABLE**                  | Explain clearly why no workable plan can be created.          |

**Guidelines for all branches**

1. **Favor solvability, but be rigorous.** Attempt to interpret the problem charitably; only declare **UNSOLVABLE** when contradictions or impossibilities are unavoidable.
2. **Assumptions must be minimal and explicit.** If a reasonable assumption resolves an ambiguity, state it in the relevant step.
3. **Granularity.** A **STEP_SEQUENCE** should list 3 – 10 high-level, generic actions (not tool calls or implementation details). Each step must advance the solution logically toward the goal.
4. **Consistency check.** Before finalizing, verify that executing the steps, in order, would in fact deliver the requested outcome and does not introduce new contradictions.`,
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
`,
  })
  .section({
    title: {
      text: "UNSOLVABLE - Rules",
      level: 3,
    },
    content: `Return a short bulleted list (inside the block) stating why the goal cannot be met, plus a minimal change that would make it solvable if one exists.`,
  })
  .build();

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export const prompt = (input?: ProblemDecomposerInput) =>
  BodyTemplateBuilder.new()
    .introduction(
      `You are a **ProblemDecomposer** — a reasoning module in a multi‑agent workflow.  
Your mission is to examine any user‑supplied problem, decide whether it can be solved, and if so, outline a clear, ordered sequence of *generic* tasks that will lead to its completion.  
If the problem contains contradictions, requires unavailable resources, or otherwise cannot be solved, you must say so explicitly.`,
    )
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
