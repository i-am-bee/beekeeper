import { AgentAvailableTool } from "@/agents/supervisor-workflow/workflow-composer/task-initializer/agent-config-initializer/dto.js";
import { createFixtures } from "../../base/fixtures.js";

const ENTRIES = [
  {
    toolName: "star_alliance_flight_search_api",
    description:
      "Searches Star Alliance carriers for round-trip itineraries given origin, destination airport list, travel dates and seat-preference filters. Returns airline, flight numbers, departure/arrival times, number of stops, fare in specified currency, seat-availability flags, and direct booking URL.",
    toolInput:
      '{"origin":"string","destinations":["string"],"departureDate":"YYYY-MM-DD","returnDate":"YYYY-MM-DD","preferredAirlineAlliance":"string","seatPreference":"aisle|window|any","currency":"EUR"}',
  },
  {
    toolName: "tokyo_hotel_search_api",
    description:
      "Finds hotels in Tokyo by star rating, amenities (e.g. reliable Wi-Fi), date range, and proximity to a landmark. Returns hotel name, address, nightly rate, review score, geographic coordinates, and booking URL.",
    toolInput:
      '{"hotelLocation":"string (landmark or lat/long)","checkInDate":"YYYY-MM-DD","checkOutDate":"YYYY-MM-DD","hotelRating":"integer|string","amenities":["Wi-Fi",...],"maxTransitMinutes":20,"currency":"EUR"}',
  },
  {
    toolName: "transit_time_api",
    description:
      "Calculates typical public-transport travel time between two coordinates or landmarks, returning duration in minutes and a route summary.",
    toolInput:
      '{"originCoordinates":{"lat":0.0,"lng":0.0},"destinationCoordinates":{"lat":0.0,"lng":0.0},"mode":"public_transport|walking|driving","timeOfDay":"HH:MM"}',
  },
  {
    toolName: "cost_calculator_tool",
    description:
      "Computes total trip cost by adding flight fare and total accommodation cost for the stay period, returning a detailed breakdown and grand total in a chosen currency.",
    toolInput:
      '{"flightOption":{"fare":0.0,"currency":"EUR"},"hotelOption":{"nightlyRate":0.0,"nights":0,"currency":"EUR"},"includeTaxes":true}',
  },
  {
    toolName: "package_ranking_tool",
    description:
      "Ranks flight-hotel packages by weighted factors: total cost, flight convenience (duration, stops, departure/arrival times), hotel review score, and hotel-to-venue transit time. Returns a sorted list with ranking scores.",
    toolInput:
      '{"packageList":[{"flightOption":{},"hotelOption":{},"totalCost":0.0}],"weights":{"cost":0.5,"flightConvenience":0.2,"hotelScore":0.2,"transitTime":0.1}}',
  },
] as const satisfies AgentAvailableTool[];

export const fixtures = createFixtures(ENTRIES, ({ toolName }) => toolName);
