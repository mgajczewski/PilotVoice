import { z } from "zod";

/**
 * Validation schema for surveyId parameter.
 * Ensures surveyId is a positive integer.
 */
export const surveyIdSchema = z.coerce.number().int().positive({
  message: "surveyId must be a positive integer",
});

/**
 * Validation schema for CreateSurveyResponseCommand request body.
 * Validates the optional overall_rating field.
 */
export const createSurveyResponseSchema = z.object({
  overall_rating: z
    .number()
    .int()
    .min(1, { message: "overall_rating must be at least 1" })
    .max(10, { message: "overall_rating must be at most 10" })
    .nullable()
    .optional(),
});

/**
 * Type inferred from the create survey response schema.
 */
export type CreateSurveyResponseInput = z.infer<typeof createSurveyResponseSchema>;

/**
 * Validation schema for updating a survey response.
 * All fields are optional as the user may update only specific fields.
 */
export const updateSurveyResponseSchema = z.object({
  overall_rating: z
    .number()
    .int()
    .min(1, { message: "overall_rating must be at least 1" })
    .max(10, { message: "overall_rating must be at most 10" })
    .nullable()
    .optional(),
  open_feedback: z
    .string()
    .max(10000, { message: "open_feedback must not exceed 10000 characters" })
    .nullable()
    .optional(),
  completed_at: z
    .string()
    .datetime({ message: "completed_at must be a valid ISO 8601 datetime" })
    .nullable()
    .optional(),
});

/**
 * Type inferred from the update survey response schema.
 */
export type UpdateSurveyResponseInput = z.infer<typeof updateSurveyResponseSchema>;

/**
 * Validation schema for responseId path parameter.
 * Ensures responseId is a positive integer.
 */
export const responseIdParamSchema = z.object({
  responseId: z.string().transform((val, ctx) => {
    const parsed = parseInt(val, 10);
    if (isNaN(parsed) || parsed <= 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "responseId must be a positive integer",
      });
      return z.NEVER;
    }
    return parsed;
  }),
});

/**
 * Type inferred from the responseId param schema.
 */
export type ResponseIdParam = z.infer<typeof responseIdParamSchema>;
