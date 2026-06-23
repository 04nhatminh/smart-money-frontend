// utils/parseAIJson.ts

export function parseAIJson<T = any>(input: unknown): T | null {
  try {
    if (!input) return null;

    // Nếu BE đã trả object
    if (typeof input === "object") {
      return input as T;
    }

    let text = String(input).trim();

    // Remove ```json
    text = text.replace(/^```json\s*/i, "");

    // Remove ```
    text = text.replace(/^```\s*/i, "");
    text = text.replace(/\s*```$/i, "");

    // Trim lại
    text = text.trim();

    return JSON.parse(text) as T;
  } catch (err) {
    console.error("❌ parseAIJson failed:", err);
    console.log("Raw input:", input);
    return null;
  }
}