import { createGroq } from "@ai-sdk/groq";
import { createOpenAI } from "@ai-sdk/openai";
import { extractReasoningMiddleware, wrapLanguageModel } from "ai";
import dotenv from "dotenv";
dotenv.config();

type ModelConfig = {
  provider: "openai" | "google" | "groq";
  model: string | string[];
  apiKey: string | undefined;
  baseURL: string;
};

// Centralized model configuration
const modelConfigs: Record<string, ModelConfig> = {
  groq: {
    provider: "groq",
    model: [
      "meta-llama/llama-4-maverick-17b-128e-instruct",
      "meta-llama/llama-4-scout-17b-16e-instruct",
    ],
    apiKey: process.env.GROQ_API_KEY,
    baseURL: "https://api.groq.com/openai/v1",
  },
  chutes: {
    provider: "openai",
    model: ["deepseek-ai/DeepSeek-V3-0324", "deepseek-ai/DeepSeek-R1"],
    apiKey: process.env.CHUTES_API_KEY,
    baseURL: "https://llm.chutes.ai/v1",
  },
  novita: {
    provider: "openai",
    model: ["deepseek/deepseek-r1-turbo", "deepseek/deepseek-v3-0324"],
    apiKey: process.env.NOVITA_API_KEY,
    baseURL: "https://api.novita.ai/v3/openai",
  },
};

export type ModelConfigKey = keyof typeof modelConfigs;

/**
 * Retrieves a model instance by config name and optional variant index.
 */
export function getModel(key: ModelConfigKey, variantIndex = 0) {
  const config = modelConfigs[key];
  const factory = getInstance(config);
  const modelName = Array.isArray(config.model)
    ? config.model[variantIndex]
    : (config.model as string);
  return factory(modelName);
}

function getInstance(config: ModelConfig) {
  switch (config.provider) {
    case "openai":
      return createOpenAI({
        baseURL: config.baseURL,
        apiKey: config.apiKey,
      });
    case "groq":
      return createGroq({
        baseURL: config.baseURL,
        apiKey: config.apiKey,
      });
    default:
      throw new Error("Invalid provider");
  }
}

// Refactored exports using generic getModel
export const selectorModel = getModel("groq", 1);
export const coderModel = getModel("chutes");
export const reasoningModel = wrapLanguageModel({
  model: getModel("novita", 0),
  middleware: extractReasoningMiddleware({ tagName: "think" }),
});
