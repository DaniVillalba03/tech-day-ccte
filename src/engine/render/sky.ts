/** Altitud (m) a la que el cielo ya es espacio */
const SPACE_ALT = 35000;

type RGB = [number, number, number];
const HORIZON_DAY: RGB = [120, 170, 220];
const ZENITH_DAY: RGB = [36, 75, 143];
const SPACE: RGB = [6, 8, 12];

const mix = (a: RGB, b: RGB, t: number): string =>
  `rgb(${Math.round(a[0] + (b[0] - a[0]) * t)},${Math.round(a[1] + (b[1] - a[1]) * t)},${Math.round(a[2] + (b[2] - a[2]) * t)})`;

// Estrellas fijas en coordenadas normalizadas
const STARS = Array.from({ length: 120 }, (_, i) => {
  const r = (n: number) => {
    const v = Math.sin(i * 12.9898 + n * 78.233) * 43758.5453;
    return v - Math.floor(v);
  };
  return { x: r(1), y: r(2), s: 0.5 + r(3) * 1.2 };
});

export function drawSky(ctx: CanvasRenderingContext2D, w: number, h: number, altitude: number) {
  const t = Math.min(1, Math.max(0, altitude / SPACE_ALT)) ** 0.7;
  const g = ctx.createLinearGradient(0, 0, 0, h);
  g.addColorStop(0, mix(ZENITH_DAY, SPACE, Math.min(1, t * 1.3)));
  g.addColorStop(1, mix(HORIZON_DAY, SPACE, t));
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, w, h);

  const starAlpha = Math.max(0, (t - 0.35) / 0.65);
  if (starAlpha > 0) {
    ctx.fillStyle = `rgba(249,249,247,${starAlpha})`;
    for (const s of STARS) ctx.fillRect(s.x * w, s.y * h, s.s, s.s);
  }
}
