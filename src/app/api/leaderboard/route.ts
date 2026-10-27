import { ADMIN_HEADER, adminConfigured, isAdminKeyValid } from "@/lib/adminAuth";
import { getLeaderboardRepository } from "@/lib/leaderboard";
import { validateNewEntry } from "@/lib/validation";
import type { LeaderboardType } from "@/types/leaderboard";

const LIMITS = [10, 50];

/** GET /api/leaderboard?type=apogee|distance&limit=10|50 */
export async function GET(request: Request) {
  const params = new URL(request.url).searchParams;
  const type = params.get("type") ?? "apogee";
  const limit = Number(params.get("limit") ?? 10);
  if (type !== "apogee" && type !== "distance") return Response.json({ error: "type inválido" }, { status: 400 });
  if (!LIMITS.includes(limit)) return Response.json({ error: "limit debe ser 10 o 50" }, { status: 400 });

  try {
    const entries = await getLeaderboardRepository().list(type as LeaderboardType, limit);
    return Response.json(entries);
  } catch (e) {
    console.error("leaderboard GET", e);
    return Response.json({ error: "No se pudo leer el ranking" }, { status: 500 });
  }
}

/** POST /api/leaderboard — guarda una marca validada. */
export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "JSON inválido" }, { status: 400 });
  }
  const parsed = validateNewEntry(body);
  if (!parsed.ok) return Response.json({ error: parsed.error }, { status: 400 });

  try {
    const entry = await getLeaderboardRepository().add(parsed.value);
    return Response.json(entry, { status: 201 });
  } catch (e) {
    console.error("leaderboard POST", e);
    return Response.json({ error: "No se pudo guardar la marca" }, { status: 500 });
  }
}

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** DELETE /api/leaderboard?id=<uuid> — solo administrador (cabecera x-admin-key). */
export async function DELETE(request: Request) {
  if (!adminConfigured()) return Response.json({ error: "Administración no configurada" }, { status: 503 });
  if (!isAdminKeyValid(request.headers.get(ADMIN_HEADER))) return Response.json({ error: "No autorizado" }, { status: 401 });

  const id = new URL(request.url).searchParams.get("id") ?? "";
  if (!UUID.test(id)) return Response.json({ error: "id inválido" }, { status: 400 });

  try {
    const removed = await getLeaderboardRepository().remove(id);
    return removed ? new Response(null, { status: 204 }) : Response.json({ error: "No existe" }, { status: 404 });
  } catch (e) {
    console.error("leaderboard DELETE", e);
    return Response.json({ error: "No se pudo eliminar la marca" }, { status: 500 });
  }
}
