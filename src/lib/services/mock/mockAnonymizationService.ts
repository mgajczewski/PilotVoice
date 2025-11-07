/**
 * Mock implementation of AnonymizationService for testing purposes.
 * This service simulates GDPR checks without making actual API calls.
 * @server-only This service must only be used on the server-side
 */

import type { GdprCheckResult } from "@/lib/services/anonymizationService";

/**
 * Pre-defined mock responses for testing different scenarios.
 * More than 50% return containsPersonalData: false
 */
const mockResponses: Omit<GdprCheckResult, "originalText">[] = [
  // Cases without personal data (>50%)
  { containsPersonalData: false, confidence: 0.99, anonymizedText: null },
  { containsPersonalData: false, confidence: 0.95, anonymizedText: null },
  { containsPersonalData: false, confidence: 0.92, anonymizedText: null },
  { containsPersonalData: false, confidence: 0.88, anonymizedText: null },
  { containsPersonalData: false, confidence: 0.96, anonymizedText: null },
  { containsPersonalData: false, confidence: 0.99, anonymizedText: null },
  { containsPersonalData: false, confidence: 0.94, anonymizedText: null },

  // Cases with personal data
  {
    containsPersonalData: true,
    confidence: 0.85,
    anonymizedText: "The organizer did a great job.",
    detectedDataTypes: ["full_name"],
  },
  {
    containsPersonalData: true,
    confidence: 0.95,
    anonymizedText: "Please contact me at the provided email.",
    detectedDataTypes: ["email"],
  },
  {
    containsPersonalData: true,
    confidence: 0.75,
    anonymizedText: "A participant mentioned an issue with the landing zone.",
    detectedDataTypes: ["full_name", "location"],
  },
  {
    containsPersonalData: true,
    confidence: 0.91,
    anonymizedText: "My phone number was called by mistake.",
    detectedDataTypes: ["phone"],
  },
  {
    containsPersonalData: true,
    confidence: 0.88,
    anonymizedText: "The pilot had excellent flight skills.",
    detectedDataTypes: ["full_name"],
  },
];

/**
 * Mock implementation of checkAndAnonymize that returns random responses.
 * Simulates network delay and returns pre-defined responses for testing.
 *
 * @param text - The feedback text to check
 * @returns GdprCheckResult with random detection and anonymization details
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

  // Simulate network delay (300-700ms)
  const delay = 300 + Math.floor(Math.random() * 400);
  await new Promise((resolve) => setTimeout(resolve, delay));

  // Select random response
  const randomIndex = Math.floor(Math.random() * mockResponses.length);
  const mockResponse = { ...mockResponses[randomIndex] };

  // If personal data detected, append a hint of the original text
  if (mockResponse.containsPersonalData && mockResponse.anonymizedText) {
    const textPreview = text.substring(0, 30);
    mockResponse.anonymizedText = `${mockResponse.anonymizedText} (anonymized from: "${textPreview}...")`;
  }

  return {
    ...mockResponse,
    originalText: text,
  };
};

export const MockAnonymizationService = {
  checkAndAnonymize,
};

