import type { APIContext } from "astro";
import { z } from "zod";
import { SurveyResponseService, SurveyNotFoundError } from "../../../../../lib/services/surveyResponseService";
import log from "@/lib/logger";

export const prerender = false;

/**
 * Validation schema for surveyId parameter.
 * Ensures surveyId is a positive integer.
 */
const surveyIdSchema = z.coerce.number().int().positive({
  message: "surveyId must be a positive integer",
});

/**
 * GET /api/surveys/{surveyId}/responses/me
 *
 * Returns the authenticated user's response for a specific survey.
 * Returns null if the user hasn't started the survey yet.
 *
 * @param context - Astro API context
 * @returns Response with SurveyResponseDto or null
 *
 * Status codes:
 * - 200: Success (returns SurveyResponseDto or null)
 * - 400: Bad Request (invalid surveyId)
 * - 401: Unauthorized (user not authenticated)
 * - 404: Not Found (survey doesn't exist)
 * - 500: Internal Server Error
 */
export async function GET(context: APIContext): Promise<Response> {
  // Check authentication
  if (!context.locals.user) {
    return new Response(JSON.stringify({ message: "Unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  // Validate surveyId parameter
  const validationResult = surveyIdSchema.safeParse(context.params.surveyId);

  if (!validationResult.success) {
    return new Response(
      JSON.stringify({
        message: "Bad Request",
        errors: validationResult.error.flatten(),
      }),
      {
        status: 400,
        headers: { "Content-Type": "application/json" },
      }
    );
  }

  const surveyId = validationResult.data;
  const userId = context.locals.user.id;

  try {
    // Call the service to find the user's response
    const response = await SurveyResponseService.findUserResponse(surveyId, userId, context.locals.supabase);

    return new Response(JSON.stringify(response), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    // Handle specific error types
    if (error instanceof SurveyNotFoundError) {
      return new Response(JSON.stringify({ message: error.message }), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Log unexpected errors
    log.error("Error fetching survey response:", error);

    return new Response(JSON.stringify({ message: "Internal Server Error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
