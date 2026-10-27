import { createHash, timingSafeEqual } from "node:crypto";

const sha = (s: string) => createHash("sha256").update(s).digest();

/** ¿Hay clave de administrador configurada en el servidor? */
export function adminConfigured(): boolean {
  return Boolean(process.env.ADMIN_PASSWORD);
}

/** Compara la clave recibida con ADMIN_PASSWORD en tiempo constante. */
export function isAdminKeyValid(key: string | null | undefined): boolean {
  const expected = process.env.ADMIN_PASSWORD;
  if (!expected || !key) return false;
  return timingSafeEqual(sha(key), sha(expected));
}

export const ADMIN_HEADER = "x-admin-key";
