export interface LeaderboardEntry {
  id: string;
  pilotName: string;
  rocketName: string;
  /** m */
  apogee: number;
  /** m */
  distance: number;
  parts: { noseId: string; tankIds: string[]; engineId: string; finId: string };
  launchAngleDeg: number;
  /** ISO 8601 */
  createdAt: string;
}

export type LeaderboardType = "apogee" | "distance";

export type NewLeaderboardEntry = Omit<LeaderboardEntry, "id" | "createdAt">;
