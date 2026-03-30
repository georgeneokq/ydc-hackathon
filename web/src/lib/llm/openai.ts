/**
 * OpenAI LLM Utility with Web Search Tool
 * 
 * Provides OpenAI chat completion with the ability to perform web searches
 * for grounding responses in real-time data.
 */

import { serperSearch, formatSearchResultsForLLM } from './serper';
import { extractJson } from './extract';

export interface OpenAIConfig {
  apiKey?: string;
  baseUrl?: string;
  model?: string;
}

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface OpenAIResponse {
  text: string;
  usedSearch?: boolean;
  searchResults?: string;
}

/**
 * Default system prompt template that includes grounding instructions.
 * This ensures the LLM knows when and how to use web search for grounding.
 */
export const DEFAULT_SYSTEM_PROMPT = `You are a helpful AI assistant with access to web search capabilities.

When answering questions:
1. If the question requires current, real-time, or factual information that may have changed recently, use the web search tool to find accurate information.
2. For general knowledge, reasoning, or conversational questions, you can answer directly without searching.
3. Always base your answers on the search results when you use the search tool.
4. If search results are unavailable or inconclusive, acknowledge this limitation in your response.

Be concise, accurate, and cite sources when providing information from web searches.`;

/**
 * Creates a completion using OpenAI API with optional web search grounding.
 * 
 * @param messages - Array of chat messages
 * @param config - Optional configuration (apiKey, baseUrl, model)
 * @param options - Optional options (useSearch, systemPrompt)
 * @returns The response text from the LLM
 */
export async function createCompletion(
  messages: ChatMessage[],
  config?: OpenAIConfig,
  options?: {
    useSearch?: boolean;
    systemPrompt?: string;
    maxTokens?: number;
    temperature?: number;
  }
): Promise<OpenAIResponse> {
  const apiKey = config?.apiKey || process.env.OPENAI_API_KEY;
  const baseUrl = config?.baseUrl || process.env.OPENAI_API_BASE || 'https://api.openai.com/v1';
  const model = config?.model || process.env.OPENAI_MODEL || 'gpt-4o-mini';

  if (!apiKey) {
    throw new Error('OPENAI_API_KEY environment variable is not set');
  }

  const useSearch = options?.useSearch ?? true;
  const systemPrompt = options?.systemPrompt || DEFAULT_SYSTEM_PROMPT;
  const maxTokens = options?.maxTokens || 1024;
  const temperature = options?.temperature ?? 0.7;

  // Prepare messages with system prompt
  const allMessages: ChatMessage[] = [
    { role: 'system', content: systemPrompt },
    ...messages,
  ];

  try {
    // If search is enabled and this seems like a factual query, perform search first
    let searchResults: string | null = null;
    if (useSearch && messages.length > 0) {
      const lastUserMessage = messages[messages.length - 1];
      if (lastUserMessage?.role === 'user') {
        // Check if this looks like a factual/research query
        const needsSearch = await shouldPerformSearch(lastUserMessage.content);
        if (needsSearch) {
          try {
            const results = await serperSearch(lastUserMessage.content, 5);
            searchResults = formatSearchResultsForLLM(results);
          } catch (searchError) {
            console.warn('Web search failed, proceeding without search:', searchError);
          }
        }
      }
    }

    // If we have search results, add them to the context
    let finalMessages = allMessages;
    if (searchResults) {
      // Add search results as a system message before the user's question
      const searchContextMessage: ChatMessage = {
        role: 'system',
        content: `Here are relevant web search results to help answer the user's question:\n\n${searchResults}`,
      };
      // Insert before the last user message
      finalMessages = [
        ...allMessages.slice(0, -1),
        searchContextMessage,
        ...allMessages.slice(-1),
      ];
    }

    // Call OpenAI API
    const response = await fetch(`${baseUrl.replace(/\/$/, '')}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        messages: finalMessages.map((m) => ({
          role: m.role,
          content: m.content,
        })),
        max_tokens: maxTokens,
        temperature,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`OpenAI API error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    const text = data.choices?.[0]?.message?.content || '';

    return {
      text,
      usedSearch: !!searchResults,
      searchResults: searchResults || undefined,
    };
  } catch (error) {
    console.error('OpenAI completion error:', error);
    throw error;
  }
}

/**
 * Determines if a query likely needs web search for accurate grounding.
 * Uses a lightweight heuristic approach.
 */
async function shouldPerformSearch(query: string): Promise<boolean> {
  // Quick heuristics for when to search
  const searchTriggers = [
    /\b(current|latest|recent|new|today|now|202[4-9]|203[0-9])\b/i,
    /\b(price|cost|value|rate|exchange)\b/i,
    /\b(news|update|announcement|release)\b/i,
    /\b(stock|market|crypto|cryptocurrency|bitcoin|ethereum)\b/i,
    /\b(who|what|when|where|why|how)\b/i,
    /\b(explain|analyze|compare|forecast|prediction|trend)\b/i,
    /\b[A-Z]{2,}\b/, // Ticker symbols (2+ uppercase letters)
    /[0-9]+%/, // Percentages
    /\$[0-9]+/, // Dollar amounts
  ];

  // If any trigger matches, search is likely needed
  return searchTriggers.some((regex) => regex.test(query));
}

/**
 * Creates a simple completion without search (direct LLM call).
 * Useful for tasks that don't need web grounding.
 */
export async function createSimpleCompletion(
  messages: ChatMessage[],
  config?: OpenAIConfig,
  options?: {
    systemPrompt?: string;
    maxTokens?: number;
    temperature?: number;
  }
): Promise<string> {
  const result = await createCompletion(messages, config, {
    ...options,
    useSearch: false,
  });
  return result.text;
}

/**
 * Performs a search-grounded completion, forcing web search before answering.
 * This mimics the You.com Express Agent behavior.
 */
export async function createGroundedCompletion(
  query: string,
  config?: OpenAIConfig,
  options?: {
    systemPrompt?: string;
    numResults?: number;
    maxTokens?: number;
  }
): Promise<OpenAIResponse> {
  const apiKey = config?.apiKey || process.env.OPENAI_API_KEY;
  const baseUrl = config?.baseUrl || process.env.OPENAI_API_BASE || 'https://api.openai.com/v1';
  const model = config?.model || 'gpt-4o-mini';

  if (!apiKey) {
    throw new Error('OPENAI_API_KEY environment variable is not set');
  }

  const numResults = options?.numResults ?? 5;
  const maxTokens = options?.maxTokens ?? 512;
  const systemPrompt = options?.systemPrompt || DEFAULT_SYSTEM_PROMPT;

  try {
    // Perform web search
    const results = await serperSearch(query, numResults);
    const searchResults = formatSearchResultsForLLM(results);

    // Create grounded answer prompt
    const messages: ChatMessage[] = [
      {
        role: 'user',
        content: `Based on the following search results, provide a clear and concise answer to the query.

Search Results:
${searchResults}

Query: ${query}

Answer:`,
      },
    ];

    const response = await fetch(`${baseUrl.replace(/\/$/, '')}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        messages: [
          { role: 'system', content: systemPrompt },
          ...messages.map((m) => ({ role: m.role, content: m.content })),
        ],
        max_tokens: maxTokens,
        temperature: 0.3, // Lower temperature for more factual responses
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`OpenAI API error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    const text = data.choices?.[0]?.message?.content || '';

    return {
      text,
      usedSearch: true,
      searchResults,
    };
  } catch (error) {
    console.error('Grounded completion error:', error);
    throw error;
  }
}
