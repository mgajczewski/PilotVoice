import { defineMiddleware } from "astro:middleware";

import { supabaseClient } from "../db/supabase.client.ts";

export const onRequest = defineMiddleware(async (context, next) => {
  context.locals.supabase = supabaseClient;

  // Get the JWT from the Authorization header
  const authHeader = context.request.headers.get("Authorization");
  const token = authHeader?.replace("Bearer ", "");

  if (token) {
    // Verify and get the user from the JWT
    const {
      data: { user },
    } = await supabaseClient.auth.getUser(token);

    context.locals.user = user;
  } else {
    context.locals.user = null;
  }

  return next();
});
