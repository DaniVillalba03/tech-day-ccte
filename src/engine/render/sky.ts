/** Altitud (m) a la que el cielo ya es espacio */
const SPACE_ALT = 35000;

type RGB = [number, number, number];
const ZENITH_DAY: RGB = [28, 66, 138];
const MID_DAY: RGB = [78, 130, 196];
const HORIZON_DAY: RGB = [236, 204, 170];
const SPACE: RGB = [6, 8, 12];

const mix = (a: RGB, b: RGB, t: number): string =>
  `rgb(${Math.round(a[0] + (b[0] - a[0]) * t)},${Math.round(a[1] + (b[1] - a[1]) * t)},${Math.round(a[2] + (b[2] - a[2]) * t)})`;

// Estrellas fijas en coordenadas normalizadas
const STARS = Array.from({ length: 140 }, (_, i) => {
  const r = (n: number) => {
    const v = Math.sin(i * 12.9898 + n * 78.233) * 43758.5453;
    return v - Math.floor(v);
  };
  return { x: r(1), y: r(2), s: 0.5 + r(3) * 1.2 };
});

/** Fracción de "espacio" (0 = cielo diurno, 1 = negro) según la altitud. */
export function spaceFraction(altitude: number): number {
  return Math.min(1, Math.max(0, altitude / SPACE_ALT)) ** 0.7;
}

/** Cielo de amanecer: cenit azul profundo y horizonte cálido; se oscurece hacia el espacio. */
export function drawSky(ctx: CanvasRenderingContext2D, w: number, h: number, altitude: number) {
  const t = spaceFraction(altitude);
  const g = ctx.createLinearGradient(0, 0, 0, h);
  g.addColorStop(0, mix(ZENITH_DAY, SPACE, Math.min(1, t * 1.3)));
  g.addColorStop(0.55, mix(MID_DAY, SPACE, t));
  g.addColorStop(1, mix(HORIZON_DAY, SPACE, t));
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, w, h);

  const starAlpha = Math.max(0, (t - 0.35) / 0.65);
  if (starAlpha > 0) {
    ctx.fillStyle = `rgba(249,249,247,${starAlpha})`;
    for (const s of STARS) ctx.fillRect(s.x * w, s.y * h, s.s, s.s);
  }

  // Sol bajo con halo (se desvanece al subir)
  const sunA = 1 - Math.min(1, t * 1.6);
  if (sunA > 0.02) {
    const sx = w * 0.78;
    const sy = h * 0.34 + t * h * 0.5;
    const halo = ctx.createRadialGradient(sx, sy, 0, sx, sy, h * 0.55);
    halo.addColorStop(0, `rgba(255,236,190,${0.85 * sunA})`);
    halo.addColorStop(0.12, `rgba(255,205,140,${0.45 * sunA})`);
    halo.addColorStop(1, "rgba(255,190,120,0)");
    ctx.fillStyle = halo;
    ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = `rgba(255,250,230,${sunA})`;
    ctx.beginPath();
    ctx.arc(sx, sy, Math.max(10, h * 0.025), 0, Math.PI * 2);
    ctx.fill();
  }
}
