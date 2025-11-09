import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "../../src/db/database.types";

export type SupabaseTestClient = SupabaseClient<Database>;

interface ClearTestDataOptions {
  competitionIds?: number[];
}

export const createSupabaseTestClient = (): SupabaseTestClient => {
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_KEY;

  if (!supabaseUrl) {
    throw new Error("Missing SUPABASE_URL environment variable. Check your .env.test configuration.");
  }

  if (!supabaseKey) {
    throw new Error("Missing SUPABASE_KEY environment variable. Check your .env.test configuration.");
  }

  return createClient<Database>(supabaseUrl, supabaseKey);
};

export const clearTestData = async (client: SupabaseTestClient, options?: ClearTestDataOptions): Promise<void> => {
  const competitionIds = options?.competitionIds?.filter((id): id is number => typeof id === "number");

  if (!competitionIds || competitionIds.length === 0) {
    const { error } = await client.from("competitions").delete().neq("id", 0);

    if (error) {
      throw new Error(`Failed to remove competitions: ${error.message}`);
    }

    return;
  }

  const { error } = await client.from("competitions").delete().in("id", competitionIds);

  if (error) {
    throw new Error(`Failed to remove competitions by ids: ${error.message}`);
  }
};
