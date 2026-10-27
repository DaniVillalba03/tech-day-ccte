/** Fd = ½ρv²·Cd·A */
export function dragForce(rho: number, speed: number, cd: number, area: number): number {
  return 0.5 * rho * speed * speed * cd * area;
}

/** Normaliza un ángulo a (−π, π] */
export function wrapAngle(a: number): number {
  const twoPi = Math.PI * 2;
  let r = (a + Math.PI) % twoPi;
  if (r < 0) r += twoPi;
  return r - Math.PI;
}

/**
 * Tasa (1/s) con la que las aletas alinean el cohete con el viento relativo.
 * Crece con la presión dinámica q = ½ρv² y satura; produce el giro gravitacional.
 */
export function stabilityRate(stabilityFactor: number, rho: number, speed: number): number {
  const q = 0.5 * rho * speed * speed;
  return stabilityFactor * 1.5 * Math.min(1, q / 500);
}
