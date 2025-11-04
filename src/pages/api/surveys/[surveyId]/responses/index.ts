import type { APIContext } from "astro";
import {
  SurveyResponseService,
  SurveyNotFoundError,
  DuplicateSurveyResponseError,
} from "../../../../../lib/services/surveyResponseService";
import { surveyIdSchema, createSurveyResponseSchema } from "../../../../../lib/schemas/surveyResponseSchemas";
import type { CreateSurveyResponseCommand } from "../../../../../types";

export const prerender = false;

/**
 * POST /api/surveys/{surveyId}/responses
 *
 * Creates a new survey response for the authenticated user.
 * This endpoint is called when a user starts filling out a survey for the first time.
 *
 * @param context - Astro API context
 * @returns Response with the newly created SurveyResponseDto
 *
 * Status codes:
 * - 201: Created (returns SurveyResponseDto)
 * - 400: Bad Request (invalid surveyId or request body)
 * - 401: Unauthorized (user not authenticated)
 * - 404: Not Found (survey doesn't exist)
 * - 409: Conflict (user already has a response for this survey)
 * - 500: Internal Server Error
 */
export async function POST(context: APIContext): Promise<Response> {
  // Check authentication
  if (!context.locals.user) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  // Validate surveyId parameter
  const surveyIdValidation = surveyIdSchema.safeParse(context.params.surveyId);

  if (!surveyIdValidation.success) {
    return new Response(
      JSON.stringify({
        error: "Bad Request",
        details: surveyIdValidation.error.flatten(),
      }),
      {
        status: 400,
        headers: { "Content-Type": "application/json" },
      }
    );
  }

  const surveyId = surveyIdValidation.data;

  // Parse and validate request body
  let requestBody: unknown;
  try {
    const text = await context.request.text();
    requestBody = text ? JSON.parse(text) : {};
  } catch (error) {
    return new Response(JSON.stringify({ error: "Invalid JSON in request body" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const bodyValidation = createSurveyResponseSchema.safeParse(requestBody);

  if (!bodyValidation.success) {
    return new Response(
      JSON.stringify({
        error: "Bad Request",
        details: bodyValidation.error.flatten(),
      }),
      {
        status: 400,
        headers: { "Content-Type": "application/json" },
      }
    );
  }

  const command: CreateSurveyResponseCommand = bodyValidation.data;
  const userId = context.locals.user.id;

  try {
    // Call the service to create the survey response
    const newResponse = await SurveyResponseService.createSurveyResponse(
      context.locals.supabase,
      command,
      surveyId,
      userId
    );

    return new Response(JSON.stringify(newResponse), {
      status: 201,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    // Handle specific error types
    if (error instanceof SurveyNotFoundError) {
      return new Response(JSON.stringify({ error: error.message }), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      });
    }

    if (error instanceof DuplicateSurveyResponseError) {
      return new Response(JSON.stringify({ error: error.message }), {
        status: 409,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Log unexpected errors
    console.error("Error creating survey response:", error);

    return new Response(JSON.stringify({ error: "Internal Server Error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
