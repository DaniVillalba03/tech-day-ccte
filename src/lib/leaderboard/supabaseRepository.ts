import type { LeaderboardEntry, LeaderboardType, NewLeaderboardEntry } from "@/types/leaderboard";
import { SORT_FIELD, type LeaderboardRepository } from "./repository";

interface Row {
  id: string;
  pilot_name: string;
  rocket_name: string;
  apogee: number;
  distance: number;
  parts: LeaderboardEntry["parts"];
  launch_angle_deg: number;
  created_at: string;
}

const toEntry = (r: Row): LeaderboardEntry => ({
  id: r.id,
  pilotName: r.pilot_name,
  rocketName: r.rocket_name,
  apogee: r.apogee,
  distance: r.distance,
  parts: r.parts,
  launchAngleDeg: r.launch_angle_deg,
  createdAt: r.created_at,
});

/**
 * Repositorio Supabase vía REST (PostgREST), sin dependencias extra.
 * Usa la service role key: solo debe ejecutarse en el servidor (Route Handlers).
 */
export class SupabaseLeaderboardRepository implements LeaderboardRepository {
  constructor(
    private url: string,
    private key: string,
    private table = "leaderboard_entries",
  ) {}

  private headers(extra: Record<string, string> = {}) {
    return { apikey: this.key, Authorization: `Bearer ${this.key}`, "Content-Type": "application/json", ...extra };
  }

  async list(type: LeaderboardType, limit: number) {
    const q = `select=*&order=${SORT_FIELD[type]}.desc,created_at.asc&limit=${limit}`;
    const res = await fetch(`${this.url}/rest/v1/${this.table}?${q}`, { headers: this.headers(), cache: "no-store" });
    if (!res.ok) throw new Error(`Supabase list falló (${res.status})`);
    return ((await res.json()) as Row[]).map(toEntry);
  }

  async add(entry: NewLeaderboardEntry) {
    const res = await fetch(`${this.url}/rest/v1/${this.table}`, {
      method: "POST",
      headers: this.headers({ Prefer: "return=representation" }),
      body: JSON.stringify({
        pilot_name: entry.pilotName,
        rocket_name: entry.rocketName,
        apogee: entry.apogee,
        distance: entry.distance,
        parts: entry.parts,
        launch_angle_deg: entry.launchAngleDeg,
      }),
    });
    if (!res.ok) throw new Error(`Supabase insert falló (${res.status})`);
    const [row] = (await res.json()) as Row[];
    return toEntry(row);
  }
}
