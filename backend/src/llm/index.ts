import { LlmAdapter } from "./types";
import { AnthropicAdapter } from "./adapters/anthropicAdapter";
import { OpenAiAdapter } from "./adapters/openaiAdapter";

export * from "./types";

export type LlmProvider = "anthropic" | "openai";

/**
 * Single place that decides which LLM backs the platform.
 * Set LLM_PROVIDER=anthropic|openai in .env. Everything downstream
 * (aiStructuring.ts, truthGuard.ts) depends only on LlmAdapter.
 */
export function getLlmAdapter(provider: LlmProvider = (process.env.LLM_PROVIDER as LlmProvider) || "anthropic"): LlmAdapter {
  switch (provider) {
    case "openai":
      return new OpenAiAdapter();
    case "anthropic":
    default:
      return new AnthropicAdapter();
  }
}
