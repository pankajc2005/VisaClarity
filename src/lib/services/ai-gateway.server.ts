/**
 * Portable AI gateway seam.
 *
 * Today: routes through Lovable AI Gateway (OpenAI-compatible endpoint at
 * https://ai.gateway.lovable.dev/v1/chat/completions) using LOVABLE_API_KEY.
 *
 * On migration to another host, override via env vars — no code change:
 *   AI_GATEWAY_URL     full chat/completions URL (OpenAI-compatible)
 *   AI_GATEWAY_API_KEY bearer token for that endpoint
 *
 * Drop-in compatible providers:
 *   - OpenRouter        https://openrouter.ai/api/v1/chat/completions
 *   - Together AI       https://api.together.xyz/v1/chat/completions
 *   - Groq              https://api.groq.com/openai/v1/chat/completions
 *   - OpenAI / Azure    standard endpoints
 *
 * For Google Gemini directly (non-OpenAI shape), replace the body of
 * `chatCompletion` with a `@google/generative-ai` call — call sites do not change.
 */

import process from "node:process";

const DEFAULT_URL = "https://ai.gateway.lovable.dev/v1/chat/completions";

type Message = { role: "system" | "user" | "assistant"; content: string };

export type ChatCompletionInput = {
  model: string;
  messages: Message[];
  temperature?: number;
  max_tokens?: number;
  response_format?: unknown;
};

export type ChatCompletionResponse = {
  choices?: Array<{ message?: { content?: string } }>;
};

/**
 * One call site for every chat-completions request in the app. Throws on
 * non-2xx with a normalized error message (rate-limit / credits / generic).
 */
export async function chatCompletion(input: ChatCompletionInput): Promise<ChatCompletionResponse> {
  const url = process.env.AI_GATEWAY_URL ?? DEFAULT_URL;
  const apiKey = process.env.AI_GATEWAY_API_KEY ?? process.env.LOVABLE_API_KEY;
  if (!apiKey) {
    throw new Error("AI gateway key missing (set AI_GATEWAY_API_KEY or LOVABLE_API_KEY)");
  }

  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify(input),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    if (res.status === 429) {
      throw new Error("Rate limit reached. Please try again in a moment.");
    }
    if (res.status === 402) {
      throw new Error("AI credits exhausted. Please add credits to continue.");
    }
    throw new Error(`AI gateway error (${res.status}): ${text.slice(0, 200)}`);
  }

  return (await res.json()) as ChatCompletionResponse;
}
