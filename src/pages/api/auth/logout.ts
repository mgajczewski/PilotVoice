import type { APIRoute } from "astro";

export const prerender = false;

export const POST: APIRoute = async ({ locals }) => {
  try {
    const { error } = await locals.supabase.auth.signOut();

    if (error) {
      return new Response(JSON.stringify({ message: "Failed to sign out" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    return new Response(null, { status: 200 });
  } catch (error) {
    return new Response(JSON.stringify({ message: "An unexpected error occurred" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};
