/* eslint-disable @typescript-eslint/no-unused-vars */
import { ArXivTool } from "beeai-framework/tools/arxiv";
import { DuckDuckGoSearchTool } from "beeai-framework/tools/search/duckDuckGoSearch";
import { BaseToolsFactory, ToolFactoryMethod } from "@/base/tools-factory.js";
import { getEnv } from "beeai-framework/internals/env";
import { TavilySearchTool } from "@/tools/tavily/tavily-search.js";
import { TavilyExtractTool } from "@/tools/tavily/tavily-extract.js";
import { ListSeasonsTool } from "@/tools/openf1/list-seasons.js";
import { GetSeasonDetailTool } from "@/tools/openf1/get-season-detail.js";
import { GetDriverTool } from "@/tools/openf1/get-driver.js";
import { GetCurrentSeasonDetailTool } from "@/tools/openf1/get-current-season-detail.js";
import { ListGrandPrixPositionsTool } from "@/tools/openf1/list-grandprix-positions.js";
import { GetGrandPrixDetailTool } from "@/tools/openf1/get-grand-prix-detail.js";

export class ToolsFactory extends BaseToolsFactory {
  async getFactoriesMethods(): Promise<ToolFactoryMethod[]> {
    return [
      // ...getWebSearchTools(),
      // () => new ArXivTool(),
      () => new ListSeasonsTool(),
      () => new ListGrandPrixPositionsTool(),
      () => new GetCurrentSeasonDetailTool(),
      () => new GetSeasonDetailTool(),
      () => new GetDriverTool(),
      () => new GetGrandPrixDetailTool(),
    ];
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
