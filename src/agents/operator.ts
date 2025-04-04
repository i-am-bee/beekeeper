import { ArXivTool } from "beeai-framework/tools/arxiv";
import { DuckDuckGoSearchTool } from "beeai-framework/tools/search/duckDuckGoSearch";
import { BaseToolsFactory, ToolFactoryMethod } from "@/base/tools-factory.js";
import { getEnv } from "beeai-framework/internals/env";
import { TavilySearchTool } from "@/tools/tavily/tavily-search.js";
import { TavilyExtractTool } from "@/tools/tavily/tavily-extract.js";

export class ToolsFactory extends BaseToolsFactory {
  async getFactoriesMethods(): Promise<ToolFactoryMethod[]> {
    return [...getWebSearchTools(), () => new ArXivTool()];
  }
}
type WebSearchToolName = "tavily" | "duckduckgo";

function getWebSearchTools() {
  const searchTool: WebSearchToolName =
    getEnv("SEARCH_TOOL") === "tavily" ? "tavily" : "duckduckgo";
  switch (searchTool) {
    case "tavily":
      return [() => new TavilySearchTool(), () => new TavilyExtractTool()];
    case "duckduckgo":
      return [() => new DuckDuckGoSearchTool()];
  }
}
