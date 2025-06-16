import { TaskStep } from "@/agents/supervisor-workflow/workflow-composer/helpers/task-step/dto.js";
import { fixtures as toolsFixtures } from "./tools.js";

export const tools = toolsFixtures;

export const prompt = "Hi, could you find round-trip flights from Prague to Tokyo—leaving Sunday 13 July 2025 and returning Friday 18 July 2025—and a good 4-star hotel with reliable Wi-Fi within about 20 minutes of Tokyo Big Sight (where the TechWorld 2025 conference runs 15–17 July), keeping the combined cost for flights and accommodation under €2 500 and, if possible, using Star Alliance aisle seats?";
export const requestHandlerOutput = `{
  "requestType": "travel_booking",
  "primaryGoal": "Find cost-effective Star Alliance round-trip flights from Prague to Tokyo (departing 13 July 2025, returning 18 July 2025) and a 4-star hotel within 20 minutes of Tokyo Big Sight, keeping the combined cost under €2 500",
  "userParameters": {
    "origin": "Prague (PRG)",
    "destination": "Tokyo (HND preferred, NRT acceptable)",
    "departureDate": "2025-07-13",
    "returnDate": "2025-07-18",
    "preferredAirlineAlliance": "Star Alliance",
    "seatPreference": "aisle",
    "hotelRating": "4-star",
    "hotelLocation": "≤20 min from Tokyo Big Sight, Koto City, Tokyo",
    "internetRequirement": "reliable Wi-Fi",
    "budget": 2500,
    "currency": "EUR",
    "tripPurpose": "Attend TechWorld 2025 (15-17 July)"
  },
  "requiredComponents": [
    "search Star Alliance flights matching dates, with aisle seat availability",
    "ensure flight prices plus accommodation stay within the €2 500 budget",
    "identify well-reviewed 4-star hotels near Tokyo Big Sight offering reliable Wi-Fi",
    "verify transit time from each hotel to Tokyo Big Sight is 20 minutes or less",
    "compile a detailed cost breakdown for each viable flight-hotel combination",
    "rank options by total cost, convenience, and review quality",
    "provide booking links or reference numbers for the recommended options"
  ],
  "expectedDeliverables": "A short list (1-3) of flight-hotel packages that satisfy every criterion, each with total price, cost breakdown, travel times, and booking details"
}`;
export const taskSteps = [
    
] satisfies TaskStep[];