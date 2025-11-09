import type { FullConfig } from "@playwright/test";
import { clearTestData, createSupabaseTestClient } from "./utils/supabase";
import { seedDatabase } from "./utils/seed";
import { createAuthenticatedSession } from "./utils/auth";

export default async function globalSetup(config: FullConfig): Promise<void> {
  const supabase = createSupabaseTestClient();

  // Clear existing test data
  await clearTestData(supabase);

  // Seed database with test data
  const { competitionIds, surveySlugs } = await seedDatabase(supabase);

  // Store IDs in environment for tests to access
  process.env.E2E_COMPETITION_IDS = JSON.stringify(competitionIds);
  process.env.E2E_SURVEY_SLUGS = JSON.stringify(surveySlugs);

  // Setup authenticated state for E2E_USER_EMAIL
  const email = process.env.E2E_USER_EMAIL;
  const password = process.env.E2E_USER_PASSWORD;

  if (!email || !password) {
    throw new Error("E2E_USER_EMAIL and E2E_USER_PASSWORD must be set in .env.test");
  }

  const baseURL = config.projects[0].use.baseURL || "http://localhost:3000";
  await createAuthenticatedSession(baseURL, email, password);
}
