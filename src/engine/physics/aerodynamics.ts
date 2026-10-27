/** Normaliza un ángulo a (−π, π] */
export function wrapAngle(a: number): number {
  const twoPi = Math.PI * 2;
  let r = (a + Math.PI) % twoPi;
  if (r < 0) r += twoPi;
  return r - Math.PI;
}

/** Fd = ½ρv²·Cd·A */
export function dragForce(rho: number, speed: number, cd: number, area: number): number {
  return 0.5 * rho * speed * speed * cd * area;
}

/** Multiplicador del coeficiente de arrastre según el número de Mach (aumento transónico y descenso supersónico). */
const MACH_DRAG: [number, number][] = [
  [0, 1],
  [0.8, 1],
  [0.95, 1.3],
  [1.05, 2.0],
  [1.2, 1.85],
  [1.6, 1.5],
  [2.5, 1.25],
  [4, 1.08],
  [6, 1],
];

export function machDragFactor(mach: number): number {
  if (mach <= MACH_DRAG[0][0]) return MACH_DRAG[0][1];
  for (let i = 1; i < MACH_DRAG.length; i++) {
    const [m1, f1] = MACH_DRAG[i];
    if (mach <= m1) {
      const [m0, f0] = MACH_DRAG[i - 1];
      return f0 + ((f1 - f0) * (mach - m0)) / (m1 - m0);
    }
  }
  return MACH_DRAG[MACH_DRAG.length - 1][1];
}

/** Viento en la dirección x (m/s, negativo = sopla hacia −x). Perfil igual para todos los lanzamientos. */
export function windAt(altitude: number): number {
  const h = Math.max(altitude, 0);
  const surface = 4;
  const jet = 18;
  const shear = surface + (jet - surface) * Math.min(1, h / 10000);
  // Se debilita por encima de la tropopausa y se anula en la estratosfera alta
  const fade = 1 - Math.min(1, Math.max(0, (h - 20000) / 25000));
  return -shear * fade;
}
