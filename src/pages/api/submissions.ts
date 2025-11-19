import type { APIRoute } from "astro";

export const POST: APIRoute = async ({ request }) => {
  try {
    let body;
    try {
      body = await request.json();
    } catch {
      return new Response(JSON.stringify({ error: "The body must be a JSON object with a text property." }), {
        status: 400,
        headers: {
          "Content-Type": "application/json",
        },
      });
    }

    const { text } = body;

    if (!text || typeof text !== "string" || text.trim().length === 0) {
      return new Response(JSON.stringify({ error: "The text property is required and must be a non-empty string." }), {
        status: 400,
        headers: {
          "Content-Type": "application/json",
        },
      });
    }

    // Generate a random submission number (simulating creation)
    const submissionNumber = Math.floor(Math.random() * 5) + 1;

    return new Response(
      JSON.stringify({
        message: "Submission created successfully",
        submissionId: submissionNumber.toString(),
      }),
      {
        status: 201,
        headers: {
          "Content-Type": "application/json",
          Location: `/api/submissions/${submissionNumber}`,
        },
      }
    );
  } catch {
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: {
        "Content-Type": "application/json",
      },
    });
  }
};
