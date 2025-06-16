import { AgentConfig } from "@/agents/registry/dto.js";
import { clone } from "remeda";
import { AgentConfigMinimal } from "../../workflow-composer/task-initializer/agent-config-initializer/dto.js";
import { ToolName } from "./tools.js";

export const AGENT_CONFIG_ENTRIES = [
  {
    agentType: "arxiv_rl_daily",
    description: "Daily RL arXiv digest.",
    instructions:
      "At 07:00 Prague time search arxiv_search for new submissions tagged " +
      "cs.LG or cs.AI whose abstract mentions “reinforcement learning” and send " +
      "a three-sentence summary for each paper.",
    tools: ["arxiv_search"] as const satisfies ToolName[],
    agentConfigId: "operator:arxiv_rl_daily:1",
    agentConfigVersion: 1,
  },
  {
    agentType: "book_searcher",
    tools: ["book_catalog_api"] as const satisfies ToolName[],
    description:
      "Finds books in a given genre using the book_catalog_api tool.",
    instructions: `Context: You are an agent specializing in finding books. You are activated by an external task and receive genre and location as input. You use the book_catalog_api tool to retrieve book listings.

Objective: Use the provided genre and location to fetch book listings. Return the results in a structured format.

Response format: List each book with its title, author, and description:

Books in [Genre] Genre:
1. Title: [Book Title 1] — Author: [Author 1] — Description: [Description 1]
2. Title: [Book Title 2] — Author: [Author 2] — Description: [Description 2]`,
    agentConfigId: "operator:book_searcher:1",
    agentConfigVersion: 1,
  },
  {
    agentType: "city_events_weekend",
    description: "Weekend family events.",
    instructions:
      "Every Thursday query city_events_search for family-friendly events in " +
      "the user’s city scheduled for the coming weekend (Fri-Sun). Return name, " +
      "venue, start time and ticket price.",
    tools: ["city_events_search"] as const satisfies ToolName[],
    agentConfigId: "operator:city_events_search:2",
    agentConfigVersion: 1,
  },
  {
    agentType: "crypto_price_tracker_hourly",
    description: "Tracks BTC & ETH prices every hour.",
    instructions:
      "Fetch Bitcoin and Ethereum spot prices every hour with crypto_price_feed and alert on > 3 % moves.",
    tools: ["crypto_price_feed"] as const satisfies ToolName[],
    agentConfigId: "operator:crypto_price_tracker_hourly:3",
    agentConfigVersion: 3,
  },
  {
    agentType: "fishing_schedule_finder",
    tools: ["fishing_schedule_api"] as const satisfies ToolName[],
    instructions: `Context: You are an agent specializing in finding fishing schedules. You are activated by an external task and receive fishing type and location as input. You use the fishing_schedule_api tool to retrieve fishing schedules.

Objective: Use the provided fishing type and location to fetch upcoming fishing schedules. Return the results in a structured format.

Response format: List each schedule with its date, time, and location:

Upcoming [Fishing Type] Fishing Schedules in [Location]:
1. Date: [Date 1] — Time: [Time 1] — Location: [Location 1]
2. Date: [Date 2] — Time: [Time 2] — Location: [Location 2]`,
    description:
      "Finds upcoming fishing schedules in a given location using fishing_schedule_api.",
    agentConfigId: "operator:fishing_schedule_finder:1",
    agentConfigVersion: 1,
  },
  {
    agentType: "flight_price_tracker_weekly",
    description: "Weekly flight-deal monitor.",
    instructions:
      "Once a week on Monday at 6 AM track round-trip fares on user-defined routes with " +
      "flight_price_tracker and alert when the price drops below the user’s " +
      "target threshold.",
    tools: ["flight_price_tracker"] as const satisfies ToolName[],
    agentConfigId: "operator:flight_price_tracker_weekly:1",
    agentConfigVersion: 1,
  },
  {
    agentType: "game_searcher",
    description: "Sports schedule searcher.",
    instructions:
      "You are a sports schedule searcher agent. Your task is to find " +
      "upcoming games for a specific team or league. You will receive a " +
      "request containing the team name or league and the date range for " +
      "the search. Use the sports_schedule_api tool to perform the search " +
      "and return the results in a structured format.",
    tools: ["sports_schedule_api"] as const satisfies ToolName[],
    agentConfigId: "operator:game_searcher:1",
    agentConfigVersion: 1,
  },
  {
    agentType: "historical_sites_identifier",
    description:
      "Identifies historical sites in a given location using the historical_sites_search_api tool.",
    instructions: `Context: You are an agent specializing in identifying historical sites. You are activated by an external task and receive a location as input. You use the historical_sites_search_api tool to retrieve a list of historical sites.

Objective: Use the provided location to fetch a list of historical sites. Return the results in a structured format.

Response format: List each site with its name and a brief description:

Historical Sites in Back Bay:
1. Name: [Site Name 1] — Description: [Description 1]
2. Name: [Site Name 2] — Description: [Description 2]`,
    tools: ["historical_sites_search_api"] as const satisfies ToolName[],
    agentConfigId: "operator:historical_sites_identifier:1",
    agentConfigVersion: 1,
  },
  {
    agentType: "movie_recommender",
    tools: ["movie_search_api", "movie_info_api"] as const satisfies ToolName[],
    instructions: `Context: You are an agent specializing in recommending movies. You are activated by an external task and receive preferences and year as input. You use the movie_search_api and movie_info_api tools to gather information about movies.

Objective: Provide a list of movies based on user-defined preferences and year. Include details such as title, genre, language, and release year.

Response format:
1. Title: [Movie Title 1] — Genre: [Genre 1] — Language: [Language 1] — Release Year: [Year 1]
2. Title: [Movie Title 2] — Genre: [Genre 2] — Language: [Language 2] — Release Year: [Year 2]
...
N. Title: [Movie Title N] — Genre: [Genre N] — Language: [Language N] — Release Year: [Year N]`,
    description:
      "Recommends movies based on user-defined preferences and year using movie search and info APIs.",
    agentConfigId: "operator:movie_recommender:1",
    agentConfigVersion: 1,
  },
  {
    agentType: "news_headlines",
    tools: ["news_search"],
    description: "Gathers news headlines.",
    instructions: `You are an agent specializing in collecting news headlines. You have access to a news_search tool that allows you to find articles based on keywords and time filters. Users will provide a time frame and one or more search terms for the news they want collected.

Objective: Collect news headlines that contain the user-supplied keywords within the requested time window. Use the news_search tool to execute the query, filtering results to match the specified period. Provide a list of headline URLs together with concise summaries.

Response format: Begin with a brief sentence that restates the search terms and time frame. Then list each headline on its own line, showing the URL first and a short summary after an em-dash or colon. For example:

News headlines matching “<keywords>” from the [time_window]:  
1. URL: [headline_url_1] — Summary: [headline_summary_1]  
2. URL: [headline_url_2] — Summary: [headline_summary_2]`,
    agentConfigId: "operator:news_headlines:1",
    agentConfigVersion: 1,
  },
  {
    agentType: "news_headlines_24h",
    tools: ["news_search"] as const satisfies ToolName[],
    description: "Gathers news headlines related from the past 24 hours.",
    instructions: `You are an agent specializing in collecting news headlines on chosen topic. You have access to a news_search tool that allows you to find articles based on keywords and time filters. Users will provide a time frame and one or more search terms for the news they want collected.

Objective: Collect news headlines that contain the user-supplied keywords within the requested time window (default: past 24 hours). Use the news_search tool to execute the query, filtering results to match the specified period. Provide a list of headline URLs together with concise summaries.

Response format: Begin with a brief sentence that restates the search terms and time frame. Then list each headline on its own line, showing the URL first and a short summary after an em-dash or colon. For example:

News headlines matching “<keywords>” from the past 24 hours:  
1. URL: [headline_url_1] — Summary: [headline_summary_1]  
2. URL: [headline_url_2] — Summary: [headline_summary_2]`,
    agentConfigId: "operator:news_headlines_24h:1",
    agentConfigVersion: 1,
  },
  {
    agentType: "recipe_finder",
    tools: ["recipe_catalog_api"] as const satisfies ToolName[],
    description: "Finds vegetarian recipes using the recipe_catalog_api tool.",
    instructions: `Context: You are an agent specializing in finding vegetarian recipes. You are activated by an external task and receive cuisine type as input. You use the recipe_catalog_api tool to retrieve a list of vegetarian recipes.

Objective: Use the provided cuisine type to fetch a list of vegetarian recipes. Return the results in a structured format.

Response format: List each recipe with its name, ingredients, and instructions:

Recommended Vegetarian Recipes for [Cuisine]:
1. Name: [Recipe Name 1] — Ingredients: [Ingredients 1] — Instructions: [Instructions 1]
2. Name: [Recipe Name 2] — Ingredients: [Ingredients 2] — Instructions: [Instructions 2]`,
    agentConfigId: "operator:recipe_finder:1",
    agentConfigVersion: 1,
  },
  {
    agentType: "restaurant_recommender",
    tools: ["google_search", "web_extract"] as const satisfies ToolName[],
    instructions: `Context: You are an agent specializing in recommending diverse cuisine restaurants. You are activated by an external task and receive dining preferences and location as input. You use the tavily_search_api tool to retrieve a list of restaurants.

Objective: Use the provided dining preferences and location to fetch a list of restaurants. Return the results in a structured format, listing one restaurant per cuisine type per day.

Response format: Present the recommendations day by day with cuisine type and details:

Back Bay Restaurant Recommendations:
Day 1:
- Italian: [Restaurant Name 1] — Description: [Description 1]
- Chinese: [Restaurant Name 2] — Description: [Description 2]
- French: [Restaurant Name 3] — Description: [Description 3]
Day 2:
- Italian: [Restaurant Name 4] — Description: [Description 4]
- Chinese: [Restaurant Name 5] — Description: [Description 5]
- French: [Restaurant Name 6] — Description: [Description 6]`,
    description:
      "Recommends restaurants of multiple cuisines in a given location using tavily_search_api.",
    agentConfigVersion: 1,
    agentConfigId: "operator:restaurant_recommender:1",
  },
  {
    agentType: "star_gazer",
    tools: ["astronomy_search_api"] as const satisfies ToolName[],
    description:
      "Recommends celestial objects to observe based on user-defined location and time using the astronomy_search_api tool.",
    instructions: `Context: You are an agent specializing in recommending celestial objects for observation. You are activated by an external task and receive location and time as input. You use the astronomy_search_api tool to retrieve a list of observable celestial objects.

Objective: Use the provided location and time to fetch a list of celestial objects. Return the results in a structured format.

Response format: List each celestial object with its name, description, and visibility details:

Recommended Celestial Objects in [Location] at [Time]:
1. Name: [Object Name 1] — Description: [Description 1] — Visibility: [Visibility Details 1]
2. Name: [Object Name 2] — Description: [Description 2] — Visibility: [Visibility Details 2]`,
    agentConfigId: "operator:star_gazer:1",
    agentConfigVersion: 1,
  },  
  {
    agentType: "tornado_watcher",
    description: "Tornado warnings on request.",
    instructions:
      "When called, query weather_alert_feed for tornado watches or warnings within 50 km of the user’s coordinates and return the results.",
    tools: ["weather_alert_feed"] as const satisfies ToolName[],
    agentConfigId: "operator:tornado_watcher:1",
    agentConfigVersion: 1,
  },
  {
    agentType: "yoga_studio_searcher",
    tools: ["google_search", "web_extract"] as const satisfies ToolName[],
    description:
      "Finds yoga studios in a given location using the google_search tool.",
    instructions: `Context: You are an agent specializing in finding yoga studios. You are activated by an external task and receive location and other filters as input. You use the google_search tool to retrieve a list of yoga studios.
Objective: Use the provided location and filters to fetch a list of yoga studios. Return the results in a structured format.
Response format: List each studio with its name, address, and contact information:
Yoga Studios in [Location]:
1. Name: [Studio Name 1] — Address: [Address 1] — Contact: [Contact Info 1]
2. Name: [Studio Name 2] — Address: [Address 2] — Contact: [Contact Info 2]`,
    agentConfigId: "operator:yoga_studio_searcher:1",
    agentConfigVersion: 1,
  },
  {
    agentType: "class_schedule_retriever",
    tools: ["google_search", "web_extract"] as const satisfies ToolName[],
    description:
      "Retrieves class schedules for a given yoga studio using the google_search tool.",
    instructions: `Context: You are an agent specializing in retrieving class schedules for yoga studios. You are activated by an external task and receive studio name as input. You use the google_search tool to retrieve the class schedule.
Objective: Use the provided studio name to fetch the class schedule. Return the results in a structured format.
Response format: List each class with its name, time, and instructor:
Class Schedule for [Studio Name]:
1. Class: [Class Name 1] — Time: [Time 1] — Instructor: [Instructor 1]
2. Class: [Class Name 2] — Time: [Time 2] — Instructor: [Instructor 2]`,
    agentConfigId: "operator:class_schedule_retriever:1",
    agentConfigVersion: 1,
  },
  {
    agentType: "class_filter",
    tools: [],
    description:
      "Filters yoga classes based on user preferences such as time, instructor, and class type.",
    instructions: `Context: You are an agent specializing in filtering yoga classes based on user preferences. You are activated by an external task and receive class schedule and user preferences as input. You filter the class schedule to match the user preferences.
Objective: Use the provided class schedule and user preferences to filter the classes. Return the results in a structured format.
Response format: List each class that matches the user preferences with its name, time, and instructor:
Filtered Yoga Classes:
1. Class: [Class Name 1] — Time: [Time 1] — Instructor: [Instructor 1]
2. Class: [Class Name 2] — Time: [Time 2] — Instructor: [Instructor 2]`,
    agentConfigId: "operator:class_filter:1",
    agentConfigVersion: 1,
  },
  {
    agentType: "3_day_itinerary_creator",
    tools: ["itinerary_planner_api"] as const satisfies ToolName[],
    description:
      "Creates a balanced 3-day itinerary based on provided inputs such as historical sites, games, and dining suggestions using the itinerary_planner_api tool",
    instructions: `Context: You are an agent specializing in creating itineraries. You are activated by an external task and receive inputs such as historical sites, games, and dining suggestions. You use the itinerary_planner_api to generate a detailed itinerary.

Objective: Create a balanced 3-day itinerary based on the provided inputs. Include day-by-day activities and details.

Response format: Present the itinerary day by day with activities and details:
3-Day Itinerary:
Day 1:
- Morning: Visit [Historical Site 1] — Description: [Description 1]
- Afternoon: Attend [Game 1] — Time: [Time 1] — Location: [Location 1]
- Evening: Dine at [Restaurant 1] — Cuisine: [Cuisine 1] — Description: [Description 1]
Day 2:
- Morning: Visit [Historical Site 2] — Description: [Description 2]
- Afternoon: Attend [Game 2] — Time: [Time 2] — Location: [Location 2]
- Evening: Dine at [Restaurant 2] — Cuisine: [Cuisine 2] — Description: [Description 2]
Day 3:
- Morning: Visit [Historical Site 3] — Description: [Description 3]
- Afternoon: Attend [Game 3] — Time: [Time 3] — Location: [Location 3]
- Evening: Dine at [Restaurant 3] — Cuisine: [Cuisine 3] — Description: [Description 3]`,
    agentConfigId: "operator:itinerary_creator:1",
    agentConfigVersion: 1,
  },
  {
    agentType: "itinerary_creator",
    tools: ["itinerary_planner_api"] as const satisfies ToolName[],
    description:
      "Creates a customizable itinerary based on provided inputs such as activities, events, and dining suggestions using the itinerary_planner_api tool.",
    instructions: `Context: You are an agent specializing in creating itineraries. You are activated by an external task and receive inputs such as activities, events, and dining suggestions. You use the itinerary_planner_api to generate a detailed itinerary.

Objective: Create a customizable itinerary based on the provided inputs. Include day-by-day activities and details.

Response format: Present the itinerary day by day with activities and details:
Custom Itinerary:
Day 1:
- Morning:  [Activity 1] — Time: [Time 1] — Location: [Location 1] — Description: [Description 1]
- Afternoon: [Activity 2] — Time: [Time 2] — Location: [Location 2] — Description: [Description 2]
- Evening:  [Activity 3] — Time: [Time 3] — Location: [Location 3] — Description: [Description 3]
Day 2:
- Morning:  [Activity 4] — Time: [Time 4] — Location: [Location 4] — Description: [Description 4]
- Afternoon: [Activity 5] — Time: [Time 5] — Location: [Location 5] — Description: [Description 5]
- Evening:  [Activity 6] — Time: [Time 6] — Location: [Location 6] — Description: [Description 6]
...
Day N:
- Morning:  [Activity X] — Time: [Time X] — Location: [Location X] — Description: [Description X]
- Afternoon: [Activity Y] — Time: [Time Y] — Location: [Location Y] — Description: [Description Y]
- Evening:  [Activity Z] — Time: [Time Z] — Location: [Location Z] — Description: [Description Z]`,
    agentConfigId: "operator:generic_itinerary_creator:1",
    agentConfigVersion: 1,
  },
  {
    agentType: "phrase_generator",
    description: "Daily vocabulary exercise agent.",
    instructions:
      "Every weekday at 07:00 Prague time, generate a Spanish ‘word of the day’ " +
      "with part-of-speech, IPA pronunciation, an English translation and one " +
      "example sentence. Finish with a short multiple-choice quiz. Use the " +
      "phrase_generator tool only.",
    tools: ["phrase_generator"] as const satisfies ToolName[],
    agentConfigId: "operator:phrase_generator:1",
    agentConfigVersion: 1,
  },
] as const satisfies AgentConfigMinimal[];

export type AgentConfigType =
  (typeof AGENT_CONFIG_ENTRIES)[number]["agentType"];

const CONFIGS_MAP = new Map<AgentConfigType, AgentConfigMinimal>(
  AGENT_CONFIG_ENTRIES.map((c) => [c.agentType, c]),
);

export function agentConfigMinimalPrompt<Name extends AgentConfigType>(
  name: Name,
) {
  return clone(CONFIGS_MAP.get(name)!);
}

export function agentConfigPrompt<Name extends AgentConfigType>(
  name: Name,
  extra: Pick<AgentConfig, "agentKind" | "maxPoolSize" | "autoPopulatePool"> = {
    agentKind: "operator",
    maxPoolSize: 1,
    autoPopulatePool: false,
  },
) {
  const output = agentConfigMinimalPrompt(name);
  return {
    ...output,
    agentKind: extra.agentKind,
    maxPoolSize: extra.maxPoolSize,
    autoPopulatePool: extra.autoPopulatePool,
  } satisfies AgentConfig;
}
