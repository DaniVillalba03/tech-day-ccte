import { JsonLeaderboardRepository } from "./jsonRepository";
import type { LeaderboardRepository } from "./repository";
import { SupabaseLeaderboardRepository } from "./supabaseRepository";

let instance: LeaderboardRepository | null = null;

/** Supabase si hay SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY; si no, JSON local. */
export function getLeaderboardRepository(): LeaderboardRepository {
  if (!instance) {
    const url = process.env.SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
    instance = url && key ? new SupabaseLeaderboardRepository(url.replace(/\/$/, ""), key) : new JsonLeaderboardRepository();
  }
  return instance;
}
