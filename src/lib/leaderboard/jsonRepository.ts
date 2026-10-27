import { promises as fs } from "node:fs";
import path from "node:path";
import type { LeaderboardEntry, LeaderboardType, NewLeaderboardEntry } from "@/types/leaderboard";
import { topEntries, type LeaderboardRepository } from "./repository";

/** Fallback de desarrollo: guarda en un archivo JSON local (`.data/leaderboard.json`). */
export class JsonLeaderboardRepository implements LeaderboardRepository {
  private writeQueue: Promise<unknown> = Promise.resolve();

  constructor(private file = path.join(process.cwd(), ".data", "leaderboard.json")) {}

  private async read(): Promise<LeaderboardEntry[]> {
    try {
      const data = JSON.parse(await fs.readFile(this.file, "utf8"));
      return Array.isArray(data) ? data : [];
    } catch (e) {
      if ((e as NodeJS.ErrnoException).code === "ENOENT") return [];
      throw e;
    }
  }

  async list(type: LeaderboardType, limit: number) {
    return topEntries(await this.read(), type, limit);
  }

  add(entry: NewLeaderboardEntry): Promise<LeaderboardEntry> {
    // Serializa escrituras para no perder registros concurrentes
    const run = this.writeQueue.then(async () => {
      const all = await this.read();
      const full: LeaderboardEntry = { ...entry, id: crypto.randomUUID(), createdAt: new Date().toISOString() };
      all.push(full);
      await fs.mkdir(path.dirname(this.file), { recursive: true });
      await fs.writeFile(this.file, JSON.stringify(all, null, 2), "utf8");
      return full;
    });
    this.writeQueue = run.catch(() => undefined);
    return run;
  }

  remove(id: string): Promise<boolean> {
    const run = this.writeQueue.then(async () => {
      const all = await this.read();
      const next = all.filter((e) => e.id !== id);
      if (next.length === all.length) return false;
      await fs.writeFile(this.file, JSON.stringify(next, null, 2), "utf8");
      return true;
    });
    this.writeQueue = run.catch(() => undefined);
    return run;
  }
}
