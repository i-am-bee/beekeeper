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
  name = "TavilySearch";
  description =
    "Powerful web search API. Execute a search query using Tavily Search.";

  static {
    this.register();
  }

  public readonly emitter: ToolEmitter<
    ToolInput<this>,
    TavilySearchToolOutput
  > = Emitter.root.child({
    namespace: ["tool", "tavilySearch"],
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
