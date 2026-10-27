import type { LeaderboardEntry, NewLeaderboardEntry } from "@/types/leaderboard";

const LOCAL_KEY = "leaderboard-local";

function saveLocal(entry: NewLeaderboardEntry): LeaderboardEntry {
  const full: LeaderboardEntry = { ...entry, id: crypto.randomUUID(), createdAt: new Date().toISOString() };
  try {
    const list: LeaderboardEntry[] = JSON.parse(localStorage.getItem(LOCAL_KEY) ?? "[]");
    list.push(full);
    localStorage.setItem(LOCAL_KEY, JSON.stringify(list));
  } catch {
    /* almacenamiento no disponible */
  }
  return full;
}

/**
 * Envía el registro a /api/leaderboard. Si la API no responde (p. ej. aún no existe
 * en desarrollo), lo guarda en localStorage para no perder la marca.
 */
export async function submitEntry(entry: NewLeaderboardEntry): Promise<{ entry: LeaderboardEntry; remote: boolean }> {
  try {
    const res = await fetch("/api/leaderboard", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(entry),
    });
    if (res.ok) return { entry: (await res.json()) as LeaderboardEntry, remote: true };
  } catch {
    /* sin red o sin API */
  }
  return { entry: saveLocal(entry), remote: false };
}
