import type { APIRoute } from "astro";
import { getCollection } from "astro:content";

export const prerender = false;

export const ALL: APIRoute = async () => {
  try {
    const incidents = await getCollection("incidents");

    return new Response(JSON.stringify(incidents.map((incident) => incident.data)), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
      },
    });
  } catch {
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: {
        "Content-Type": "application/json",
      },
    });
  }
};
