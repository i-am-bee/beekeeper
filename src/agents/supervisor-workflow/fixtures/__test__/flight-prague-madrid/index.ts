import {
  ChoiceExplanations,
  WorkflowComposeFixture,
} from "../../base/workflow-compose-fixtures.js";
import agentsFixtures from "./agent-config.js";
import tasksFixtures from "./task-config.js";
import taskStepsFixtures from "./task-step.js";
import toolsFixtures from "./tools.js";

const title = "Flight and Hotel Booking for Prague to Madrid Trip";
const prompt =
  "Hi, could you find round-trip flights from Prague to Madrid—leaving Sunday 13 July 2025 and returning Friday 18 July 2025—and a good 4-star hotel with reliable Wi-Fi within about 10 minutes from centrum, keeping the combined cost for flights and accommodation under €2500 and if possible, using Star Alliance aisle seats?";

const choiceExplanations = {
  requestHandler: "",
  problemDecomposer: "All required tools are available to fulfill each component of the user's request. Each step has a clear input/output path, and the tools listed can deliver the requested data, including pricing and direct booking links. No contradictions or unresolvable gaps are present.",
} satisfies ChoiceExplanations;

const requestHandlerOutput = `{
  "requestType": "travel_booking",
  "primaryGoal": "Book round-trip flights and hotel in Madrid within budget",
  "userParameters": {
    "origin": "Prague",
    "destination": "Madrid",
    "departureDate": "2025-07-13",
    "returnDate": "2025-07-18",
    "airlinePreferences": {
      "alliance": "Star Alliance",
      "seat": "aisle"
    },
    "hotelPreferences": {
      "rating": "4-star",
      "amenities": ["reliable Wi-Fi"],
      "proximity": "within 10 minutes from city center"
    },
    "budget": "€2500"
  },
  "requiredComponents": [
    "search and filter round-trip flights with specified preferences",
    "search 4-star hotels in central Madrid with strong Wi-Fi",
    "evaluate combined cost of flight and hotel",
    "ensure total price remains under €2500",
    "return booking options with direct booking links"
  ],
  "expectedDeliverables": "List of booking options for flights and hotel that match user criteria with total price and links"
}`;

const fixtures = new WorkflowComposeFixture(
  title,
  prompt,
  choiceExplanations,
  requestHandlerOutput,
  taskStepsFixtures,
  toolsFixtures,
  agentsFixtures,
  tasksFixtures,
);

export default fixtures;
