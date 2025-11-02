import type { SupabaseClient } from "../../db/supabase.client.ts";
import type { CreateSurveyResponseCommand, SurveyResponseDto, UpdateSurveyResponseCommand } from "../../types.ts";
import { anonymizeFeedback, AnonymizationError } from "./anonymizationService.ts";

/**
 * Custom error class for survey-related errors
 */
export class SurveyNotFoundError extends Error {
  constructor(surveyId: number) {
    super(`Survey with id ${surveyId} not found`);
    this.name = "SurveyNotFoundError";
  }
}

/**
 * Custom error class for duplicate survey response
 */
export class DuplicateSurveyResponseError extends Error {
  constructor(surveyId: number, userId: string) {
    super(`User ${userId} has already created a response for survey ${surveyId}`);
    this.name = "DuplicateSurveyResponseError";
  }
}

/**
 * Custom error class for survey response not found
 */
export class SurveyResponseNotFoundError extends Error {
  constructor(responseId: number) {
    super(`Survey response with id ${responseId} not found`);
    this.name = "SurveyResponseNotFoundError";
  }
}

/**
 * Custom error class for forbidden access to survey response
 */
export class SurveyResponseForbiddenError extends Error {
  constructor() {
    super(`You can only update your own survey responses`);
    this.name = "SurveyResponseForbiddenError";
  }
}

/**
 * Finds a user's response for a specific survey.
 * Returns null if the user has not started the survey yet.
 *
 * @param surveyId - The ID of the survey
 * @param userId - The ID of the user
 * @param supabase - The Supabase client instance
 * @returns The user's survey response or null if not found
 * @throws {SurveyNotFoundError} If the survey doesn't exist
 * @throws {Error} For other database errors
 */
export const findUserResponse = async (
  surveyId: number,
  userId: string,
  supabase: SupabaseClient
): Promise<SurveyResponseDto | null> => {
  // First, check if the survey exists
  const { data: survey, error: surveyError } = await supabase.from("surveys").select("id").eq("id", surveyId).single();

  if (surveyError) {
    // Check if it's a "not found" error
    if (surveyError.code === "PGRST116") {
      throw new SurveyNotFoundError(surveyId);
    }
    console.error("Error checking survey existence:", surveyError);
    throw new Error("Failed to check survey existence");
  }

  if (!survey) {
    throw new SurveyNotFoundError(surveyId);
  }

  // Query for the user's response
  const { data: response, error: responseError } = await supabase
    .from("survey_responses")
    .select("*")
    .eq("survey_id", surveyId)
    .eq("user_id", userId)
    .maybeSingle();

  if (responseError) {
    console.error("Error fetching survey response:", responseError);
    throw new Error("Failed to fetch survey response");
  }

  return response;
};

/**
 * Creates a new survey response for a user.
 *
 * @param supabase - The Supabase client instance
 * @param command - The command containing optional initial data
 * @param surveyId - The ID of the survey
 * @param userId - The ID of the user
 * @returns The newly created survey response
 * @throws {SurveyNotFoundError} If the survey doesn't exist
 * @throws {DuplicateSurveyResponseError} If the user already has a response for this survey
 * @throws {Error} For other database errors
 */
export const createSurveyResponse = async (
  supabase: SupabaseClient,
  command: CreateSurveyResponseCommand,
  surveyId: number,
  userId: string
): Promise<SurveyResponseDto> => {
  // First, check if the survey exists
  const { data: survey, error: surveyError } = await supabase.from("surveys").select("id").eq("id", surveyId).single();

  if (surveyError) {
    // Check if it's a "not found" error
    if (surveyError.code === "PGRST116") {
      throw new SurveyNotFoundError(surveyId);
    }
    console.error("Error checking survey existence:", surveyError);
    throw new Error("Failed to check survey existence");
  }

  if (!survey) {
    throw new SurveyNotFoundError(surveyId);
  }

  // Attempt to insert the new response
  const { data: newResponse, error: insertError } = await supabase
    .from("survey_responses")
    .insert({
      survey_id: surveyId,
      user_id: userId,
      overall_rating: command.overall_rating ?? null,
    })
    .select()
    .single();

  if (insertError) {
    // Check for unique constraint violation (PostgreSQL error code 23505)
    if (insertError.code === "23505") {
      throw new DuplicateSurveyResponseError(surveyId, userId);
    }
    console.error("Error creating survey response:", insertError);
    throw new Error("Failed to create survey response");
  }

  if (!newResponse) {
    throw new Error("Failed to create survey response: no data returned");
  }

  return newResponse;
};

/**
 * Updates an existing survey response.
 * Automatically anonymizes open_feedback if provided.
 *
 * @param supabase - The Supabase client instance
 * @param command - The command containing fields to update
 * @param responseId - The ID of the survey response to update
 * @param userId - The ID of the user making the update (for authorization)
 * @returns The updated survey response
 * @throws {SurveyResponseNotFoundError} If the survey response doesn't exist
 * @throws {SurveyResponseForbiddenError} If the user doesn't own the response
 * @throws {AnonymizationError} If feedback anonymization fails
 * @throws {Error} For other database errors
 */
export const updateSurveyResponse = async (
  supabase: SupabaseClient,
  command: UpdateSurveyResponseCommand,
  responseId: number,
  userId: string
): Promise<SurveyResponseDto> => {
  // Step 1: Check if the response exists and belongs to the user
  const { data: existingResponse, error: fetchError } = await supabase
    .from("survey_responses")
    .select("*")
    .eq("id", responseId)
    .maybeSingle();

  if (fetchError) {
    console.error("Error fetching survey response:", fetchError);
    throw new Error("Failed to fetch survey response");
  }

  // Guard clause: response doesn't exist
  if (!existingResponse) {
    throw new SurveyResponseNotFoundError(responseId);
  }

  // Guard clause: user doesn't own the response
  if (existingResponse.user_id !== userId) {
    throw new SurveyResponseForbiddenError();
  }

  // Step 2: Prepare the update command
  const updateData: Partial<UpdateSurveyResponseCommand> = {};

  // Copy over the fields from command
  if (command.overall_rating !== undefined) {
    updateData.overall_rating = command.overall_rating;
  }

  if (command.completed_at !== undefined) {
    updateData.completed_at = command.completed_at;
  }

  // Step 3: Anonymize open_feedback if provided
  if (command.open_feedback !== undefined) {
    // Handle null case (user clearing feedback)
    if (command.open_feedback === null) {
      updateData.open_feedback = null;
    } else {
      // Anonymize the feedback
      try {
        const anonymizedFeedback = await anonymizeFeedback(command.open_feedback);
        updateData.open_feedback = anonymizedFeedback;
      } catch (error) {
        // Re-throw anonymization errors
        if (error instanceof AnonymizationError) {
          throw error;
        }
        console.error("Unexpected error during anonymization:", error);
        throw new AnonymizationError(error instanceof Error ? error.message : "Unknown error");
      }
    }
  }

  // Step 4: Perform the update
  const { data: updatedResponse, error: updateError } = await supabase
    .from("survey_responses")
    .update(updateData)
    .eq("id", responseId)
    .select()
    .single();

  if (updateError) {
    console.error("Error updating survey response:", updateError);
    throw new Error("Failed to update survey response");
  }

  if (!updatedResponse) {
    throw new Error("Failed to update survey response: no data returned");
  }

  return updatedResponse;
};

export const SurveyResponseService = {
  findUserResponse,
  createSurveyResponse,
  updateSurveyResponse,
};
