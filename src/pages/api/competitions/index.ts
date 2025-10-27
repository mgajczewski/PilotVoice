import type { APIContext } from "astro";
import { z } from "zod";
import { CompetitionService } from "../../../lib/services/competition.service";

export const prerender = false;

const querySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(10),
  sortBy: z.enum(["name", "starts_at", "ends_at", "city", "country_code"]).default("starts_at"),
  order: z.enum(["asc", "desc"]).default("desc"),
});

export async function GET(context: APIContext): Promise<Response> {
  //   if (!context.locals.user) {
  //     return new Response(JSON.stringify({ message: "Unauthorized" }), {
  //       status: 401,
  //       headers: { "Content-Type": "application/json" },
  //     });
  //   }

  const url = new URL(context.request.url);
  const queryParams = Object.fromEntries(url.searchParams.entries());
  const validationResult = querySchema.safeParse(queryParams);

  if (!validationResult.success) {
    return new Response(
      JSON.stringify({
        message: "Bad Request",
        errors: validationResult.error.flatten(),
      }),
      {
        status: 400,
        headers: { "Content-Type": "application/json" },
      }
    );
  }

  const { page, pageSize, sortBy, order } = validationResult.data;

  try {
    const result = await CompetitionService.getCompetitions({
      page,
      pageSize,
      sortBy,
      order,
      supabase: context.locals.supabase,
    });
    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error fetching competitions:", error);
    return new Response(JSON.stringify({ message: "Internal Server Error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
