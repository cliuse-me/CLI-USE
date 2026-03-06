import { keyManager } from "./key-manager";

export type ModelProvider = "openai" | "anthropic" | "google" | "groq" | "ollama";

export const AVAILABLE_MODELS = [
  {
    label: "Claude 3.7 Sonnet (Anthropic)",
    value: "claude-3-7-sonnet-20250219",
    provider: "anthropic",
    pkg: "@ai-sdk/anthropic",
  },
  { label: "GPT-4o (OpenAI)", value: "gpt-4o", provider: "openai", pkg: "@ai-sdk/openai" },
  {
    label: "Gemini 1.5 Pro (Google)",
    value: "gemini-1.5-pro-latest",
    provider: "google",
    pkg: "@ai-sdk/google",
  },
  { label: "Llama 3 70B (Groq)", value: "llama3-70b-8192", provider: "groq", pkg: "@ai-sdk/groq" },
  {
    label: "Local Llama 3 (Ollama)",
    value: "llama3",
    provider: "ollama",
    pkg: "ollama-ai-provider",
  },
] as const;

export interface ModelConfig {
  provider: ModelProvider;
  modelId: string;
  pkg: string;
}

export class ProviderMissingError extends Error {
  constructor(public pkgName: string) {
    super(`Missing package: ${pkgName}`);
    this.name = "ProviderMissingError";
  }
}

export async function getModel(config: ModelConfig): Promise<any> {
  try {
    switch (config.provider) {
      case "openai": {
        const { createOpenAI } = await import("@ai-sdk/openai");
        return createOpenAI({ apiKey: process.env.OPENAI_API_KEY })(config.modelId);
      }
      case "anthropic": {
        const { createAnthropic } = await import("@ai-sdk/anthropic");
        return createAnthropic({ apiKey: process.env.ANTHROPIC_API_KEY })(config.modelId);
      }
      case "google": {
        const { createGoogleGenerativeAI } = await import("@ai-sdk/google");
        const customKey = keyManager.getNextKey();
        const globalKey =
          process.env.GOOGLE_GENERATIVE_AI_API_KEY ||
          process.env.GEMINI_API_KEY ||
          process.env.GOOGLE_API_KEY ||
          "";

        const apiKey = customKey || globalKey;

        return apiKey
          ? createGoogleGenerativeAI({ apiKey })(config.modelId)
          : createGoogleGenerativeAI()(config.modelId);
      }
      case "groq": {
        const { createGroq } = await import("@ai-sdk/groq");
        return createGroq({ apiKey: process.env.GROQ_API_KEY })(config.modelId);
      }
      case "ollama": {
        const { createOllama } = await import("ollama-ai-provider");
        return createOllama({ baseURL: "http://127.0.0.1:11434/api" })(config.modelId);
      }
      default:
        throw new Error(`Unknown provider: ${config.provider}`);
    }
  } catch (error: any) {
    if (error.code === "ERR_MODULE_NOT_FOUND" || error.message.includes("Cannot find package")) {
      throw new ProviderMissingError(config.pkg);
    }
    throw error;
  }
}
