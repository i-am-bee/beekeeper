import { AgentKindEnum } from "@/agents/registry/dto.js";
import { OpenAIChatModel } from "beeai-framework/adapters/openai/backend/chat";
import { OllamaChatModel } from "beeai-framework/adapters/ollama/backend/chat";
import { ChatModel } from "beeai-framework/backend/chat";
import { getEnv, parseEnv } from "beeai-framework/internals/env";
import { z } from "zod";

export const Providers = {
  IBM_RITS: "ibm_rits",
  OLLAMA: "ollama",
  OPENAI: "openai",
} as const;
type Provider = (typeof Providers)[keyof typeof Providers];

const env = (name: string, type: AgentKindEnum) =>
  `${name}_${type.toUpperCase()}`;

export const LLMFactories: Record<
  Provider,
  (type: AgentKindEnum) => ChatModel
> = {
  [Providers.IBM_RITS]: (type: AgentKindEnum) =>
    new OpenAIChatModel(
      getEnv(env("IBM_RITS_MODEL", type)) || "",
      {},
      {
        baseURL: getEnv(env("IBM_RITS_URL", type)),
        apiKey: getEnv("IBM_RITS_API_KEY"),
        headers: {
          RITS_API_KEY: getEnv("IBM_RITS_API_KEY") || "",
        },
      },
    ),
  [Providers.OPENAI]: (type: AgentKindEnum) =>
    new OpenAIChatModel(getEnv(env("OPENAI_MODEL", type)) || "gpt-4o"),
  [Providers.OLLAMA]: (type: AgentKindEnum) =>
    new OllamaChatModel(getEnv(env("OLLAMA_MODEL", type)) || "llama3.1:8b", {
      structuredOutputs: true,
    }),
};

export function getChatLLM(
  type: AgentKindEnum,
  provider?: Provider,
): ChatModel {
  if (!provider) {
    provider = parseEnv(
      "LLM_BACKEND",
      z.nativeEnum(Providers),
      Providers.OPENAI,
    );
  }

  const factory = LLMFactories[provider];
  if (!factory) {
    throw new Error(`Provider "${provider}" not found.`);
  }
  return factory(type);
}
