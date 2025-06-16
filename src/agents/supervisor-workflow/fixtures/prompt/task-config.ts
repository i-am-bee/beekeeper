import { clone } from "remeda";
import { TaskConfig } from "@/tasks/manager/dto.js";
import { TaskConfigMinimal } from "../../workflow-composer/task-initializer/task-config-initializer/dto.js";
import { AgentConfigType } from "./agent-config.js";

export const TASK_CONFIG_ENTRIES = [
  {
    taskType: "btc_drop_alert_60k",
    agentType: "crypto_price_tracker_hourly" as const satisfies AgentConfigType,
    description:
      "Alert when a specified cryptocurrency spot price crosses a given threshold.",
    taskConfigInput: JSON.stringify({
      symbol: "BTC",
      threshold: 60000,
      direction: "below",
    }),
  },
  {
    taskType: "collect_ai_news_24h",
    agentType: "news_headlines" as const satisfies AgentConfigType,
    description:
      "Collect news headlines related to specified keywords from a given time window.",
    taskConfigInput: JSON.stringify({
      keywords: ["AI"],
      time_window: "24h",
    }),
  },
  {
    taskType: "create_3_day_itinerary",
    agentType: "itinerary_creator",
    taskConfigInput: `{"historical_sites":"<list of historical sites>","games":"<list of games>","restaurants":"<list of restaurants>"}`,
    description:
      "Task to create a balanced 3-day itinerary incorporating historical sites, game schedules, and dining suggestions.",
  },
  {
    taskType: "family_events_under_20",
    agentType: "city_events_weekend" as const satisfies AgentConfigType,
    description:
      "Find family-friendly outdoor events under a specified budget for the coming weekend and suggest an indoor alternative if rain is forecast.",
    taskConfigInput: JSON.stringify({
      budget_max_eur: 20,
      family_friendly: true,
      outdoor_only: true,
      fallback_if_rain: "indoor",
    }),
  },
  {
    taskType: "find_sports_game_schedules",
    agentType: "game_scheduler",
    taskConfigInput: `{"sport":"<choose sport: hockey | basketball>","location":"Boston"}`,
    description:
      "Task to find upcoming hockey and basketball game schedules in Boston.",
  },
  {
    taskType: "identify_historical_sites",
    agentType: "historical_sites_identifier" as const satisfies AgentConfigType,
    taskConfigInput: `{"location":"<given location>"}`,
    description: "Task to identify historical sites in a given location.",
  },
  {
    taskType: "kyoto_hidden_sites",
    agentType: "historical_sites_identifier" as const satisfies AgentConfigType,
    description:
      "Discover lesser-known historical sites in a given city that can be reached on foot from a specified location.",
    taskConfigInput: JSON.stringify({
      city: "Kyoto",
      near: "Kyoto Station",
      distance_km: 1,
      popularity: "underrated",
    }),
  },
  {
    taskType: "kyoto_station_half_day_walk",
    agentType: "historical_sites_identifier" as const satisfies AgentConfigType,
    description:
      "Plan a half-day walking tour of historical sites within walking distance of a specified origin.",
    taskConfigInput: JSON.stringify({
      city: "Kyoto",
      radius_meters: 1500,
      duration_hours: 4,
      origin: "Kyoto Station",
    }),
  },
  {
    taskType: "prg_to_tokyo_digest",
    agentType: "flight_price_tracker_weekly" as const satisfies AgentConfigType,
    description:
      "Digest flight fares between specified origin and destinations under a given price and arrival time, aggregating the cheapest per airline.",
    taskConfigInput: JSON.stringify({
      origin: "PRG",
      destinations: ["NRT", "HND"],
      max_price_eur: 650,
      arrival_before_local: "18:00",
      airlines_top: 3,
    }),
  },
  {
    taskType: "recommend_restaurants",
    agentType: "restaurant_recommender",
    taskConfigInput: `{"diningPreferences":"<dining preferences like cuisine or dietary restrictions>","location":"<given location>"}`,
    description:
      "Task to recommend restaurants based on dinning preferences in the given location.",
  } satisfies TaskConfigMinimal,
  {
    taskType: "spanish_word_of_day_quiz",
    agentType: "phrase_generator" as const satisfies AgentConfigType,
    description:
      "Generate a word-of-the-day with pronunciation, translation, example sentence, and quiz for a given language.",
    taskConfigInput: JSON.stringify({
      language: "Spanish",
      quiz: true,
    }),
  },
  {
    taskType: "summarise_rl_transformers_weekly",
    agentType: "arxiv_rl_daily" as const satisfies AgentConfigType,
    description:
      "Summarise recent arXiv papers with specified tags and keywords over a given time window.",
    taskConfigInput: JSON.stringify({
      tags: ["cs.LG", "cs.AI"],
      keywords: ["reinforcement learning", "transformer"],
      window: "7d",
    }),
  },
  {
    taskType: "tornado_watch",
    agentType: "tornado_watcher" as const satisfies AgentConfigType,
    description:
      "Check for tornado alerts in a specified region and notify if any are issued.",
    taskConfigInput: JSON.stringify({
      region: "user_location",
    }),
  },
] as const satisfies TaskConfigMinimal[];

export type TaskConfigType = (typeof TASK_CONFIG_ENTRIES)[number]["taskType"];

const CONFIGS_MAP = new Map<TaskConfigType, TaskConfigMinimal>(
  TASK_CONFIG_ENTRIES.map((c) => [c.taskType, c]),
);

export function taskConfigMinimal<Name extends TaskConfigType>(name: Name) {
  return clone(CONFIGS_MAP.get(name)!);
}

export function taskConfig<Name extends TaskConfigType>(
  name: Name,
  extra?: Partial<
    Pick<
      TaskConfig,
      | "taskKind"
      | "taskConfigId"
      | "taskConfigVersion"
      | "intervalMs"
      | "runImmediately"
      | "ownerAgentId"
      | "agentKind"
      | "agentConfigVersion"
      | "concurrencyMode"
    >
  >,
) {
  const output = taskConfigMinimal(name);

  return {
    ...output,
    taskKind: extra?.taskKind ?? "operator",
    taskConfigId: extra?.taskConfigId ?? "",
    taskConfigVersion: 1,
    intervalMs: 0,
    runImmediately: extra?.runImmediately ?? false,
    ownerAgentId: extra?.ownerAgentId ?? "",
    agentKind: extra?.agentKind ?? "operator",
    agentConfigVersion: 1,
    concurrencyMode: "EXCLUSIVE",
  } satisfies TaskConfig;
}
