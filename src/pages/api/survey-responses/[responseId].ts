import type { APIContext } from "astro";
import {
  SurveyResponseService,
  SurveyResponseNotFoundError,
  SurveyResponseForbiddenError,
} from "../../../lib/services/surveyResponseService";
import { AnonymizationError } from "../../../lib/services/anonymizationService";
import { updateSurveyResponseSchema, responseIdParamSchema } from "../../../lib/schemas/surveyResponseSchemas";
import type { UpdateSurveyResponseCommand } from "../../../types";
import { ZodError } from "zod";

export const prerender = false;

/**
 * PATCH /api/survey-responses/{responseId}
 *
 * Updates an existing survey response for the authenticated user.
 * This endpoint is called when a user saves progress or finalizes their survey.
 * The open_feedback field is automatically anonymized before saving (GDPR compliance).
 *
 * @param context - Astro API context
 * @returns Response with the updated SurveyResponseDto
 *
 * Status codes:
 * - 200: OK (returns updated SurveyResponseDto)
 * - 400: Bad Request (invalid responseId or request body)
 * - 401: Unauthorized (user not authenticated)
 * - 403: Forbidden (user trying to update someone else's response)
 * - 404: Not Found (survey response doesn't exist)
 * - 500: Internal Server Error (including anonymization failures)
 */
export async function PATCH(context: APIContext): Promise<Response> {
  // Step 1: Guard clause - check authentication
  if (!context.locals.user) {
    return new Response(
      JSON.stringify({
        error: "Unauthorized",
        message: "You must be logged in to update survey responses",
      }),
      {
        status: 401,
        headers: { "Content-Type": "application/json" },
      }
    );
  }

  // Step 2: Validate responseId path parameter
  const paramsValidation = responseIdParamSchema.safeParse(context.params);

  if (!paramsValidation.success) {
    return new Response(
      JSON.stringify({
        error: "Invalid input",
        details: paramsValidation.error.flatten(),
      }),
      {
        status: 400,
        headers: { "Content-Type": "application/json" },
      }
    );
  }

  const { responseId } = paramsValidation.data;

  // Step 3: Parse and validate request body
  let requestBody: unknown;
  try {
    const text = await context.request.text();
    requestBody = text ? JSON.parse(text) : {};
  } catch {
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

  const bodyValidation = updateSurveyResponseSchema.safeParse(requestBody);

  if (!bodyValidation.success) {
    return new Response(
      JSON.stringify({
        error: "Invalid input",
        details: bodyValidation.error.flatten(),
      }),
      {
        status: 400,
        headers: { "Content-Type": "application/json" },
      }
    );
  }

  const command: UpdateSurveyResponseCommand = bodyValidation.data;
  const userId = context.locals.user.id;

  // Step 4: Call the service to update the survey response
  try {
    const updatedResponse = await SurveyResponseService.updateSurveyResponse(
      context.locals.supabase,
      command,
      responseId,
      userId
    );

    // Step 5: Return success
    return new Response(JSON.stringify(updatedResponse), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    // Step 6: Handle specific error types
    if (error instanceof ZodError) {
      return new Response(
        JSON.stringify({
          error: "Invalid input",
          details: error.flatten(),
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    if (error instanceof SurveyResponseNotFoundError) {
      return new Response(
        JSON.stringify({
          error: "Not Found",
          message: error.message,
        }),
        {
          status: 404,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    if (error instanceof SurveyResponseForbiddenError) {
      return new Response(
        JSON.stringify({
          error: "Forbidden",
          message: error.message,
        }),
        {
          status: 403,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    if (error instanceof AnonymizationError) {
      console.error("Anonymization failed:", error);
      return new Response(
        JSON.stringify({
          error: "Internal Server Error",
          message: "Failed to process feedback",
        }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Handle generic errors
    console.error("Unexpected error updating survey response:", error);
    return new Response(
      JSON.stringify({
        error: "Internal Server Error",
        message: "Failed to update survey response",
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
}
