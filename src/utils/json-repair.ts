export function extractAndParseJSON(rawText: string): any {
  try {
    return JSON.parse(rawText);
  } catch (_err) {
    // 1. Try to find JSON inside Markdown backticks
    const match = rawText.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
    if (match && match[1]) {
      try {
        return JSON.parse(match[1]);
      } catch (_e) {
        // Fall through to next method
      }
    }

    // 2. Try to extract from first { to last }
    const firstBrace = rawText.indexOf("{");
    const lastBrace = rawText.lastIndexOf("}");
    if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
      try {
        return JSON.parse(rawText.substring(firstBrace, lastBrace + 1));
      } catch (_e) {
        // Fall through
      }
    }

    throw new Error("Failed to extract and parse JSON from raw text.");
  }
}
