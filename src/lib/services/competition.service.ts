import type { SupabaseClient } from "../../db/supabase.client.ts";
import type { PaginatedCompetitionsDto } from "../../types";

interface GetCompetitionsParams {
  page: number;
  pageSize: number;
  sortBy: "name" | "starts_at" | "ends_at" | "city" | "country_code";
  order: "asc" | "desc";
  supabase: SupabaseClient;
}

export const getCompetitions = async ({
  page,
  pageSize,
  sortBy,
  order,
  supabase,
}: GetCompetitionsParams): Promise<PaginatedCompetitionsDto> => {
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  const dataQuery = supabase
    .from("competitions")
    .select("id, name, starts_at, ends_at, city, country_code, tasks_count, participant_count")
    .order(sortBy, { ascending: order === "asc" })
    .range(from, to);

  const countQuery = supabase.from("competitions").select("*", { count: "exact", head: true });

  const [dataResponse, countResponse] = await Promise.all([dataQuery, countQuery]);

  if (dataResponse.error) {
    console.error("Error fetching competitions data:", dataResponse.error);
    throw new Error("Failed to fetch competitions data.");
  }

  if (countResponse.error) {
    console.error("Error fetching competitions count:", countResponse.error);
    throw new Error("Failed to fetch competitions count.");
  }

  const total = countResponse.count ?? 0;

  return {
    data: dataResponse.data,
    pagination: {
      page,
      pageSize,
      total,
    },
  };
};

export const CompetitionService = {
  getCompetitions,
};
