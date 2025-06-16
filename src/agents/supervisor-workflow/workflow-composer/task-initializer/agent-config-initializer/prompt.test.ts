import { describe, expect, it } from "vitest";
import { prompt } from "./prompt.js";
import { resolve } from "path";
import { readFileSync } from "fs";

describe(`Prompt`, () => {
  it(`Sample`, () => {
    const p = prompt({
      previousSteps: [
        {
          step: "Identify historical sites in Back Bay",
          inputOutput: "input: location; output: list of sites",
          resource: { type: "agent", agentType: "historical_sites_identifier" },
        },
        {
          step: "Find upcoming hockey/basketball game schedules in Boston",
          inputOutput: "input: sport, location; output: game list",
          resource: { type: "agent", agentType: "game_searcher" },
        },
        {
          step: "Recommend Italian, Chinese, and French restaurants in Back Bay for each day",
          inputOutput: "input: dining preferences, location; output: restaurant list",
          resource: { type: "agent", agentType: "restaurant_recommender" },
        },
      ],
      existingAgentConfigs: [
        {
          agentType: "news_headlines_24h",
          description: "Gathers news headlines related from the past 24 hours.",
          instructions: `You are an agent specializing in collecting news headlines on chosen topic. You have access to a news_search tool that allows you to find articles based on keywords and time filters. Users will provide a time frame and one or more search terms for the news they want collected.

Objective: Collect news headlines that contain the user-supplied keywords within the requested time window (default: past 24 hours). Use the news_search tool to execute the query, filtering results to match the specified period. Provide a list of headline URLs together with concise summaries.

Response format: Begin with a brief sentence that restates the search terms and time frame. Then list each headline on its own line, showing the URL first and a short summary after an em-dash or colon. For example:

News headlines matching “<keywords>” from the past 24 hours:  
1. URL: [headline_url_1] — Summary: [headline_summary_1]  
2. URL: [headline_url_2] — Summary: [headline_summary_2]`,
          tools: ["news_search"],
          agentConfigId: "operator:news_headlines_24h:1",
          agentConfigVersion: 1,
        },
      ],
      availableTools: [
        {
          toolName: "arxiv_search",
          description:
            "Search arXiv preprints by keyword, subject area, and date; returns title, authors, abstract, and PDF link.",
        },
        {
          toolName: "city_events_search",
          description:
            "Query municipal event listings with filters for date, venue, and category; returns structured JSON.",
        },
        {
          toolName: "news_search",
          description:
            "Query a curated index of newspapers, magazines, and wire-services for articles that match a keyword or topic. Supports source and date filters, returning structured results with headline, outlet, publication date, snippet, and article URL.",
        },
      ],
    });

    expect(p).toEqual(readFileSync(resolve(__dirname, "prompt.txt"), "utf-8"));
  });
});
