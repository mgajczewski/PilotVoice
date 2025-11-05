import type { APIRoute } from "astro";
import { ChangePasswordSchema } from "../../../lib/schemas/authSchemas";

export const prerender = false;

export const PUT: APIRoute = async ({ request, locals }) => {
  try {
    // Check if user is authenticated
    if (!locals.user) {
      return new Response(
        JSON.stringify({ message: "Unauthorized" }),
        {
          status: 401,
          headers: { "Content-Type": "application/json" },
        },
      );
    }

    // Parse and validate request body
    const body = await request.json();
    const validationResult = ChangePasswordSchema.safeParse(body);

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

    const { newPassword } = validationResult.data;

    // Update the user's password
    const { error } = await locals.supabase.auth.updateUser({
      password: newPassword,
    });

    if (error) {
      // Sanitize error messages
      const message = "Failed to change password";

      return new Response(
        JSON.stringify({ message }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        },
      );
    }

    return new Response(
      JSON.stringify({ message: "Password changed successfully" }),
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

