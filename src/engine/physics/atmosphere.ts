import { RHO0, SCALE_HEIGHT } from "./constants";

/** Densidad atmosférica exponencial: ρ = 1.225·e^(−h/8500) */
export function airDensity(altitude: number): number {
  return RHO0 * Math.exp(-Math.max(altitude, 0) / SCALE_HEIGHT);
}
