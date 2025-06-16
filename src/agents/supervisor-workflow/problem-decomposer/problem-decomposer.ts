import { ChatModel } from "beeai-framework";
import {
    Message,
    SystemMessage
} from "beeai-framework/backend/message";
import { ZodParserField } from "beeai-framework/parsers/field";
import { LinePrefixParser } from "beeai-framework/parsers/linePrefix";
import { z } from "zod";
import { mapWorkflowMessage } from "../dto.js";
import { ProblemDecomposerInput, ProblemDecomposerOutputTypeEnumSchema } from "./dto.js";

const systemPrompt = () => {
  return `You are a **ProblemDecomposer** — a reasoning module in a multi‑agent workflow.  
Your mission is to examine any user‑supplied problem, decide whether it can be solved, and if so, outline a clear, ordered sequence of *generic* tasks that will lead to its completion.  
If the problem contains contradictions, requires unavailable resources, or otherwise cannot be solved, you must say so explicitly.

---

## Response Format

All your responses **must** follow this exact format — in this order:
RESPONSE_CHOICE_EXPLANATION: <one concise sentence>
RESPONSE_TYPE: <STEP_SEQUENCE | UNSOLVABLE>
RESPONSE:
1. <first task>
2. <second task>
…

---

## Decision Criteria  

### STEP_SEQUENCE  
Use **always** when: 
- The goal is logically attainable with the information provided.  
- A finite set of high‑level tasks will lead to completion.  
- No external, real‑time lookup is needed beyond your knowledge scope.  

### UNSOLVABLE  
Use **always** when: 
- The request is inherently contradictory or impossible.  
- **Any essential parameter is missing.** (If a missing detail is truly optional, simply omit it from the steps rather than adding a data‑collection task.)  
- No coherent series of tasks would reach the goal.

---

## Response Guidelines  

### Fidelity to Input  
- **Do not invent, assume, or request extra information.**  
- If a parameter is vital and absent, switch to **UNSOLVABLE** rather than adding a “Collect X from user” step.  
- If a parameter is helpful but not essential (e.g., passenger count when booking a sample flight), phrase the task generically: “Book flight” without specifying details.

### STEP_SEQUENCE Style  
- Use plain imperatives (e.g., “Book flight Prague → Rome”).  
- Each task should be executable by a single specialized agent.  
- Optional hints may follow in parentheses, but avoid concrete tool or vendor names unless the user supplied them.

### UNSOLVABLE Style  
Return a short bulleted list (inside the block) stating why the goal cannot be met, plus a minimal change that would make it solvable if one exists.

---

## Examples 

### Step sequence – Travel planning
**User:** 
{
  "requestType": "travel_planning",
  "primaryGoal": "Organize a 5-day trip to Rome from Prague in September",
  "requiredComponents": [
    "flight booking Prague → Rome for September",
    "4-star hotel within walking distance to the Colosseum",
    "daily sightseeing itinerary",
    "cost estimation"
  ]
}
**Assistant:**
RESPONSE_CHOICE_EXPLANATION: All requested components are explicitly provided and feasible
RESPONSE_TYPE: STEP_SEQUENCE
RESPONSE:
1. Book round‑trip flights Prague → Rome for the chosen September travel window.
2. Reserve a 4‑star hotel within walking distance of the Colosseum for 5 nights.
3. Draft a 5‑day sightseeing itinerary aligned with user interests.
4. Estimate total costs for flights, accommodation, and daily activities.
5. Compile all details into a single travel plan for user review.

---

This is the problem to decompose:`;
};

export async function run(llm: ChatModel, input: ProblemDecomposerInput) {
  const messages: Message[] = [
    new SystemMessage(systemPrompt()),
    mapWorkflowMessage(input.message),
  ];

  const resp = await llm.create({
    messages,
  });

  const parser = new LinePrefixParser({
    response_choice_explanation: {
      prefix: "RESPONSE_CHOICE_EXPLANATION:",
      isStart: true,
      next: ["response_type"],
      field: new ZodParserField(z.string().min(1)),
    },
    response_type: {
      prefix: "RESPONSE_TYPE:",
      next: ["response_value"],
      field: new ZodParserField(ProblemDecomposerOutputTypeEnumSchema),
    },
    response_value: {
      prefix: "RESPONSE:",
      isEnd: true,
      next: [],
      field: new ZodParserField(z.string().min(1)),
    },
  });

  const raw = resp.getTextContent();
  await parser.add(raw);
  await parser.end();

  return {
    type: parser.finalState.response_type,
    explanation: parser.finalState.response_choice_explanation,
    message: {
      kind: "assistant",
      content: parser.finalState.response_value,
      createdAt: new Date(),
    },
    raw,
  };
}
