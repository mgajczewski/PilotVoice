import type { APIRoute } from "astro";
import { UpdatePasswordSchema } from "../../../lib/schemas/authSchemas";

export const prerender = false;

export const POST: APIRoute = async ({ request, locals }) => {
  try {
    // Parse and validate request body
    const body = await request.json();
    const validationResult = UpdatePasswordSchema.safeParse(body);

    if (!validationResult.success) {
      return new Response(
        JSON.stringify({
          message: validationResult.error.errors[0]?.message || "Validation failed",
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        },
      );
    }

    const { password } = validationResult.data;

    // Update the user's password
    // This endpoint should be called when the user has a valid recovery token
    const { error } = await locals.supabase.auth.updateUser({
      password,
    });

    if (error) {
      // Sanitize error messages
      const message = error.message.includes("session") 
        ? "Session expired. Please request a new password reset link." 
        : "Failed to update password";

      return new Response(
        JSON.stringify({ message }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        },
      );
    }

    return new Response(
      JSON.stringify({ message: "Password updated successfully" }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      },
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ message: "An unexpected error occurred" }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      },
    );
  }
};

