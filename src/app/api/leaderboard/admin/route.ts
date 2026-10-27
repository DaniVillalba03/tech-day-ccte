import { ADMIN_HEADER, adminConfigured, isAdminKeyValid } from "@/lib/adminAuth";

/** GET /api/leaderboard/admin — comprueba la clave de administrador (204 válida, 401 inválida). */
export async function GET(request: Request) {
  if (!adminConfigured()) return Response.json({ error: "Administración no configurada" }, { status: 503 });
  if (!isAdminKeyValid(request.headers.get(ADMIN_HEADER))) return Response.json({ error: "Clave incorrecta" }, { status: 401 });
  return new Response(null, { status: 204 });
}
