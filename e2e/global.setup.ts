import type { FullConfig } from "@playwright/test";
import type { TablesInsert } from "../src/db/database.types";
import { clearTestData, createSupabaseTestClient } from "./utils/supabase";

const daysToMs = (days: number) => days * 24 * 60 * 60 * 1000;

const buildCompetitions = (suffix: number): TablesInsert<"competitions">[] => {
  const now = Date.now();

  return [
    {
      name: `E2E Test Competition Alpha ${suffix}`,
      city: "Zakopane",
      country_code: "PL",
      starts_at: new Date(now - daysToMs(14)).toISOString(),
      ends_at: new Date(now - daysToMs(12)).toISOString(),
      participant_count: 48,
      tasks_count: 5,
    },
    {
      name: `E2E Test Competition Bravo ${suffix}`,
      city: "Liptovsky Mikulas",
      country_code: "SK",
      starts_at: new Date(now - daysToMs(7)).toISOString(),
      ends_at: new Date(now - daysToMs(3)).toISOString(),
      participant_count: 52,
      tasks_count: 4,
    },
    {
      name: `E2E Test Competition Charlie ${suffix}`,
      city: "Frydek Mistek",
      country_code: "CZ",
      starts_at: new Date(now + daysToMs(3)).toISOString(),
      ends_at: new Date(now + daysToMs(7)).toISOString(),
      participant_count: 60,
      tasks_count: 6,
    },
  ];
};

const buildSurveys = (competitionIds: number[], suffix: number): TablesInsert<"surveys">[] => {
  const now = Date.now();

  return competitionIds.slice(0, 2).map((competitionId, index) => ({
    competition_id: competitionId,
    opens_at: new Date(now - daysToMs(2)).toISOString(),
    closes_at: new Date(now + daysToMs(5 + index)).toISOString(),
    slug: `e2e-test-survey-${index + 1}-${suffix}`,
  }));
};

export default async function globalSetup(_config: FullConfig): Promise<void> {
  const supabase = createSupabaseTestClient();
  const suffix = Date.now();

  await clearTestData(supabase);

  const competitions = buildCompetitions(suffix);
  const { data: insertedCompetitions, error: competitionsError } = await supabase
    .from("competitions")
    .insert(competitions)
    .select("id");

  if (competitionsError) {
    throw new Error(`Failed to insert competitions: ${competitionsError.message}`);
  }

  if (!insertedCompetitions || insertedCompetitions.length !== competitions.length) {
    throw new Error("Inserted competitions payload is missing or incomplete.");
  }

  const competitionIds = insertedCompetitions.map((competition) => competition.id);
  const surveys = buildSurveys(competitionIds, suffix);

  if (surveys.length > 0) {
    const { error: surveysError } = await supabase.from("surveys").insert(surveys);

    if (surveysError) {
      throw new Error(`Failed to insert surveys: ${surveysError.message}`);
    }
  }

  process.env.E2E_COMPETITION_IDS = JSON.stringify(competitionIds);
}
