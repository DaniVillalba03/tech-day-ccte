import { EARTH_RADIUS, G0 } from "./constants";

/** Gravedad a una altitud dada: g = g₀·(R/(R+h))² */
export function gravityAt(altitude: number): number {
  const r = EARTH_RADIUS / (EARTH_RADIUS + Math.max(altitude, 0));
  return G0 * r * r;
}
