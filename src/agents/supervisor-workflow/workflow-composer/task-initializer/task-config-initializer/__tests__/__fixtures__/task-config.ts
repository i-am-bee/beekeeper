import { clone } from "remeda";
import { ExistingTaskConfig } from "../../dto.js";
import { AgentConfigType } from "../../../agent-config-initializer/__tests__/__fixtures__/agent-configs.js";

export const TASK_CONFIG_ENTRIES = [
  {
    agentType: "arxiv_rl_daily" as const satisfies AgentConfigType,
    taskType: "summarise_rl_transformers_weekly",
    description:
      "Summarise last week's arXiv papers tagged cs.LG or cs.AI that mention ‘reinforcement learning’ and ‘transformer’.",
    taskConfigInput: JSON.stringify({
      tags: ["cs.LG", "cs.AI"],
      keywords: ["reinforcement learning", "transformer"],
      window: "7d",
    }),
  },
  {
    agentType: "news_headlines" as const satisfies AgentConfigType,
    taskType: "collect_ai_news_24h",
    description: "Collect AI‑related news headlines from the past 24 hours.",
    taskConfigInput: JSON.stringify({
      keywords: ["AI"],
      time_window: "24h",
    }),
  },
  {
    agentType: "phrase_generator" as const satisfies AgentConfigType,
    taskType: "spanish_word_of_day_quiz",
    description:
      "Generate a Spanish word‑of‑the‑day with IPA pronunciation, translation, an example sentence, and a 3‑question quiz.",
    taskConfigInput: JSON.stringify({
      language: "Spanish",
      quiz: true,
    }),
  },
  {
    agentType: "crypto_price_tracker_hourly" as const satisfies AgentConfigType,
    taskType: "btc_drop_alert_60k",
    description: "Alert when Bitcoin spot price drops below 60 000 USD.",
    taskConfigInput: JSON.stringify({
      symbol: "BTC",
      threshold: 60000,
      direction: "below",
    }),
  },
  {
    agentType: "city_events_weekend" as const satisfies AgentConfigType,
    taskType: "family_events_under_20",
    description:
      "Find family‑friendly outdoor events under €20 for the coming weekend and suggest an indoor alternative if rain is forecast.",
    taskConfigInput: JSON.stringify({
      budget_max_eur: 20,
      family_friendly: true,
      outdoor_only: true,
      fallback_if_rain: "indoor",
    }),
  },
  {
    agentType: "historical_sites_search" as const satisfies AgentConfigType,
    taskType: "kyoto_station_half_day_walk",
    description:
      "Plan a half‑day walking tour of historical sites within walking distance of Kyoto Station.",
    taskConfigInput: JSON.stringify({
      city: "Kyoto",
      radius_meters: 1500,
      duration_hours: 4,
      origin: "Kyoto Station",
    }),
  },
  {
    agentType: "flight_price_tracker_weekly" as const satisfies AgentConfigType,
    taskType: "prg_to_tokyo_digest",
    description:
      "Digest sub‑€650 fares PRG→NRT arriving before 18:00 local time and aggregate the cheapest three per airline.",
    taskConfigInput: JSON.stringify({
      origin: "PRG",
      destinations: ["NRT", "HND"],
      max_price_eur: 650,
      arrival_before_local: "18:00",
      airlines_top: 3,
    }),
  },
  {
    agentType: "historical_sites_search" satisfies AgentConfigType,
    taskType: "kyoto_hidden_sites",
    description:
      "Discover lesser-known historical sites in Kyoto that can be reached on foot from the main train station.",
    taskConfigInput: JSON.stringify({
      city: "Kyoto",
      near: "Kyoto Station",
      distance_km: 1,
      popularity: "underrated",
    }),
  },
] as const satisfies ExistingTaskConfig[];

export type TaskConfigType = (typeof TASK_CONFIG_ENTRIES)[number]["taskType"];

const CONFIGS_MAP = new Map<TaskConfigType, ExistingTaskConfig>(
  TASK_CONFIG_ENTRIES.map((c) => [c.taskType, c]),
);

export function taskConfig<Name extends TaskConfigType>(name: Name) {
  return clone(CONFIGS_MAP.get(name)!);
}
