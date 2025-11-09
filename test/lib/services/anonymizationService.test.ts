import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { checkAndAnonymize, AnonymizationError, type GdprCheckResult } from "@/lib/services/anonymizationService";

// Create a mock function for getStructuredCompletion
const mockGetStructuredCompletion = vi.fn();

// Mock OpenRouterService at the top level with factory function
vi.mock("@/lib/services/openrouter/openrouterService", () => {
  return {
    OpenRouterService: vi.fn(function () {
      return {
        getStructuredCompletion: mockGetStructuredCompletion,
      };
    }),
  };
});

describe("AnonymizationService", () => {
  beforeEach(() => {
    // Reset all mocks before each test
    vi.clearAllMocks();

    // Mock environment variable
    vi.stubEnv("OPENROUTER_MODEL", "env-openrouter-model");
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  describe("checkAndAnonymize - Guard Clauses", () => {
    it.each([
      ["empty string", ""],
      ["whitespace-only string", "   \n\t  "],
    ])("should handle %s without API call", async (_description, input) => {
      const result = await checkAndAnonymize(input);

      expect(result.containsPersonalData).toBe(false);
      expect(result.confidence).toBe(1.0);
      expect(result.anonymizedText).toBeNull();
      expect(result.originalText).toBe(input);
      expect(mockGetStructuredCompletion).not.toHaveBeenCalled();
    });
  });

  describe("checkAndAnonymize - No Personal Data Detected", () => {
    it("should return original text when no personal data is detected", async () => {
      const inputText = "The pilot performed well during the competition.";
      const mockDetectionResponse = {
        containsPersonalData: false,
        confidence: 0.95,
        detectedDataTypes: [],
        explanation: "No personal data found",
      };

      mockGetStructuredCompletion.mockResolvedValueOnce(mockDetectionResponse);

      const result = await checkAndAnonymize(inputText);

      expect(result).toEqual({
        containsPersonalData: false,
        confidence: 0.95,
        originalText: inputText,
        anonymizedText: null,
        detectedDataTypes: [],
      });

      // Verify only detection was called, not anonymization
      expect(mockGetStructuredCompletion).toHaveBeenCalledTimes(1);
    });

    it("should call OpenRouterService with correct detection parameters", async () => {
      const inputText = "Great event organization!";
      mockGetStructuredCompletion.mockResolvedValueOnce({
        containsPersonalData: false,
        confidence: 0.98,
        detectedDataTypes: [],
        explanation: "Generic feedback",
      });

      await checkAndAnonymize(inputText);

      expect(mockGetStructuredCompletion).toHaveBeenCalledWith({
        model: "env-openrouter-model",
        systemPrompt: expect.stringContaining("GDPR compliance assistant"),
        userPrompt: expect.stringContaining(inputText),
        responseSchema: {
          name: "personal_data_detection",
          schema: expect.objectContaining({
            type: "object",
            properties: expect.objectContaining({
              containsPersonalData: expect.any(Object),
              confidence: expect.any(Object),
              detectedDataTypes: expect.any(Object),
            }),
          }),
        },
        temperature: 0.3,
        maxTokens: 200,
      });
    });
  });

  describe("checkAndAnonymize - Personal Data Detected", () => {
    it.each([
      [
        "full name",
        "John Smith was an excellent pilot at the competition.",
        ["full_name"],
        0.95,
        "The pilot was excellent at the competition.",
      ],
      [
        "email",
        "Contact me at john.doe@example.com for more details.",
        ["email"],
        0.99,
        "Contact the organizer for more details.",
      ],
      [
        "multiple personal data types",
        "John Smith (john@example.com) called me at 555-1234.",
        ["full_name", "email", "phone"],
        0.98,
        "The participant contacted me.",
      ],
    ])(
      "should detect and anonymize text with %s",
      async (_description, inputText, detectedDataTypes, confidence, anonymizedText) => {
        const mockDetectionResponse = {
          containsPersonalData: true,
          confidence,
          detectedDataTypes,
          explanation: `Contains ${detectedDataTypes.join(", ")}`,
        };
        const mockAnonymizationResponse = {
          anonymizedText,
        };

        mockGetStructuredCompletion
          .mockResolvedValueOnce(mockDetectionResponse)
          .mockResolvedValueOnce(mockAnonymizationResponse);

        const result = await checkAndAnonymize(inputText);

        expect(result.containsPersonalData).toBe(true);
        expect(result.confidence).toBe(confidence);
        expect(result.detectedDataTypes).toEqual(detectedDataTypes);
        expect(result.anonymizedText).toBe(anonymizedText);
        expect(mockGetStructuredCompletion).toHaveBeenCalledTimes(2);
      }
    );

    it("should call OpenRouterService with correct anonymization parameters", async () => {
      const inputText = "Anna Kowalska helped me during the event.";
      mockGetStructuredCompletion
        .mockResolvedValueOnce({
          containsPersonalData: true,
          confidence: 0.9,
          detectedDataTypes: ["full_name"],
          explanation: "Contains personal name",
        })
        .mockResolvedValueOnce({
          anonymizedText: "The organizer helped me during the event.",
        });

      await checkAndAnonymize(inputText);

      // Check second call (anonymization)
      const secondCall = mockGetStructuredCompletion.mock.calls[1][0];
      expect(secondCall).toEqual({
        model: "env-openrouter-model",
        systemPrompt: expect.stringContaining("anonymization assistant"),
        userPrompt: expect.stringContaining(inputText),
        responseSchema: {
          name: "text_anonymization",
          schema: expect.objectContaining({
            type: "object",
            properties: expect.objectContaining({
              anonymizedText: expect.any(Object),
            }),
          }),
        },
        temperature: 0.5,
        maxTokens: 1000,
      });
    });

    it("should not pass detectedDataTypes to anonymization", async () => {
      const inputText = "Contact John at john@example.com or 555-1234.";
      const detectedType = "full_name_with_email_and_phone";

      mockGetStructuredCompletion
        .mockResolvedValueOnce({
          containsPersonalData: true,
          confidence: 0.95,
          detectedDataTypes: [detectedType],
          explanation: "Multiple personal data types detected",
        })
        .mockResolvedValueOnce({
          anonymizedText: "Contact the organizer.",
        });

      await checkAndAnonymize(inputText);

      // Check that anonymization call doesn't receive detectedDataTypes
      const secondCall = mockGetStructuredCompletion.mock.calls[1][0];
      expect(JSON.stringify(secondCall)).not.toContain("full_name_with_email_and_phone");
      expect(JSON.stringify(secondCall)).not.toContain("detectedDataTypes");
    });

    it("should trim whitespace from anonymized text", async () => {
      const inputText = "Contact John Doe for details.";
      mockGetStructuredCompletion
        .mockResolvedValueOnce({
          containsPersonalData: true,
          confidence: 0.92,
          detectedDataTypes: ["full_name"],
          explanation: "Name detected",
        })
        .mockResolvedValueOnce({
          anonymizedText: "   Contact the organizer for details.   ",
        });

      const result = await checkAndAnonymize(inputText);

      expect(result.anonymizedText).toBe("Contact the organizer for details.");
    });
  });

  describe("checkAndAnonymize - Error Handling", () => {
    it("should throw AnonymizationError when OpenRouterService fails during detection", async () => {
      mockGetStructuredCompletion.mockRejectedValue(new Error("API connection failed"));

      await expect(checkAndAnonymize("Some text")).rejects.toMatchObject({
        name: "AnonymizationError",
        message: "Failed to anonymize feedback: API connection failed",
      });
    });

    it("should throw AnonymizationError when OpenRouterService fails during anonymization", async () => {
      mockGetStructuredCompletion
        .mockResolvedValue({
          containsPersonalData: true,
          confidence: 0.9,
          detectedDataTypes: ["full_name"],
          explanation: "Name found",
        })
        .mockRejectedValue(new Error("Anonymization service unavailable"));

      await expect(checkAndAnonymize("John Doe is here")).rejects.toMatchObject({
        name: "AnonymizationError",
        message: "Failed to anonymize feedback: Anonymization service unavailable",
      });
    });

    it.each([
      ["empty text", ""],
      ["only whitespace", "   \n\t   "],
    ])("should throw AnonymizationError when anonymization returns %s", async (_description, anonymizedText) => {
      mockGetStructuredCompletion
        .mockResolvedValueOnce({
          containsPersonalData: true,
          confidence: 0.9,
          detectedDataTypes: ["full_name"],
          explanation: "Name found",
        })
        .mockResolvedValueOnce({
          anonymizedText,
        });

      await expect(checkAndAnonymize("John Doe is here")).rejects.toMatchObject({
        name: "AnonymizationError",
        message: "Failed to anonymize feedback: OpenRouter API returned empty anonymized text",
      });
    });

    it("should preserve AnonymizationError type when re-thrown", async () => {
      const originalError = new AnonymizationError("Custom error message");
      mockGetStructuredCompletion.mockRejectedValueOnce(originalError);

      try {
        await checkAndAnonymize("Some text");
        expect.fail("Should have thrown error");
      } catch (error) {
        expect(error).toBeInstanceOf(AnonymizationError);
        expect(error).toBe(originalError);
      }
    });

    it("should wrap unknown errors in AnonymizationError", async () => {
      mockGetStructuredCompletion.mockRejectedValue("String error");

      await expect(checkAndAnonymize("Some text")).rejects.toMatchObject({
        name: "AnonymizationError",
        message: expect.stringContaining("Unknown error occurred"),
      });
    });
  });

  describe("checkAndAnonymize - Edge Cases", () => {
    it("should handle very long text", async () => {
      const longText = "The pilot was great. ".repeat(100);
      mockGetStructuredCompletion.mockResolvedValueOnce({
        containsPersonalData: false,
        confidence: 0.95,
        detectedDataTypes: [],
        explanation: "No personal data",
      });

      const result = await checkAndAnonymize(longText);

      expect(result.containsPersonalData).toBe(false);
      expect(mockGetStructuredCompletion).toHaveBeenCalledWith(
        expect.objectContaining({
          userPrompt: expect.stringContaining(longText),
        })
      );
    });

    it("should handle text with special characters", async () => {
      const specialText = "Great event! 🎉 #paragliding @organizer";
      mockGetStructuredCompletion.mockResolvedValueOnce({
        containsPersonalData: false,
        confidence: 0.9,
        detectedDataTypes: [],
        explanation: "Social media handle but not personal data",
      });

      const result = await checkAndAnonymize(specialText);

      expect(result.originalText).toBe(specialText);
      expect(result.containsPersonalData).toBe(false);
    });

    it("should handle multilingual text", async () => {
      const multilingualText = "Great competition! Świetne zawody! Отличные соревнования!";
      mockGetStructuredCompletion.mockResolvedValueOnce({
        containsPersonalData: false,
        confidence: 0.88,
        detectedDataTypes: [],
        explanation: "Generic feedback in multiple languages",
      });

      const result = await checkAndAnonymize(multilingualText);

      expect(result.containsPersonalData).toBe(false);
      expect(result.originalText).toBe(multilingualText);
    });

    it("should handle low confidence detection without personal data", async () => {
      const ambiguousText = "Mike told me about the event.";
      mockGetStructuredCompletion.mockResolvedValueOnce({
        containsPersonalData: false,
        confidence: 0.3,
        detectedDataTypes: [],
        explanation: "Mike could be a common name or nickname, low confidence",
      });

      const result = await checkAndAnonymize(ambiguousText);

      expect(result.containsPersonalData).toBe(false);
      expect(result.confidence).toBe(0.3);
      // Should not proceed to anonymization regardless of low confidence
      expect(mockGetStructuredCompletion).toHaveBeenCalledTimes(1);
    });

    it("should proceed with anonymization even with low confidence when personal data is detected", async () => {
      const inputText = "John might be the organizer.";
      mockGetStructuredCompletion
        .mockResolvedValueOnce({
          containsPersonalData: true,
          confidence: 0.4,
          detectedDataTypes: ["possible_name"],
          explanation: "Low confidence name detection",
        })
        .mockResolvedValueOnce({
          anonymizedText: "Someone might be the organizer.",
        });

      const result = await checkAndAnonymize(inputText);

      // Confidence level doesn't block anonymization - only containsPersonalData matters
      expect(result.containsPersonalData).toBe(true);
      expect(result.confidence).toBe(0.4);
      expect(result.anonymizedText).toBe("Someone might be the organizer.");
      expect(mockGetStructuredCompletion).toHaveBeenCalledTimes(2);
    });
  });

  describe("checkAndAnonymize - Integration Scenarios", () => {
    it("should preserve feedback sentiment after anonymization", async () => {
      const inputText = "John Smith was extremely rude and unprofessional!";
      mockGetStructuredCompletion
        .mockResolvedValueOnce({
          containsPersonalData: true,
          confidence: 0.95,
          detectedDataTypes: ["full_name"],
          explanation: "Contains name",
        })
        .mockResolvedValueOnce({
          anonymizedText: "The organizer was extremely rude and unprofessional!",
        });

      const result = await checkAndAnonymize(inputText);

      expect(result.anonymizedText).toContain("extremely rude and unprofessional");
    });

    it("should handle mixed content (personal data + generic feedback)", async () => {
      const inputText = "The takeoff was excellent. However, Anna from the crew (anna@example.com) was late.";
      mockGetStructuredCompletion
        .mockResolvedValueOnce({
          containsPersonalData: true,
          confidence: 0.97,
          detectedDataTypes: ["full_name", "email"],
          explanation: "Contains name and email",
        })
        .mockResolvedValueOnce({
          anonymizedText: "The takeoff was excellent. However, a crew member was late.",
        });

      const result = await checkAndAnonymize(inputText);

      expect(result.containsPersonalData).toBe(true);
      expect(result.anonymizedText).toContain("The takeoff was excellent");
      expect(result.anonymizedText).not.toContain("Anna");
      expect(result.anonymizedText).not.toContain("anna@example.com");
    });
  });

  describe("AnonymizationError", () => {
    it("should create error with correct message format", () => {
      const error = new AnonymizationError("Test error message");

      expect(error.name).toBe("AnonymizationError");
      expect(error.message).toBe("Failed to anonymize feedback: Test error message");
      expect(error).toBeInstanceOf(Error);
    });

    it("should be catchable as Error", () => {
      try {
        throw new AnonymizationError("Test");
      } catch (error) {
        expect(error).toBeInstanceOf(Error);
        expect(error).toBeInstanceOf(AnonymizationError);
      }
    });
  });

  describe("GdprCheckResult Type", () => {
    it("should return correctly typed result for no personal data", async () => {
      mockGetStructuredCompletion.mockResolvedValueOnce({
        containsPersonalData: false,
        confidence: 0.95,
        detectedDataTypes: [],
        explanation: "Clean",
      });

      const result: GdprCheckResult = await checkAndAnonymize("Clean text");

      // Type assertions
      expect(typeof result.containsPersonalData).toBe("boolean");
      expect(typeof result.confidence).toBe("number");
      expect(typeof result.originalText).toBe("string");
      expect(result.anonymizedText).toBeNull();
      expect(Array.isArray(result.detectedDataTypes)).toBe(true);
    });

    it("should return correctly typed result for personal data found", async () => {
      mockGetStructuredCompletion
        .mockResolvedValueOnce({
          containsPersonalData: true,
          confidence: 0.95,
          detectedDataTypes: ["full_name"],
          explanation: "Name found",
        })
        .mockResolvedValueOnce({
          anonymizedText: "Anonymized text",
        });

      const result: GdprCheckResult = await checkAndAnonymize("John Doe");

      expect(typeof result.anonymizedText).toBe("string");
      expect(result.anonymizedText).not.toBeNull();
    });
  });
});
