import type { LeaderboardEntry, LeaderboardType, NewLeaderboardEntry } from "@/types/leaderboard";

/** Capa de persistencia intercambiable (JSON local o Supabase). */
export interface LeaderboardRepository {
  /** Mejores `limit` registros ordenados de mayor a menor según `type`. */
  list(type: LeaderboardType, limit: number): Promise<LeaderboardEntry[]>;
  add(entry: NewLeaderboardEntry): Promise<LeaderboardEntry>;
}

export const SORT_FIELD: Record<LeaderboardType, "apogee" | "distance"> = {
  apogee: "apogee",
  distance: "distance",
};

export function topEntries(all: LeaderboardEntry[], type: LeaderboardType, limit: number): LeaderboardEntry[] {
  const field = SORT_FIELD[type];
  return [...all]
    .sort((a, b) => b[field] - a[field] || a.createdAt.localeCompare(b.createdAt))
    .slice(0, limit);
}
