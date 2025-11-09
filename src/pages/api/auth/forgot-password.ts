import type { APIRoute } from "astro";
import { ForgotPasswordSchema } from "../../../lib/schemas/authSchemas";
import log from "@/lib/logger";

export const prerender = false;

export const POST: APIRoute = async ({ request, locals, url }) => {
  try {
    // Parse and validate request body
    const body = await request.json();
    const validationResult = ForgotPasswordSchema.safeParse(body);

    if (!validationResult.success) {
      return new Response(
        JSON.stringify({
          message: validationResult.error.errors[0]?.message || "Validation failed",
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    const { email } = validationResult.data;

    // Create the redirect URL for password reset
    const redirectUrl = new URL("/update-password", url.origin);

    // Request password reset
    const { error } = await locals.supabase.auth.resetPasswordForEmail(email, {
      redirectTo: redirectUrl.toString(),
    });

    // Always return 200 to avoid disclosing whether the email exists
    // This is a security best practice to prevent email enumeration
    if (error) {
      log.error("Password reset error:", error);
    }

    return new Response(
      JSON.stringify({
        message: "If an account exists with that email, you will receive password reset instructions.",
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    return new Response(JSON.stringify({ message: "An unexpected error occurred" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};
