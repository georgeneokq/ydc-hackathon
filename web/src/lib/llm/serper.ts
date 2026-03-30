/**
 * Serper Search Utility
 * 
 * Provides web search functionality using the Serper API.
 * Can be used as a tool for LLMs to ground responses with real-time web data.
 */

export interface SerperSearchResult {
  title: string;
  link: string;
  snippet: string;
  position?: number;
}

export interface SerperSearchResponse {
  searchParameters: {
    q: string;
    type: string;
    engine: string;
  };
  organic: SerperSearchResult[];
}

/**
 * Performs a web search using the Serper API.
 * 
 * @param query - The search query string
 * @param numResults - Number of results to return (default: 5)
 * @returns Array of search results with title, link, and snippet
 */
export async function serperSearch(
  query: string,
  numResults: number = 5
): Promise<SerperSearchResult[]> {
  const apiKey = process.env.SERPER_API_KEY;
  
  if (!apiKey) {
    throw new Error('SERPER_API_KEY environment variable is not set');
  }

  try {
    const response = await fetch('https://google.serper.dev/search', {
      method: 'POST',
      headers: {
        'X-API-KEY': apiKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        q: query,
        num: numResults,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Serper API error: ${response.status} - ${errorText}`);
    }

    const data: SerperSearchResponse = await response.json();
    
    return data.organic.map((result, index) => ({
      title: result.title,
      link: result.link,
      snippet: result.snippet,
      position: result.position ?? index + 1,
    }));
  } catch (error) {
    console.error('Serper search error:', error);
    throw error;
  }
}

/**
 * Formats search results into a text string suitable for LLM context.
 * 
 * @param results - Array of search results
 * @returns Formatted string with search results
 */
export function formatSearchResultsForLLM(results: SerperSearchResult[]): string {
  if (results.length === 0) {
    return 'No relevant search results found.';
  }

  return results
    .map(
      (result, index) =>
        `[${index + 1}] ${result.title}\n    Source: ${result.link}\n    Summary: ${result.snippet}`
    )
    .join('\n\n');
}

/**
 * Creates a grounded answer based on search results.
 * This mimics the You.com Express Agent behavior of providing
 * search-grounded responses.
 * 
 * @param query - The original query
 * @param results - Search results to base the answer on
 * @returns A concise answer grounded in the search results
 */
export function createGroundedAnswer(
  query: string,
  results: SerperSearchResult[]
): string {
  if (results.length === 0) {
    return `I couldn't find relevant information about "${query}" from web search results.`;
  }

  // Combine snippets to form a coherent answer
  const relevantInfo = results
    .slice(0, 3)
    .map((r) => r.snippet)
    .join(' ');

  return `${relevantInfo}\n\nSources:\n${results
    .slice(0, 3)
    .map((r) => `- ${r.title}: ${r.link}`)
    .join('\n')}`;
}
