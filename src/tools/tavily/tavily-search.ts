import { Tool, ToolEmitter, ToolInput } from "beeai-framework";
import { Emitter } from "beeai-framework/emitter/emitter";
import {
  SearchToolOutput,
  SearchToolResult,
} from "beeai-framework/tools/search/base";
import { z } from "zod";
import { getClient } from "./client.js";

export interface TavilySearchToolResult extends SearchToolResult {}

export class TavilySearchToolOutput extends SearchToolOutput<TavilySearchToolResult> {
  constructor(public readonly results: TavilySearchToolResult[]) {
    super(results);
  }

  static {
    this.register();
  }

  createSnapshot() {
    return {
      results: this.results,
    };
  }

  loadSnapshot(snapshot: ReturnType<typeof this.createSnapshot>) {
    Object.assign(this, snapshot);
  }
}

export class TavilySearchTool extends Tool<TavilySearchToolOutput> {
  name = "web_search";
  description =
    "A versatile web-search endpoint that lets the model issue live internet queries to obtain up-to-date facts, breaking news, niche or location-specific information, images, prices, weather, sports data, and other content that may lie outside its training data; use it whenever (a) the user explicitly asks for the “latest,” “current,” or “live” details, (b) the topic is time-sensitive (politics, markets, scientific developments, schedules, local recommendations, etc.), (c) accuracy is critical and stale knowledge could mislead, or (d) the user’s request cannot be fully answered from internal knowledge—while avoiding it if the user forbids browsing, if the answer is static and well-known (e.g., basic math), or if frequent calls would add no value; supply a JSON object with at minimum the string field q (the search text), and optionally recency (days to restrict freshness) and domains (array of preferred sources), then interpret the ranked results, cite them, and prefer a single, comprehensive search call over many piecemeal ones.";

  static {
    this.register();
  }

  public readonly emitter: ToolEmitter<
    ToolInput<this>,
    TavilySearchToolOutput
  > = Emitter.root.child({
    namespace: ["tool", "web_search"],
    creator: this,
  });

  inputSchema() {
    return z.object({
      query: z.string({ description: `Search query` }),
    });
  }

  protected async _run(input: ToolInput<this>) {
    const client = getClient();
    const { results } = await client.search(input.query, {
      includeImageDescriptions: false,
      includeImages: false,
      includeRawContent: false,
      includeAnswer: false,
      maxResults: 10,
    });
    return new TavilySearchToolOutput(
      results.map((result) => ({
        title: result.title,
        description: result.content,
        url: result.url,
      })),
    );
  }
}
