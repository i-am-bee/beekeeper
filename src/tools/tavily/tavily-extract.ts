import { JSONToolOutput, Tool, ToolEmitter, ToolInput } from "beeai-framework";
import { Emitter } from "beeai-framework/emitter/emitter";
import { z } from "zod";
import { getClient } from "./client.js";

export type TavilyExtractToolOutput = {
  url: string;
  rawContent: string;
}[];

export class TavilyExtractTool extends Tool<
  JSONToolOutput<TavilyExtractToolOutput>
> {
  name = "TavilyExtract";
  description =
    "Extract web page content from one or more specified URLs using Tavily Extract. Use it when you need to get details of some pages";

  static {
    this.register();
  }

  public readonly emitter: ToolEmitter<
    ToolInput<this>,
    JSONToolOutput<TavilyExtractToolOutput>
  > = Emitter.root.child({
    namespace: ["tool", "tavilySearch"],
    creator: this,
  });

  inputSchema() {
    return z.object({
      urls: z.array(z.string({ description: `Page url` })),
    });
  }

  protected async _run(input: ToolInput<this>) {
    const client = getClient();
    const { results } = await client.extract(input.urls, {
      extractDepth: "basic",
      includeImages: false,
    });
    return new JSONToolOutput(results);
  }
}
