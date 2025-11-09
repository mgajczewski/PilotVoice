import type { APIRoute } from "astro";
import { RegisterSchema } from "../../../lib/schemas/authSchemas";
import log from "@/lib/logger";

export const prerender = false;

async function verifyRecaptcha(token: string, secretKey: string): Promise<boolean> {
  try {
    const response = await fetch("https://www.google.com/recaptcha/api/siteverify", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: `secret=${secretKey}&response=${token}`,
    });

    const data = await response.json();
    return data.success && data.score >= 0.5; // reCAPTCHA v3 score threshold
  } catch (error) {
    log.error("reCAPTCHA verification failed:", error);
    return false;
  }
}

export const POST: APIRoute = async ({ request, locals }) => {
  try {
    // Parse and validate request body
    const body = await request.json();
    const validationResult = RegisterSchema.safeParse(body);

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

    const { email, password, recaptchaToken } = validationResult.data;

    // Verify reCAPTCHA token
    const recaptchaSecretKey = import.meta.env.RECAPTCHA_SECRET_KEY;
    const isRecaptchaValid = await verifyRecaptcha(recaptchaToken, recaptchaSecretKey);

    if (!isRecaptchaValid) {
      return new Response(JSON.stringify({ message: "reCAPTCHA verification failed. Please try again." }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Sign up with Supabase
    const { data, error } = await locals.supabase.auth.signUp({
      email,
      password,
    });

    if (error) {
      // Sanitize error messages
      let message = "Registration failed";
      if (error.message.includes("already registered")) {
        message = "An account with this email already exists";
      } else if (error.message.includes("Password")) {
        message = "Password does not meet requirements";
      }

      return new Response(JSON.stringify({ message }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    return new Response(
      JSON.stringify({
        user: {
          id: data.user?.id,
          email: data.user?.email,
        },
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (err) {
    log.error("Unexpected error in register endpoint:", err);
    return new Response(JSON.stringify({ message: "An unexpected error occurred" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};
