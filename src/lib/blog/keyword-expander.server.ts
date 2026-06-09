import { blogChatCompletion } from "./llm-chain.server.ts";
import EXPANDER_SYSTEM from "../../../prompts/keyword-expander.md?raw";

export interface ExpandedKeyword {
  topic: string;
  primary_keyword: string;
  secondary_keywords: string[];
  audience: string;
  angle: string;
  search_queries: string[];
}

/**
 * Expands a raw keyword into a full structured blog brief.
 * Uses OpenRouter and falls back to a basic brief if anything fails.
 */
export async function expandKeyword(
  keyword: string,
  _keys?: any,
  opts?: { audience?: string; angle?: string },
): Promise<ExpandedKeyword> {
  const userContent = `
Keyword: "${keyword}"
${opts?.audience ? `Requested Audience: ${opts.audience}` : ""}
${opts?.angle ? `Requested Angle: ${opts.angle}` : ""}
`;

  try {
    const res = await blogChatCompletion({
      purpose: "expand",
      temperature: 0.7,
      max_tokens: 300,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: EXPANDER_SYSTEM },
        { role: "user", content: userContent.trim() },
      ],
    });

    const parsed = JSON.parse(res.content);

    return {
      topic: parsed.topic || `Complete Guide to ${keyword}`,
      primary_keyword: keyword,
      secondary_keywords: Array.isArray(parsed.secondary_keywords) ? parsed.secondary_keywords : [],
      audience: parsed.audience || "General audience",
      angle: parsed.angle || "Comprehensive overview",
      search_queries:
        Array.isArray(parsed.search_queries) && parsed.search_queries.length > 0
          ? parsed.search_queries
          : [keyword],
    };
  } catch (error) {
    console.error("Keyword expansion failed, using fallback:", error);
    // Fallback if LLM fails
    return {
      topic: `Complete Guide to ${keyword}`,
      primary_keyword: keyword,
      secondary_keywords: [],
      audience: opts?.audience || "General audience",
      angle: opts?.angle || "Comprehensive overview",
      search_queries: [keyword],
    };
  }
}

export default { expandKeyword };
