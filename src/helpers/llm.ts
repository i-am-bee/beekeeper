import { AgentKindEnum } from "@/agents/registry/dto.js";
import { OpenAIChatModel } from "beeai-framework/adapters/openai/backend/chat";
import { OllamaChatModel } from "beeai-framework/adapters/ollama/backend/chat";
import { WatsonxChatModel } from "beeai-framework/adapters/watsonx/backend/chat";
import { ChatModel } from "beeai-framework/backend/chat";
import { getEnv, hasEnv, parseEnv } from "beeai-framework/internals/env";
import { z } from "zod";

export const Providers = {
  IBM_RITS: "ibm_rits",
  OLLAMA: "ollama",
  OPENAI: "openai",
  WATSONX: "watsonx",
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
      numCtx: 131072,
    }),
  [Providers.WATSONX]: (type: AgentKindEnum) =>
    new WatsonxChatModel(
      getEnv(env("WATSONX_CHAT_MODEL", type)) || "llama3.1:8b",
    ),
};

export function getChatLLM(
  type: AgentKindEnum,
  provider?: Provider,
): ChatModel {
  if (!provider) {
    const commonProvider = hasEnv("LLM_BACKEND")
      ? parseEnv("LLM_BACKEND", z.nativeEnum(Providers))
      : null;

    const typeProvider = hasEnv(env("LLM_BACKEND", type))
      ? parseEnv(
          env("LLM_BACKEND", type),
          z.nativeEnum(Providers),
          Providers.OPENAI,
        )
      : null;

    if (typeProvider) {
      provider = typeProvider;
    } else if (commonProvider) {
      provider = commonProvider;
    } else {
      throw new Error(
        `One of env variables ('LLM_BACKEND' | '${env("LLM_BACKEND", type)}') has to be set`,
      );
    }
  }

  const factory = LLMFactories[provider];
  if (!factory) {
    throw new Error(`Provider "${provider}" not found.`);
  }

  const model = factory(type);
  model.config({
    parameters: {
      temperature: 0,
    },
  });
  return model;
}
