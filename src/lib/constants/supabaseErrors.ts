/**
 * Supabase PostgreSQL error codes
 * @see https://postgrest.org/en/stable/references/errors.html
 */
export const SUPABASE_ERROR_CODES = {
  /** No rows returned (404 equivalent) */
  NOT_FOUND: "PGRST116",
  /** Unique constraint violation */
  UNIQUE_VIOLATION: "23505",
} as const;

/**
 * Type for Supabase error codes
 */
export type SupabaseErrorCode = (typeof SUPABASE_ERROR_CODES)[keyof typeof SUPABASE_ERROR_CODES];
