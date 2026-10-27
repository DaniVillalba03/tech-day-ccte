import { ALL_PARTS, MAX_TANKS } from "@/data/parts";
import type { NewLeaderboardEntry } from "@/types/leaderboard";

const MAX_NAME = 30;
/** Límites de plausibilidad (m) para descartar valores absurdos o manipulados */
const MAX_APOGEE = 1_000_000;
const MAX_DISTANCE = 5_000_000;

const partIds = new Set(ALL_PARTS.map((p) => p.id));
const idOf = (category: string) => new Set(ALL_PARTS.filter((p) => p.category === category).map((p) => p.id));
const NOSES = idOf("nose");
const TANKS = idOf("tank");
const ENGINES = idOf("engine");
const FINS = idOf("fin");

type Result = { ok: true; value: NewLeaderboardEntry } | { ok: false; error: string };

const isObj = (v: unknown): v is Record<string, unknown> => typeof v === "object" && v !== null && !Array.isArray(v);
const cleanName = (v: unknown): string | null => {
  if (typeof v !== "string") return null;
  const s = v.replace(/[\u0000-\u001f\u007f]/g, "").trim();
  return s.length >= 1 && s.length <= MAX_NAME ? s : null;
};
const inRange = (v: unknown, max: number): v is number =>
  typeof v === "number" && Number.isFinite(v) && v >= 0 && v <= max;

/** Valida y normaliza el cuerpo de un POST /api/leaderboard. */
export function validateNewEntry(body: unknown): Result {
  if (!isObj(body)) return { ok: false, error: "Cuerpo inválido" };

  const pilotName = cleanName(body.pilotName);
  if (!pilotName) return { ok: false, error: `pilotName debe tener entre 1 y ${MAX_NAME} caracteres` };
  const rocketName = cleanName(body.rocketName);
  if (!rocketName) return { ok: false, error: `rocketName debe tener entre 1 y ${MAX_NAME} caracteres` };

  if (!inRange(body.apogee, MAX_APOGEE)) return { ok: false, error: "apogee fuera de rango" };
  if (!inRange(body.distance, MAX_DISTANCE)) return { ok: false, error: "distance fuera de rango" };

  const angle = body.launchAngleDeg;
  if (typeof angle !== "number" || !Number.isFinite(angle) || angle < 15 || angle > 90)
    return { ok: false, error: "launchAngleDeg debe estar entre 15 y 90" };

  const parts = body.parts;
  if (!isObj(parts)) return { ok: false, error: "parts inválido" };
  const { noseId, tankIds, engineId, finId } = parts;
  if (typeof noseId !== "string" || !NOSES.has(noseId)) return { ok: false, error: "noseId desconocido" };
  if (typeof engineId !== "string" || !ENGINES.has(engineId)) return { ok: false, error: "engineId desconocido" };
  if (typeof finId !== "string" || !FINS.has(finId)) return { ok: false, error: "finId desconocido" };
  if (
    !Array.isArray(tankIds) ||
    tankIds.length < 1 ||
    tankIds.length > MAX_TANKS ||
    !tankIds.every((t): t is string => typeof t === "string" && TANKS.has(t) && partIds.has(t))
  )
    return { ok: false, error: "tankIds inválido" };

  return {
    ok: true,
    value: {
      pilotName,
      rocketName,
      apogee: body.apogee,
      distance: body.distance,
      parts: { noseId, tankIds: [...tankIds], engineId, finId },
      launchAngleDeg: angle,
    },
  };
}
