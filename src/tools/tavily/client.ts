import { tavily, TavilyClient } from "@tavily/core";
import { getEnv } from "beeai-framework/internals/env";

let client: TavilyClient | null = null;

export function getClient() {
  if (client) {
    return client;
  }

  const apiKey = getEnv("TAVILY_API_KEY");
  if (apiKey == null || !apiKey.length) {
    throw new Error(`Missing 'TAVILY_API_KEY'`);
  }

  client = tavily({ apiKey });
  return client;
}
