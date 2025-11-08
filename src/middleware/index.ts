import { defineMiddleware } from "astro:middleware";
import { createSupabaseServerInstance } from "../db/supabase.client.ts";

// Public paths that don't require authentication
const PUBLIC_PATHS = [
  // Auth pages
  "/login",
  "/register",
  "/forgot-password",
  "/update-password",
  "/debug-env",
  // Auth API endpoints
  "/api/auth/login",
  "/api/auth/register",
  "/api/auth/logout",
  "/api/auth/forgot-password",
  "/api/auth/update-password",
  // Public pages
  "/",
];

// Paths that start with these prefixes don't require authentication
const PUBLIC_PATH_PREFIXES = ["/api/", "/surveys/"];

// Paths that should be accessible only when not authenticated
const GUEST_ONLY_PATHS = ["/login", "/register", "/forgot-password"];

export const onRequest = defineMiddleware(async ({ locals, cookies, url, request, redirect }, next) => {
  // Create Supabase server instance for this request
  const supabase = createSupabaseServerInstance({
    cookies,
    headers: request.headers,
  });

  // Store the Supabase client in locals for use in API routes and pages
  locals.supabase = supabase;

  // Get user session
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // If user exists, get their role from the profiles table
  if (user) {
    const { data: profile } = await supabase.from("profiles").select("role").eq("user_id", user.id).single();

    locals.user = {
      id: user.id,
      email: user.email ?? "",
      role: profile?.role ?? "user",
    };

    // If user is authenticated and tries to access guest-only pages, redirect to home
    if (GUEST_ONLY_PATHS.includes(url.pathname)) {
      return redirect("/");
    }
  } else {
    locals.user = null;

    // Check if the current path requires authentication
    const isPublicPath =
      PUBLIC_PATHS.some((path) => url.pathname === path) ||
      PUBLIC_PATH_PREFIXES.some((prefix) => url.pathname.startsWith(prefix));

    if (!isPublicPath) {
      // Redirect to login with the original URL as redirect_to parameter
      const redirectUrl = new URL("/login", url.origin);
      redirectUrl.searchParams.set("redirect_to", url.pathname + url.search);
      return redirect(redirectUrl.toString());
    }
  }

  return next();
});
