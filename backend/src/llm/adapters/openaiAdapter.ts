import { LlmAdapter, LlmCompletionOptions, LlmError } from "../types";

/**
 * OpenAI adapter. Requires OPENAI_API_KEY. Uses the Chat Completions API
 * directly via fetch, matching the AnthropicAdapter's dependency-free style.
 */
export class OpenAiAdapter implements LlmAdapter {
  readonly name = "openai";
  private apiKey: string;
  private model: string;

  constructor(apiKey = process.env.OPENAI_API_KEY, model = process.env.LLM_MODEL || "gpt-4o") {
    if (!apiKey) {
      throw new LlmError("OPENAI_API_KEY is not set", "openai");
    }
    this.apiKey = apiKey;
    this.model = model;
  }

  async complete(options: LlmCompletionOptions): Promise<string> {
    try {
      const res = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          authorization: `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({
          model: this.model,
          max_tokens: options.maxTokens ?? 2000,
          temperature: options.temperature ?? 0,
          response_format: options.jsonMode ? { type: "json_object" } : undefined,
          messages: options.messages.map((m) => ({ role: m.role, content: m.content })),
        }),
      });

      if (!res.ok) {
        const body = await res.text();
        throw new LlmError(`OpenAI API error ${res.status}: ${body}`, "openai");
      }

      const data = (await res.json()) as { choices: Array<{ message?: { content?: string } }> };
      const text = data.choices?.[0]?.message?.content;

      if (!text) {
        throw new LlmError("OpenAI response contained no message content", "openai");
      }

      return text;
    } catch (err) {
      if (err instanceof LlmError) throw err;
      throw new LlmError("Failed to call OpenAI API", "openai", err);
    }
  }
}
