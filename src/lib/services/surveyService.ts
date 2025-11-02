import type { SupabaseClient } from "../../db/supabase.client.ts";
import type { SurveyDto, CompetitionDto } from "../../types.ts";
import { SUPABASE_ERROR_CODES } from "../constants/supabaseErrors.ts";

/**
 * Custom error class for survey not found
 */
export class SurveyNotFoundError extends Error {
  constructor(slug: string) {
    super(`Survey with slug "${slug}" not found`);
    this.name = "SurveyNotFoundError";
  }
}

/**
 * Interface for the survey with competition data
 */
export interface SurveyWithCompetition {
  survey: SurveyDto;
  competition: CompetitionDto;
}

/**
 * Fetches a survey and its associated competition by slug.
 *
 * @param slug - The unique slug identifier of the survey
 * @param supabase - The Supabase client instance
 * @returns The survey with its competition data
 * @throws {SurveyNotFoundError} If the survey doesn't exist
 * @throws {Error} For other database errors
 */
export const getSurveyBySlug = async (slug: string, supabase: SupabaseClient): Promise<SurveyWithCompetition> => {
  // Query for the survey with its competition
  const { data: survey, error: surveyError } = await supabase.from("surveys").select("*").eq("slug", slug).single();

  if (surveyError) {
    // Check if it's a "not found" error
    if (surveyError.code === SUPABASE_ERROR_CODES.NOT_FOUND) {
      throw new SurveyNotFoundError(slug);
    }
    console.error("Error fetching survey:", surveyError);
    throw new Error("Failed to fetch survey");
  }

  if (!survey) {
    throw new SurveyNotFoundError(slug);
  }

  // Fetch the associated competition
  const { data: competition, error: competitionError } = await supabase
    .from("competitions")
    .select("id, name, starts_at, ends_at, city, country_code, tasks_count, participant_count")
    .eq("id", survey.competition_id)
    .single();

  if (competitionError) {
    console.error("Error fetching competition:", competitionError);
    throw new Error("Failed to fetch competition");
  }

  if (!competition) {
    throw new Error(`Competition with id ${survey.competition_id} not found`);
  }

  return {
    survey,
    competition,
  };
};

export const SurveyService = {
  getSurveyBySlug,
};
