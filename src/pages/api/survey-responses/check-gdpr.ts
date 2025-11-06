import type { APIRoute } from "astro";
import { AnonymizationService, AnonymizationError } from "@/lib/services/anonymizationService";

export const prerender = false;

/**
 * POST /api/survey-responses/check-gdpr
 *
 * Checks if text contains personal data and returns both original and anonymized versions.
 * This endpoint implements US-007 GDPR verification for open-ended questions.
 *
 * @param context - Astro API context
 * @returns Response with GdprCheckResult
 *
 * Status codes:
 * - 200: OK (returns GdprCheckResult)
 * - 400: Bad Request (invalid or missing text)
 * - 401: Unauthorized (user not authenticated)
 * - 500: Internal Server Error (AI service failure)
 */
export const POST: APIRoute = async ({ request, locals }) => {
  // Step 1: Guard clause - check authentication
  if (!locals.user) {
    return new Response(
      JSON.stringify({
        error: "Unauthorized",
        message: "You must be logged in to check feedback",
      }),
      {
        status: 401,
        headers: { "Content-Type": "application/json" },
      }
    );
  }

  // Step 2: Parse and validate request body
  let text: string;
  try {
    const body = await request.json();
    text = body.text;

    if (!text || typeof text !== "string") {
      return new Response(
        JSON.stringify({
          error: "Invalid input",
          message: "Text field is required and must be a string",
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Guard clause: empty text
    if (text.trim().length === 0) {
      return new Response(
        JSON.stringify({
          error: "Invalid input",
          message: "Text cannot be empty",
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }
  } catch (error) {
    return new Response(
      JSON.stringify({
        error: "Invalid input",
        message: "Invalid JSON in request body",
      }),
      {
        status: 400,
        headers: { "Content-Type": "application/json" },
      }
    );
  }

  // Step 3: Check for personal data and anonymize if needed
  try {
    const result = await AnonymizationService.checkAndAnonymize(text);

    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    if (error instanceof AnonymizationError) {
      return new Response(
        JSON.stringify({
          error: "Service Error",
          message: "Failed to check for personal data. Please try again.",
        }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Handle unexpected errors
    console.error("Unexpected error in GDPR check:", error);
    return new Response(
      JSON.stringify({
        error: "Internal Server Error",
        message: "An unexpected error occurred",
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
};

