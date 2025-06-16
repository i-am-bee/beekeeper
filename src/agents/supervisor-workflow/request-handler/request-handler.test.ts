// import { getChatLLM } from "@/helpers/llm.js";
// import { addSeconds, subMinutes } from "date-fns";
// import { describe, expect, it } from "vitest";
// import {
//   AssistantWorkflowMessage,
//   UserWorkflowMessage,
//   WorkflowMessage,
// } from "../dto.js";
// import { RequestOutputTypeEnum, RequestOutputTypeEnumSchema } from "./dto.js";
// import * as requestHandler from "./request-handler-old.js";

// interface TestDataItem {
//   name?: string;
//   input: string;
//   history?: WorkflowMessage[];
//   expected: {
//     type: RequestOutputTypeEnum;
//   };
// }

// const testGenerator = (dataset: TestDataItem[]) =>
//   dataset.map((item) => {
//     it(item.name || item.input, async () => {
//       const resp = await requestHandler.run(llm, {
//         message: {
//           kind: "user",
//           content: item.input,
//           createdAt: new Date(),
//         },
//         history: item.history,
//       });

//       console.log(`### INPUT`);
//       console.log(`${item.input}\n`);
//       console.log(`### RESPONSE`);
//       console.log(`${resp.explanation}\n`);
//       console.log(`${resp.message.content}\n\n`);
//       console.log(`${resp.raw}\n\n`);

//       expect(resp.type).toEqual(item.expected.type);
//       expect(resp.message.content).toBeDefined();
//     });
//   });

// const llm = getChatLLM("supervisor");

// describe("Request handler", () => {
//   describe(RequestOutputTypeEnumSchema.Values.DIRECT_ANSWER, () => {
//     testGenerator([
//       {
//         input: "Hi!",
//         expected: {
//           type: RequestOutputTypeEnumSchema.Values.DIRECT_ANSWER,
//         },
//       },
//       {
//         input: "How are you?",
//         expected: {
//           type: RequestOutputTypeEnumSchema.Values.DIRECT_ANSWER,
//         },
//       },
//       {
//         input: "What can you do?",
//         expected: {
//           type: RequestOutputTypeEnumSchema.Values.DIRECT_ANSWER,
//         },
//       },
//       {
//         input: "Thanks for your help.",
//         expected: { type: RequestOutputTypeEnumSchema.Values.DIRECT_ANSWER },
//       },
//       {
//         input: "Goodbye!",
//         expected: { type: RequestOutputTypeEnumSchema.Values.DIRECT_ANSWER },
//       },
//       {
//         input: "Explain your limitations.",
//         expected: { type: RequestOutputTypeEnumSchema.Values.DIRECT_ANSWER },
//       },
//       {
//         input: "Tell me a fun fact about space.",
//         expected: { type: RequestOutputTypeEnumSchema.Values.DIRECT_ANSWER },
//       },
//     ]);
//   });

//   describe(RequestOutputTypeEnumSchema.Values.CLARIFICATION, () => {
//     testGenerator([
//       {
//         input: "Can you tel",
//         expected: {
//           type: RequestOutputTypeEnumSchema.Values.CLARIFICATION,
//         },
//       },
//       {
//         input: "Can you find a flight to the Seattle?",
//         expected: {
//           type: RequestOutputTypeEnumSchema.Values.CLARIFICATION,
//         },
//       },
//       {
//         input: "Who is the president?",
//         expected: {
//           type: RequestOutputTypeEnumSchema.Values.CLARIFICATION,
//         },
//       },
//       {
//         input: "Can you find me a flat?",
//         expected: {
//           type: RequestOutputTypeEnumSchema.Values.CLARIFICATION,
//         },
//       },
//       {
//         input: "Can you find me a used car?",
//         expected: {
//           type: RequestOutputTypeEnumSchema.Values.CLARIFICATION,
//         },
//       },
//       {
//         input: "Book a hotel in Paris.",
//         expected: { type: RequestOutputTypeEnumSchema.Values.CLARIFICATION },
//       },
//       {
//         name: "Ambiguous but multi‑step — CLARIFICATION has priority over PASS_TO_PLANNER",
//         input: "Plan a trip for me.",
//         expected: { type: RequestOutputTypeEnumSchema.Values.CLARIFICATION },
//       },
//     ]);
//   });

//   describe(RequestOutputTypeEnumSchema.Values.PASS_TO_PLANNER, () => {
//     describe(`Realtime data without need of orchestration`, () => {
//       testGenerator([
//         {
//           input: "What time is it?",
//           expected: {
//             type: RequestOutputTypeEnumSchema.Values.PASS_TO_PLANNER,
//           },
//         },
//         {
//           input: "Who is the president of Czechia?",
//           expected: {
//             type: RequestOutputTypeEnumSchema.Values.PASS_TO_PLANNER,
//           },
//         },
//         {
//           input: "What's the latest price of Tesla?",
//           expected: {
//             type: RequestOutputTypeEnumSchema.Values.PASS_TO_PLANNER,
//           },
//         },
//         {
//           input: "Tell me about the latest iPhone.",
//           expected: {
//             type: RequestOutputTypeEnumSchema.Values.PASS_TO_PLANNER,
//           },
//         },
//         {
//           input: "Get the five most recent released series",
//           expected: {
//             type: RequestOutputTypeEnumSchema.Values.PASS_TO_PLANNER,
//           },
//         },
//         {
//           input:
//             "Get the five most recent sci‑fi series released in the past six months on any of these streaming platforms: Netflix, Max, Prime Video, or SkyShowtime.",
//           expected: {
//             type: RequestOutputTypeEnumSchema.Values.PASS_TO_PLANNER,
//           },
//         },
//         {
//           input:
//             "Can you find a flight to the Seattle? It should be a one-way flight from Prague next week on Wednesday. We travel in couple. We would like to travel in business class and don't have any another preferences.",
//           expected: {
//             type: RequestOutputTypeEnumSchema.Values.PASS_TO_PLANNER,
//           },
//         },
//       ]);
//     });

//     describe(`Complex workflow assignment`, () => {
//       testGenerator([
//         {
//           input:
//             "Analyze the attached CSV of sales data and produce a dashboard highlighting quarterly revenue trends and customer churn.",
//           expected: {
//             type: RequestOutputTypeEnumSchema.Values.PASS_TO_PLANNER,
//           },
//         },
//         {
//           input:
//             "Plan a 5‑day trip to Rome in September including flights from Prague, a 4‑star hotel within walking distance of the Colosseum, daily sightseeing itinerary, and cost estimate.",
//           expected: {
//             type: RequestOutputTypeEnumSchema.Values.PASS_TO_PLANNER,
//           },
//         },
//         {
//           input:
//             "Aggregate and summarize the ten most recent peer‑reviewed papers on quantum computing published on arXiv, and generate a slide deck for an executive briefing.",
//           expected: {
//             type: RequestOutputTypeEnumSchema.Values.PASS_TO_PLANNER,
//           },
//         },
//         {
//           input:
//             "Build a sentiment‑analysis dashboard for #AI tweets posted in the last 24 hours and schedule it to refresh hourly.",
//           expected: {
//             type: RequestOutputTypeEnumSchema.Values.PASS_TO_PLANNER,
//           },
//         },
//         {
//           name: "Poem generation",
//           input:
//             "Create four distinct poems on these topics: vikings, neutrinos, marshmallows, and cats.",
//           expected: {
//             type: RequestOutputTypeEnumSchema.Values.PASS_TO_PLANNER,
//           },
//         },
//         {
//           name: "Poem generation with analysis",
//           input:
//             "Create four distinct poems on these topics: vikings, neutrinos, marshmallows, and cats. Then craft a hip-hop song that deliberately incorporates specific imagery, phrases, and themes from each poem. Then take the hip-hop song and generated poems and highlight which elements from each original poem were integrated into your hip-hop lyrics there, demonstrating parallelization and how multiple specialized outputs enhance the final creative synthesis. So the final output should consist of original poems, the song and the analysis.",
//           expected: {
//             type: RequestOutputTypeEnumSchema.Values.PASS_TO_PLANNER,
//           },
//         },
//       ]);
//     });

//     describe(`Pass to planner after clarification`, () => {
//       const createdAt = subMinutes(new Date(), 5);
//       testGenerator([
//         {
//           input:
//             "It should one-way flight from Prague next week on Wednesday. We travel in couple. We would like to travel in business class and don't have any another preferences.",
//           history: [
//             {
//               kind: "user",
//               createdAt: createdAt,
//               content: "Can you find a flight to the Seattle?",
//             } satisfies UserWorkflowMessage,
//             {
//               kind: "assistant",
//               createdAt: addSeconds(createdAt, 5),
//               content: `RESPONSE_CHOICE_EXPLANATION: The request lacks critical details such as departure city, travel dates, and number of passengers.
// RESPONSE_TYPE: CLARIFICATION
// RESPONSE: To find the best flight options for you, I need a bit more information:
// 1. Departure city/airport
// 2. Travel dates (or a range)
// 3. Number of passengers
// 4. Preferred airlines (if any)
// 5. Any specific travel class (economy, business, etc.)`,
//             } satisfies AssistantWorkflowMessage,
//           ],
//           expected: {
//             type: RequestOutputTypeEnumSchema.Values.PASS_TO_PLANNER,
//           },
//         },
//         {
//           name: "Who is the president of Czechia?",
//           input: "Czechia",
//           history: [
//             {
//               kind: "user",
//               content: "Who is the president?",
//               createdAt,
//             } satisfies UserWorkflowMessage,
//             {
//               kind: "assistant",
//               content: `RESPONSE_CHOICE_EXPLANATION: Country not specified; need clarification to identify the correct president
// RESPONSE_TYPE: CLARIFICATION
// RESPONSE: I'd be happy to help, but I need to know which country's president you're asking about. Are you referring to the United States, or would you like information on the president of another country?`,
//               createdAt,
//             } satisfies AssistantWorkflowMessage,
//           ],
//           expected: {
//             type: RequestOutputTypeEnumSchema.Values.PASS_TO_PLANNER,
//           },
//         },
//         // TODO Add
//         // {
//         //   input: "Can you find me a flat?",
//         //   expected: {
//         //     type: RequestOutputTypeEnumSchema.Values.CLARIFICATION,
//         //   },
//         // },
//         // {
//         //   input: "Get the five most recent released series",
//         //   expected: {
//         //     type: RequestOutputTypeEnumSchema.Values.CLARIFICATION,
//         //   },
//         // },
//         // {
//         //   input: "Book a hotel in Paris.",
//         //   expected: { type: RequestOutputTypeEnumSchema.Values.CLARIFICATION },
//         // },
//         // {
//         //   name: "Ambiguous but multi‑step — CLARIFICATION has priority over PASS_TO_PLANNER",
//         //   input: "Plan a trip for me.",
//         //   expected: { type: RequestOutputTypeEnumSchema.Values.CLARIFICATION },
//         // },
//       ]);
//     });
//   });
// });
