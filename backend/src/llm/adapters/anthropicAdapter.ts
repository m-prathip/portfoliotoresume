import { LlmAdapter, LlmCompletionOptions, LlmError } from "../types";

/**
 * Anthropic Claude adapter. Requires ANTHROPIC_API_KEY.
 * Uses the Messages API directly via fetch to avoid an SDK dependency here —
 * swap for @anthropic-ai/sdk if you'd rather have typed request/response.
 */
export class AnthropicAdapter implements LlmAdapter {
  readonly name = "anthropic";
  private apiKey: string;
  private model: string;

  constructor(apiKey = process.env.ANTHROPIC_API_KEY, model = process.env.LLM_MODEL || "claude-sonnet-4-6") {
    if (!apiKey) {
      throw new LlmError("ANTHROPIC_API_KEY is not set", "anthropic");
    }
    this.apiKey = apiKey;
    this.model = model;
  }

  async complete(options: LlmCompletionOptions): Promise<string> {
    const systemMessages = options.messages.filter((m) => m.role === "system").map((m) => m.content);
    const userMessages = options.messages.filter((m) => m.role === "user");

    try {
      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "x-api-key": this.apiKey,
          "anthropic-version": "2023-06-01",
        },
        body: JSON.stringify({
          model: this.model,
          max_tokens: options.maxTokens ?? 2000,
          temperature: options.temperature ?? 0,
          system: systemMessages.join("\n\n") || undefined,
          messages: userMessages.map((m) => ({ role: "user", content: m.content })),
        }),
      });

      if (!res.ok) {
        const body = await res.text();
        throw new LlmError(`Anthropic API error ${res.status}: ${body}`, "anthropic");
      }

      const data = (await res.json()) as { content: Array<{ type: string; text?: string }> };
      const text = data.content
        .filter((block) => block.type === "text")
        .map((block) => block.text ?? "")
        .join("");

      if (!text) {
        throw new LlmError("Anthropic response contained no text content", "anthropic");
      }

      return text;
    } catch (err) {
      if (err instanceof LlmError) throw err;
      throw new LlmError("Failed to call Anthropic API", "anthropic", err);
    }
  }
}
