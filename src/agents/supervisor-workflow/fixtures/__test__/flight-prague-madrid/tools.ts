import { AgentAvailableTool } from "@/agents/supervisor-workflow/workflow-composer/task-initializer/agent-config-initializer/dto.js";
import { createFixtures } from "../../base/fixtures.js";

const ENTRIES = [
  {
    toolName: "flight_search_api",
    description:
      "Searches available flights based on origin, destination(s), travel dates, airline alliance preference, seat preference, and currency. Supports one-way and round-trip itineraries. Returns airline name, flight numbers, schedule, stops, fare, seat availability, and direct booking link.",
    toolInput:
      '{"origin":"<city or airport, e.g. Prague>","destinations":["<city or airport, e.g. Madrid>"],"departureDate":"<YYYY-MM-DD, e.g. 2025-07-13>","returnDate":"<YYYY-MM-DD (optional for one-way), e.g. 2025-07-18>","preferredAirlineAlliance":"<string (optional), e.g. Star Alliance>","seatPreference":"<aisle|window|any>","currency":"<ISO currency code, e.g. EUR>"}',
  },
  {
    toolName: "hotel_search_api",
    description:
      "Finds hotel accommodations by location, check-in/check-out dates, star rating, amenities, location proximity, and price range. Returns hotel name, address, rating, amenities list, total cost, and direct booking link.",
    toolInput:
      '{"location":"<city or district, e.g. central Madrid>","checkInDate":"<YYYY-MM-DD, e.g. 2025-07-13>","checkOutDate":"<YYYY-MM-DD, e.g. 2025-07-18>","starRating":"<3-star|4-star|5-star|any>","amenities":["<amenity string, e.g. reliable Wi-Fi>"],"proximity":"<location string, e.g. within 10 minutes from city center>","maxNightlyRate":<number (optional), e.g. 200>,"currency":"<ISO currency code, e.g. EUR>"}',
  },
  {
    toolName: "combined_cost_evaluator",
    description:
      "Calculates the total cost of multiple labeled components (e.g. services, items, tasks) and checks if the total stays within a specified budget. Returns total cost, within-budget flag, and optionally identifies top contributors to overages.",
    toolInput:
      '{"components":[{"label":"<string, e.g. Flight>","price":<number, e.g. 780>}],"budget":<number, e.g. 2500>,"currency":"<ISO currency code, e.g. EUR>","tolerancePercent":<number (optional), e.g. 5>}',
  },
] as const satisfies AgentAvailableTool[];

export default createFixtures(ENTRIES, ({ toolName }) => toolName);
