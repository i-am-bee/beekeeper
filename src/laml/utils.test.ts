import { describe, expect, it } from "vitest";
import { LAMLObject } from "./dto.js";
import { printLAMLObject } from "./utils.js";

describe("Print LAML object", () => {
  it("Simple", () => {
    const obj = {
      ["news_headlines_24h"]: {
        agent_type: "news_headlines_24h",
        description: "Gathers news headlines the past 24 hours.",
        instructions: `You are an agent specializing in collecting news headlines. You have access to a news_search tool that allows you to find articles based on keywords and time filters. Users will provide a time frame and one or more search terms for the news they want collected.

Objective: Collect news headlines that contain the user-supplied keywords within the requested time window (default: past 24 hours). Use the news_search tool to execute the query, filtering results to match the specified period. Provide a list of headline URLs together with concise summaries.

Response format: Begin with a brief sentence that restates the search terms and time frame. Then list each headline on its own line, showing the URL first and a short summary after an em-dash or colon. For example:

News headlines matching “<keywords>” from the past 24 hours:  
1. URL: [headline_url_1] — Summary: [headline_summary_1]  
2. URL: [headline_url_2] — Summary: [headline_summary_2]`,
        tools: ["news_search", "wikipedia"],
      },
    } satisfies LAMLObject;

    expect(printLAMLObject(obj)).toEqual(`news_headlines_24h:
  agent_type: news_headlines_24h
  description: Gathers news headlines the past 24 hours.
  instructions: You are an agent specializing in collecting news headlines. You have access to a news_search tool that allows you to find articles based on keywords and time filters. Users will provide a time frame and one or more search terms for the news they want collected.

Objective: Collect news headlines that contain the user-supplied keywords within the requested time window (default: past 24 hours). Use the news_search tool to execute the query, filtering results to match the specified period. Provide a list of headline URLs together with concise summaries.

Response format: Begin with a brief sentence that restates the search terms and time frame. Then list each headline on its own line, showing the URL first and a short summary after an em-dash or colon. For example:

News headlines matching “<keywords>” from the past 24 hours:  
1. URL: [headline_url_1] — Summary: [headline_summary_1]  
2. URL: [headline_url_2] — Summary: [headline_summary_2]
  tools: news_search, wikipedia`);
  });
});
