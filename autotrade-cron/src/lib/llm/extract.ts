/**
 * Extracts JSON from an LLM response string.
 * Handles cases where JSON may or may not be wrapped in ```json``` code blocks.
 *
 * @param response - The raw string response from an LLM.
 * @returns The parsed JSON object, or null if extraction fails.
 */
export function extractJson<T = unknown>(response: string): T | null {
  try {
    // Step 1: Trim whitespace
    let text = response.trim();

    // Step 2: Try to detect ```json ... ``` or ``` ... ``` code blocks
    const codeBlockMatch = text.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
    if (codeBlockMatch && codeBlockMatch[1]) {
      text = codeBlockMatch[1].trim();
    }

    // Step 3: Try to find the first { ... } JSON structure if no code block
    // (helpful when LLM adds explanations or text before/after)
    const jsonMatch = text.match(/\{[\s\S]*\}|\[[\s\S]*\]/);
    if (jsonMatch && jsonMatch[0]) {
      text = jsonMatch[0];
    }

    // Step 4: Parse and return JSON
    return JSON.parse(text);
  } catch {
    return null; // return null on failure
  }
}
