import { LlmAdapter, LlmCompletionOptions, LlmError } from "../types";

export class GeminiAdapter implements LlmAdapter {
  readonly name = "gemini";
  private apiKey: string;
  private model: string;

  constructor(apiKey = process.env.GEMINI_API_KEY, model = process.env.LLM_MODEL || "gemini-1.5-flash") {
    if (!apiKey) {
      throw new LlmError("GEMINI_API_KEY is not set", "gemini");
    }
    this.apiKey = apiKey;
    // Strip 'models/' prefix if the user accidentally included it in their environment variable
    this.model = model.replace(/^models\//, "");
  }

  async complete(options: LlmCompletionOptions): Promise<string> {
    const systemMessages = options.messages.filter((m) => m.role === "system").map((m) => m.content).join("\n\n");
    const userMessages = options.messages.filter((m) => m.role === "user");

    const contents = userMessages.map((m) => ({
      role: "user",
      parts: [{ text: m.content }]
    }));

    const body: any = {
      contents,
      generationConfig: {
        temperature: options.temperature ?? 0,
        maxOutputTokens: options.maxTokens ?? 8000,
      }
    };
    
    if (systemMessages) {
        body.systemInstruction = {
            parts: [{ text: systemMessages }]
        };
    }

    const fallbackModels = ["gemini-1.5-pro", "gemini-pro"];
    let currentModel = this.model;
    let attempt = 0;

    while (true) {
      try {
        // Use v1 API instead of v1beta, and ensure the model string is correct
        const res = await fetch(`https://generativelanguage.googleapis.com/v1/models/${currentModel}:generateContent?key=${this.apiKey}`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(body),
        });

        if (!res.ok) {
          const errBody = await res.text();
          // If the model is not found (404), try the next fallback model
          if (res.status === 404 && errBody.includes("is not found") && attempt < fallbackModels.length) {
            console.warn(`Model ${currentModel} not found. Falling back to ${fallbackModels[attempt]}...`);
            currentModel = fallbackModels[attempt];
            attempt++;
            continue;
          }
          throw new LlmError(`Gemini API error ${res.status}: ${errBody}`, "gemini");
        }

        const data = await res.json();
        
        const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
        if (!text) {
          throw new LlmError("Gemini response contained no text content", "gemini");
        }

        return text;
      } catch (err) {
        if (err instanceof LlmError) throw err;
        throw new LlmError(`Failed to call Gemini API using ${currentModel}`, "gemini", err);
      }
    }
  }
}
