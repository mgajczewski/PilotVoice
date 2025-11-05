import { z } from "zod";

// Registration schema
export const RegisterSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(8, "Password must be at least 8 characters long"),
  recaptchaToken: z.string().min(1, "reCAPTCHA verification is required"),
});

export type RegisterDto = z.infer<typeof RegisterSchema>;

// Login schema
export const LoginSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(1, "Password is required"),
});

export type LoginDto = z.infer<typeof LoginSchema>;

// Forgot password schema
export const ForgotPasswordSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
});

export type ForgotPasswordDto = z.infer<typeof ForgotPasswordSchema>;

// Update password schema
export const UpdatePasswordSchema = z.object({
  password: z.string().min(8, "Password must be at least 8 characters long"),
});

export type UpdatePasswordDto = z.infer<typeof UpdatePasswordSchema>;

// Change password schema (for logged-in users)
export const ChangePasswordSchema = z.object({
  newPassword: z.string().min(8, "Password must be at least 8 characters long"),
});

export type ChangePasswordDto = z.infer<typeof ChangePasswordSchema>;

// Update profile schema
export const UpdateProfileSchema = z
  .object({
    civl_id: z.number().int().positive().optional().nullable(),
    registration_reason: z.string().min(10, "Please provide at least 10 characters").optional().nullable(),
  })
  .refine((data) => data.civl_id !== null || data.registration_reason !== null, {
    message: "Please provide either a CIVL ID or a reason for registration",
  });

export type UpdateProfileDto = z.infer<typeof UpdateProfileSchema>;

