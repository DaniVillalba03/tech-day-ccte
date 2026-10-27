import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import type { NewLeaderboardEntry } from "@/types/leaderboard";
import { JsonLeaderboardRepository } from "./jsonRepository";

let dir: string;
let repo: JsonLeaderboardRepository;

beforeEach(async () => {
  dir = await mkdtemp(path.join(tmpdir(), "lb-"));
  repo = new JsonLeaderboardRepository(path.join(dir, "sub", "lb.json"));
});
afterEach(() => rm(dir, { recursive: true, force: true }));

const entry = (pilot: string, apogee: number, distance: number): NewLeaderboardEntry => ({
  pilotName: pilot,
  rocketName: "R",
  apogee,
  distance,
  parts: { noseId: "nose-cone", tankIds: ["tank-s"], engineId: "eng-spark", finId: "fin-small" },
  launchAngleDeg: 90,
});

describe("JsonLeaderboardRepository", () => {
  it("devuelve vacío si el archivo no existe", async () => {
    expect(await repo.list("apogee", 10)).toEqual([]);
  });

  it("ordena por apogeo y por distancia de forma independiente", async () => {
    await repo.add(entry("A", 100, 900));
    await repo.add(entry("B", 300, 100));
    await repo.add(entry("C", 200, 500));
    expect((await repo.list("apogee", 10)).map((e) => e.pilotName)).toEqual(["B", "C", "A"]);
    expect((await repo.list("distance", 10)).map((e) => e.pilotName)).toEqual(["A", "C", "B"]);
  });

  it("respeta el límite y asigna id y fecha", async () => {
    for (let i = 0; i < 15; i++) await repo.add(entry(`P${i}`, i, i));
    const top = await repo.list("apogee", 10);
    expect(top).toHaveLength(10);
    expect(top[0].pilotName).toBe("P14");
    expect(top[0].id).toBeTruthy();
    expect(Date.parse(top[0].createdAt)).not.toBeNaN();
  });

  it("no pierde registros con escrituras concurrentes", async () => {
    await Promise.all(Array.from({ length: 20 }, (_, i) => repo.add(entry(`P${i}`, i, i))));
    expect(await repo.list("apogee", 50)).toHaveLength(20);
  });

  it("elimina un registro y devuelve false si no existe", async () => {
    const a = await repo.add(entry("A", 1, 1));
    await repo.add(entry("B", 2, 2));
    expect(await repo.remove(a.id)).toBe(true);
    expect(await repo.remove(a.id)).toBe(false);
    expect((await repo.list("apogee", 10)).map((e) => e.pilotName)).toEqual(["B"]);
  });
});
