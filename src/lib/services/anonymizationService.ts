/**
 * Service for anonymizing user feedback using OpenRouter AI.
 * This ensures GDPR compliance by removing personal information from feedback.
 * @server-only This service must only be used on the server-side
 */

import { OpenRouterService } from "./openrouter/openrouterService";
import type { JSONSchema } from "./openrouter/types";
import type { GdprCheckResult, IAnonymizationService } from "@/types";

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
 * Response schema for personal data detection
 */
interface PersonalDataDetectionResponse {
  containsPersonalData: boolean;
  confidence: number;
  detectedDataTypes: string[];
  explanation: string;
}

/**
 * Response schema for anonymization
 */
interface AnonymizationResponse {
  anonymizedText: string;
}

/**
 * Checks if text contains personal data and returns anonymized version if needed.
 * This method implements US-007 requirements.
 *
 * @param text - The feedback text to check
 * @returns GdprCheckResult with detection and anonymization details
 * @throws {AnonymizationError} If the API call fails
 */
export const checkAndAnonymize = async (text: string): Promise<GdprCheckResult> => {
  // Guard clause: handle empty or null text
  if (!text || text.trim().length === 0) {
    return {
      containsPersonalData: false,
      confidence: 1.0,
      originalText: text,
      anonymizedText: null,
    };
  }

  try {
    const openRouter = new OpenRouterService();
    const model = import.meta.env.OPENROUTER_MODEL || "anthropic/claude-3.5-sonnet";

    // Step 1: Detect if text contains personal data
    const detectionSchema: JSONSchema = {
      type: "object",
      properties: {
        containsPersonalData: {
          type: "boolean",
          description: "Whether the text contains personal data (names, emails, phone numbers, etc.)",
        },
        confidence: {
          type: "number",
          description: "Confidence level between 0 and 1",
        },
        detectedDataTypes: {
          type: "array",
          items: {
            type: "string",
          },
          description: "Types of personal data detected (e.g., 'full_name', 'email', 'phone')",
        },
        explanation: {
          type: "string",
          description: "Brief explanation of what personal data was detected",
        },
      },
      required: ["containsPersonalData", "confidence", "detectedDataTypes", "explanation"],
      additionalProperties: false,
    };

    const detectionSystemPrompt = `You are a GDPR compliance assistant. Your task is to detect personal data in user feedback.

Personal data includes:
- Full names or identifiable names (first name + last name, or unique nicknames)
- Email addresses
- Phone numbers
- Physical addresses
- Government IDs or passport numbers
- Any other information that could identify a specific person

Rules:
- Generic terms like "the pilot", "the organizer", "someone" are NOT personal data
- Single common first names without context may not be personal data
- Be conservative: when in doubt about identification, mark as potential personal data
- Provide confidence score based on how certain you are`;

    const detectionUserPrompt = `Analyze this text for personal data:\n\n${text}`;

    const detectionResult = await openRouter.getStructuredCompletion<PersonalDataDetectionResponse>({
      model,
      systemPrompt: detectionSystemPrompt,
      userPrompt: detectionUserPrompt,
      responseSchema: {
        name: "personal_data_detection",
        schema: detectionSchema,
      },
      temperature: 0.3,
      maxTokens: 200,
    });

    console.log("Detection result:", detectionResult);

    // Step 2: If personal data detected, anonymize the text
    let anonymizedText: string | null = null;

    if (detectionResult.containsPersonalData) {
      const anonymizationSchema: JSONSchema = {
        type: "object",
        properties: {
          anonymizedText: {
            type: "string",
            description: "The anonymized version of the input text",
          },
        },
        required: ["anonymizedText"],
        additionalProperties: false,
      };

      const anonymizationSystemPrompt = `You are an anonymization assistant. Your task is to anonymize user feedback while preserving the meaning and tone.

Rules:
- Remove or replace all personal names with generic terms (e.g., "the pilot", "the organizer", "a participant")
- Replace emails with generic descriptions (e.g., "the contact email")
- Replace phone numbers with generic descriptions (e.g., "the phone number")
- Preserve the sentiment and key points of the feedback
- Keep the same language as the input
- Maintain natural flow and readability
- Do not add any explanations or meta-commentary about the anonymization process`;

      const anonymizationUserPrompt = `Anonymize this feedback:\n\n${text}`;

      const anonymizationResult = await openRouter.getStructuredCompletion<AnonymizationResponse>({
        model,
        systemPrompt: anonymizationSystemPrompt,
        userPrompt: anonymizationUserPrompt,
        responseSchema: {
          name: "text_anonymization",
          schema: anonymizationSchema,
        },
        temperature: 0.5,
        maxTokens: 1000,
      });

      console.log("Anonymization result:", anonymizationResult);

      anonymizedText = anonymizationResult.anonymizedText.trim();

      // Validate we got a non-empty response
      if (!anonymizedText || anonymizedText.length === 0) {
        throw new AnonymizationError("OpenRouter API returned empty anonymized text");
      }
    }

    return {
      containsPersonalData: detectionResult.containsPersonalData,
      confidence: detectionResult.confidence,
      originalText: text,
      anonymizedText,
      detectedDataTypes: detectionResult.detectedDataTypes,
    };
  } catch (error) {
    // Re-throw AnonymizationError as-is
    if (error instanceof AnonymizationError) {
      throw error;
    }

    // Handle other errors
    throw new AnonymizationError(error instanceof Error ? error.message : "Unknown error occurred");
  }
};

export const AnonymizationService: IAnonymizationService = {
  checkAndAnonymize,
};
