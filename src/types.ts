import type { Tables, TablesInsert, TablesUpdate } from "./db/database.types";

/**
 * =================================================================================
 *
 * UTILITY TYPES
 *
 * =================================================================================
 */

/**
 * A generic type for paginated API responses.
 * @template T The type of the data items in the response.
 */
export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    pageSize: number;
    total: number;
  };
}

/**
 * =================================================================================
 *
 * PROFILE DTOs & COMMANDS
 *
 * =================================================================================
 */

/**
 * DTO for a user's profile.
 * Represents a row from the `profiles` table.
 */
export type ProfileDto = Tables<"profiles">;

/**
 * Command model for updating a user's profile.
 * Contains a subset of updatable fields from the `profiles` table.
 */
export type UpdateProfileCommand = Pick<TablesUpdate<"profiles">, "civl_id" | "registration_reason">;

/**
 * =================================================================================
 *
 * COMPETITION DTOs & COMMANDS
 *
 * =================================================================================
 */

/**
 * DTO for a competition in a list view.
 * This is a subset of the full competition details.
 */
export type CompetitionDto = Pick<
  Tables<"competitions">,
  "id" | "name" | "starts_at" | "ends_at" | "city" | "country_code" | "tasks_count" | "participant_count"
>;

/**
 * DTO for a paginated list of competitions.
 */
export type PaginatedCompetitionsDto = PaginatedResponse<CompetitionDto>;

/**
 * DTO for the full details of a single competition.
 * Represents a complete row from the `competitions` table.
 */
export type CompetitionDetailsDto = Tables<"competitions">;

/**
 * Command model for creating a new competition.
 * Contains required fields from the `competitions` table for insertion.
 */
export type CreateCompetitionCommand = Pick<
  TablesInsert<"competitions">,
  "name" | "starts_at" | "ends_at" | "city" | "country_code" | "tasks_count" | "participant_count"
>;

/**
 * Command model for updating an existing competition.
 * All fields are optional.
 */
export type UpdateCompetitionCommand = TablesUpdate<"competitions">;

/**
 * =================================================================================
 *
 * SURVEY DTOs & COMMANDS
 *
 * =================================================================================
 */

/**
 * DTO for a survey.
 * Represents a row from the `surveys` table.
 */
export type SurveyDto = Tables<"surveys">;

/**
 * Command model for creating a new survey.
 */
export type CreateSurveyCommand = Pick<TablesInsert<"surveys">, "competition_id" | "opens_at" | "closes_at" | "slug">;

/**
 * Command model for updating an existing survey.
 * All fields are optional.
 */
export type UpdateSurveyCommand = TablesUpdate<"surveys">;

/**
 * =================================================================================
 *
 * SURVEY RESPONSE DTOs & COMMANDS
 *
 * =================================================================================
 */

/**
 * DTO for a survey response.
 * Represents a row from the `survey_responses` table.
 */
export type SurveyResponseDto = Tables<"survey_responses">;

/**
 * Command model for creating a new survey response (i.e., starting a survey).
 * Can be an empty object or contain an initial rating.
 */
export type CreateSurveyResponseCommand = Partial<Pick<TablesInsert<"survey_responses">, "overall_rating">>;

/**
 * Command model for updating a survey response (i.e., saving progress).
 */
export type UpdateSurveyResponseCommand = Pick<
  TablesUpdate<"survey_responses">,
  "overall_rating" | "open_feedback" | "completed_at"
>;

/**
 * =================================================================================
 *
 * ADMIN DTOs & COMMANDS
 *
 * =================================================================================
 */

/**
 * DTO for a user view in the admin panel.
 * This is a composite type, combining Supabase auth user info with the user's profile.
 * The auth-related fields are defined here as they are not in `database.types.ts`.
 */
export interface AdminUserViewDto {
  id: string; // from auth.users
  email: string; // from auth.users
  created_at: string; // from auth.users
  profile: ProfileDto;
}

/**
 * DTO for a paginated list of users in the admin panel.
 */
export type PaginatedAdminUserViewDto = PaginatedResponse<AdminUserViewDto>;

/**
 * Command model for updating a user's role.
 */
export type UpdateUserRoleCommand = Pick<TablesUpdate<"profiles">, "role">;

/**
 * =================================================================================
 *
 * BUSINESS LOGIC DTOs
 *
 * =================================================================================
 */

/**
 * DTO for the aggregated results of a survey.
 * This is a custom data structure for reporting purposes.
 */
export interface SurveyResultsDto {
  surveyId: number;
  competitionName: string;
  participantCount: number;
  responsesCompleted: number;
  responsesAbandoned: number;
  averageOverallRating: number;
  /** The completion rate of the open feedback field, as a percentage. */
  openFeedbackCompletionRate: number;
}
