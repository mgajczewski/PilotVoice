import { clearTestData, createSupabaseTestClient } from "./utils/supabase";

export default async function globalTeardown(): Promise<void> {
  const supabase = createSupabaseTestClient();
  const rawCompetitionIds = process.env.E2E_COMPETITION_IDS;

  if (rawCompetitionIds) {
    try {
      const parsedIds = JSON.parse(rawCompetitionIds) as unknown;

      const isNumberArray = (values: unknown[]): values is number[] =>
        values.every((value) => typeof value === "number");

      if (Array.isArray(parsedIds) && isNumberArray(parsedIds)) {
        await clearTestData(supabase, { competitionIds: parsedIds });
        return;
      }
    } catch {
      // noop – fallback to full cleanup below
    }
  }

  await clearTestData(supabase);
}
