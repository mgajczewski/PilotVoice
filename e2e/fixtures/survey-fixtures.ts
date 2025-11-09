import type { SupabaseTestClient } from "../utils/supabase";
import type { TablesInsert } from "../../src/db/database.types";

/**
 * Test fixture data that tracks created resources for cleanup
 */
export interface SurveyFixtureData {
  competitionId: number;
  surveyId: number;
  surveySlug: string;
  surveyResponseId?: number;
}

/**
 * Fixture cleanup tracker
 */
export class FixtureCleanup {
  private surveyIds: number[] = [];
  private competitionIds: number[] = [];
  private surveyResponseIds: number[] = [];

  track(data: SurveyFixtureData): void {
    if (data.surveyId && !this.surveyIds.includes(data.surveyId)) {
      this.surveyIds.push(data.surveyId);
    }
    if (data.competitionId && !this.competitionIds.includes(data.competitionId)) {
      this.competitionIds.push(data.competitionId);
    }
    if (data.surveyResponseId && !this.surveyResponseIds.includes(data.surveyResponseId)) {
      this.surveyResponseIds.push(data.surveyResponseId);
    }
  }

  async cleanup(supabase: SupabaseTestClient): Promise<void> {
    const errors: string[] = [];

    // Clean up survey responses first (due to foreign key constraints)
    if (this.surveyResponseIds.length > 0) {
      const { error: responsesError } = await supabase
        .from("survey_responses")
        .delete()
        .in("id", this.surveyResponseIds);

      if (responsesError) {
        errors.push(`Failed to delete survey_responses: ${responsesError.message}`);
      }
    }

    // Clean up surveys (will cascade to responses if not already deleted)
    if (this.surveyIds.length > 0) {
      const { error: surveysError } = await supabase.from("surveys").delete().in("id", this.surveyIds);

      if (surveysError) {
        errors.push(`Failed to delete surveys: ${surveysError.message}`);
      }
    }

    // Clean up competitions last (will cascade to surveys and responses)
    if (this.competitionIds.length > 0) {
      const { error: competitionsError } = await supabase.from("competitions").delete().in("id", this.competitionIds);

      if (competitionsError) {
        errors.push(`Failed to delete competitions: ${competitionsError.message}`);
      }
    }

    if (errors.length > 0) {
      // Log errors but don't throw - we want to continue even if cleanup fails partially
      // eslint-disable-next-line no-console
      console.error("Cleanup errors occurred:", errors);
    }

    // Reset arrays
    this.surveyIds = [];
    this.competitionIds = [];
    this.surveyResponseIds = [];
  }
}

/**
 * Helper to create a test competition
 */
export async function createTestCompetition(
  supabase: SupabaseTestClient,
  suffix: string = Date.now().toString()
): Promise<number> {
  const now = Date.now();
  const daysToMs = (days: number) => days * 24 * 60 * 60 * 1000;

  const competition: TablesInsert<"competitions"> = {
    name: `E2E Test Competition ${suffix}`,
    city: "Zakopane",
    country_code: "PL",
    starts_at: new Date(now - daysToMs(7)).toISOString(),
    ends_at: new Date(now - daysToMs(3)).toISOString(),
    participant_count: 50,
    tasks_count: 5,
  };

  const { data, error } = await supabase.from("competitions").insert(competition).select("id").single();

  if (error || !data) {
    throw new Error(`Failed to create test competition: ${error?.message || "No data returned"}`);
  }

  return data.id;
}

/**
 * Creates an empty survey (no responses)
 */
export async function createEmptySurvey(
  supabase: SupabaseTestClient,
  competitionId?: number,
  suffix: string = Date.now().toString()
): Promise<SurveyFixtureData> {
  const now = Date.now();
  const daysToMs = (days: number) => days * 24 * 60 * 60 * 1000;

  // Create competition if not provided
  const compId = competitionId || (await createTestCompetition(supabase, suffix));

  const survey: TablesInsert<"surveys"> = {
    competition_id: compId,
    opens_at: new Date(now - daysToMs(2)).toISOString(),
    closes_at: new Date(now + daysToMs(7)).toISOString(),
    slug: `e2e-empty-survey-${suffix}`,
  };

  const { data, error } = await supabase.from("surveys").insert(survey).select("id, slug").single();

  if (error || !data) {
    throw new Error(`Failed to create empty survey: ${error?.message || "No data returned"}`);
  }

  if (!data.slug) {
    throw new Error("Survey slug is null");
  }

  return {
    competitionId: compId,
    surveyId: data.id,
    surveySlug: data.slug,
  };
}

/**
 * Creates a survey with an existing response for a specific user
 */
export async function createSurveyWithResponse(
  supabase: SupabaseTestClient,
  userId: string,
  competitionId?: number,
  suffix: string = Date.now().toString()
): Promise<SurveyFixtureData> {
  const now = Date.now();
  const daysToMs = (days: number) => days * 24 * 60 * 60 * 1000;

  // Create competition if not provided
  const compId = competitionId || (await createTestCompetition(supabase, suffix));

  const survey: TablesInsert<"surveys"> = {
    competition_id: compId,
    opens_at: new Date(now - daysToMs(2)).toISOString(),
    closes_at: new Date(now + daysToMs(7)).toISOString(),
    slug: `e2e-survey-with-response-${suffix}`,
  };

  const { data: surveyData, error: surveyError } = await supabase
    .from("surveys")
    .insert(survey)
    .select("id, slug")
    .single();

  if (surveyError || !surveyData) {
    throw new Error(`Failed to create survey: ${surveyError?.message || "No data returned"}`);
  }

  if (!surveyData.slug) {
    throw new Error("Survey slug is null");
  }

  // Create a response for this survey
  const surveyResponse: TablesInsert<"survey_responses"> = {
    survey_id: surveyData.id,
    user_id: userId,
    open_feedback: "E2E test response",
    overall_rating: null,
  };

  const { data: responseData, error: responseError } = await supabase
    .from("survey_responses")
    .insert(surveyResponse)
    .select("id")
    .single();

  if (responseError || !responseData) {
    throw new Error(`Failed to create survey response: ${responseError?.message || "No data returned"}`);
  }

  return {
    competitionId: compId,
    surveyId: surveyData.id,
    surveySlug: surveyData.slug,
    surveyResponseId: responseData.id,
  };
}

/**
 * Gets user ID from email (for creating responses)
 */
export async function getUserIdByEmail(supabase: SupabaseTestClient, email: string): Promise<string> {
  // Use Supabase Auth Admin API instead of querying users table
  const { data, error } = await supabase.auth.admin.listUsers();

  if (error) {
    throw new Error(`Failed to list users: ${error.message}`);
  }

  const user = data.users.find((u) => u.email === email);

  if (!user) {
    throw new Error(`User not found for email ${email}`);
  }

  return user.id;
}
