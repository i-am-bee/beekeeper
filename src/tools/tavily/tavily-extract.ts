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
  name = "tavily_page_extract";
  description =
    "A focused content-retrieval endpoint that fetches the full readable text (and, where available, metadata such as title, author, publish date, alt-text, and canonical URL) from one or more specific webpages you already know the addresses of; invoke it after a search—or whenever the user supplies or requests exact URLs—when you must quote, summarize, fact-check, extract tables/code/snippets, or reason over details that are not reliably captured in snippets alone, while skipping it if (a) the question can be answered from your own knowledge or search snippets, (b) the site is pay-walled, requires login, or hosts dynamic content that scraping would miss, or (c) the user forbids browsing; call it with a JSON object whose urls field is a list of absolute URLs (add optional max_chars, include_images, or selector keys if supported) and then parse the returned plain text or structured data, keeping network calls minimal by batching related URLs, respecting copyright, and citing any extracted material.";

  static {
    this.register();
  }

  public readonly emitter: ToolEmitter<
    ToolInput<this>,
    JSONToolOutput<TavilyExtractToolOutput>
  > = Emitter.root.child({
    namespace: ["tool", "tavily_page_extract"],
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
