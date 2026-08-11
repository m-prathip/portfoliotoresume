// Provider-agnostic LLM interface. AI structuring and Truth Guard code
// against this interface only — never against a specific vendor SDK —
// so swapping providers is a one-file change (see adapters/*.ts).

export interface LlmMessage {
  role: "system" | "user";
  content: string;
}

export interface LlmCompletionOptions {
  messages: LlmMessage[];
  maxTokens?: number;
  temperature?: number;
  /** If set, the adapter should do its best to force valid-JSON-only output. */
  jsonMode?: boolean;
}

export interface LlmAdapter {
  /** Provider name, for logging/debugging. */
  readonly name: string;
  complete(options: LlmCompletionOptions): Promise<string>;
}

export class LlmError extends Error {
  constructor(
    message: string,
    public readonly provider: string,
    public readonly cause?: unknown,
  ) {
    super(message);
  }
}
