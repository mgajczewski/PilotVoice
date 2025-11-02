/**
 * Service for anonymizing user feedback using OpenRouter AI.
 * This ensures GDPR compliance by removing personal information from feedback.
 */

/**
 * Custom error class for anonymization failures
 */
export class AnonymizationError extends Error {
  constructor(message: string) {
    super(`Failed to anonymize feedback: ${message}`);
    this.name = "AnonymizationError";
  }
}

/**
 * Anonymizes user feedback by removing personal information while preserving meaning and tone.
 * Uses OpenRouter API with Claude 3.5 Sonnet model.
 *
 * @param text - The feedback text to anonymize
 * @returns The anonymized text
 * @throws {AnonymizationError} If the API call fails or times out
 */
export const anonymizeFeedback = async (text: string): Promise<string> => {
  // Guard clause: handle empty or null text
  if (!text || text.trim().length === 0) {
    return text;
  }

  // Guard clause: check for API key
  const apiKey = import.meta.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    throw new AnonymizationError("OPENROUTER_API_KEY is not configured");
  }

  const model = import.meta.env.OPENROUTER_MODEL || "anthropic/claude-3.5-sonnet";

  const systemPrompt = `You are an anonymization assistant. Your task is to anonymize user feedback while preserving the meaning and tone.

Rules:
- Remove or replace all personal names with generic terms (e.g., "the pilot", "the organizer", "a participant")
- Preserve the sentiment and key points of the feedback
- Keep the same language as the input
- Return only the anonymized text, no additional commentary
- Do not add any explanations or meta-commentary about the anonymization process`;

  const userPrompt = `Feedback to anonymize:\n${text}`;

  try {
    // Create abort controller for timeout (10 seconds)
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);

    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        "HTTP-Referer": import.meta.env.SITE || "https://pilotvoice.app",
        "X-Title": "PilotVoice",
      },
      body: JSON.stringify({
        model,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
      }),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      const errorText = await response.text().catch(() => "Unknown error");
      throw new AnonymizationError(`OpenRouter API returned status ${response.status}: ${errorText}`);
    }

    const data = await response.json();

    // Validate response structure
    if (!data.choices || !data.choices[0] || !data.choices[0].message) {
      throw new AnonymizationError("Invalid response structure from OpenRouter API");
    }

    const anonymizedText = data.choices[0].message.content;

    // Validate we got a non-empty response
    if (!anonymizedText || anonymizedText.trim().length === 0) {
      throw new AnonymizationError("OpenRouter API returned empty response");
    }

    return anonymizedText.trim();
  } catch (error) {
    // Handle abort (timeout)
    if (error instanceof Error && error.name === "AbortError") {
      throw new AnonymizationError("Request timed out after 10 seconds");
    }

    // Re-throw AnonymizationError as-is
    if (error instanceof AnonymizationError) {
      throw error;
    }

    // Handle other errors
    console.error("Anonymization error:", error);
    throw new AnonymizationError(error instanceof Error ? error.message : "Unknown error occurred");
  }
};

export const AnonymizationService = {
  anonymizeFeedback,
};
