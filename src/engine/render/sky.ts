/** Altitud (m) a la que el cielo ya es espacio */
const SPACE_ALT = 35000;

type RGB = [number, number, number];
const ZENITH_DAY: RGB = [28, 66, 138];
const MID_DAY: RGB = [78, 130, 196];
const HORIZON_DAY: RGB = [236, 204, 170];
const HORIZON_HIGH: RGB = [118, 168, 232];
const SPACE: RGB = [6, 8, 12];

const mix = (a: RGB, b: RGB, t: number): string =>
  `rgb(${Math.round(a[0] + (b[0] - a[0]) * t)},${Math.round(a[1] + (b[1] - a[1]) * t)},${Math.round(a[2] + (b[2] - a[2]) * t)})`;

function rand01(i: number, n: number) {
  const v = Math.sin(i * 12.9898 + n * 78.233) * 43758.5453;
  return v - Math.floor(v);
}

// Estrellas fijas en coordenadas normalizadas: campo general + banda de la Vía Láctea
const STARS = Array.from({ length: 360 }, (_, i) => ({
  x: rand01(i, 1),
  y: rand01(i, 2),
  s: 0.4 + rand01(i, 3) ** 3 * 1.8,
  a: 0.35 + rand01(i, 4) * 0.65,
  tint: rand01(i, 5),
}));
const MILKY = Array.from({ length: 700 }, (_, i) => {
  const t = rand01(i, 11);
  const spread = (rand01(i, 12) + rand01(i, 13) + rand01(i, 14) - 1.5) * 0.16;
  return { x: t, y: 0.15 + t * 0.55 + spread, a: 0.12 + rand01(i, 15) * 0.45, s: 0.5 + rand01(i, 16) * 0.8 };
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
  // El horizonte pasa de cálido (amanecer a nivel del suelo) a azul claro con la altura y luego al negro
  const warm = Math.min(1, altitude / 6000);
  const horizon: RGB = [
    HORIZON_DAY[0] + (HORIZON_HIGH[0] - HORIZON_DAY[0]) * warm,
    HORIZON_DAY[1] + (HORIZON_HIGH[1] - HORIZON_DAY[1]) * warm,
    HORIZON_DAY[2] + (HORIZON_HIGH[2] - HORIZON_DAY[2]) * warm,
  ];
  g.addColorStop(1, mix(horizon, SPACE, Math.min(1, t * 1.15)));
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, w, h);

  const starAlpha = Math.max(0, (t - 0.3) / 0.7);
  if (starAlpha > 0) {
    // Banda de la Vía Láctea
    const band = ctx.createLinearGradient(0, h * 0.1, w, h * 0.8);
    band.addColorStop(0, "rgba(120,130,170,0)");
    band.addColorStop(0.5, `rgba(150,160,205,${0.13 * starAlpha})`);
    band.addColorStop(1, "rgba(120,130,170,0)");
    ctx.fillStyle = band;
    ctx.fillRect(0, 0, w, h);
    for (const m of MILKY) {
      ctx.fillStyle = `rgba(215,222,255,${m.a * starAlpha})`;
      ctx.fillRect(m.x * w, m.y * h, m.s, m.s);
    }
    for (const s of STARS) {
      ctx.fillStyle =
        s.tint < 0.2
          ? `rgba(190,205,255,${s.a * starAlpha})`
          : s.tint > 0.85
            ? `rgba(255,214,170,${s.a * starAlpha})`
            : `rgba(249,249,247,${s.a * starAlpha})`;
      ctx.fillRect(s.x * w, s.y * h, s.s, s.s);
    }
  }

  // Sol bajo con halo, rayos suaves y destellos de lente (se desvanece al subir)
  const sunA = 1 - Math.min(1, t * 1.6);
  if (sunA > 0.02) {
    const sx = w * 0.78;
    const sy = h * 0.34 + t * h * 0.5;
    const halo = ctx.createRadialGradient(sx, sy, 0, sx, sy, h * 0.7);
    halo.addColorStop(0, `rgba(255,238,196,${0.9 * sunA})`);
    halo.addColorStop(0.1, `rgba(255,208,146,${0.5 * sunA})`);
    halo.addColorStop(0.4, `rgba(255,190,130,${0.14 * sunA})`);
    halo.addColorStop(1, "rgba(255,190,120,0)");
    ctx.fillStyle = halo;
    ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = `rgba(255,252,236,${sunA})`;
    ctx.beginPath();
    ctx.arc(sx, sy, Math.max(10, h * 0.026), 0, Math.PI * 2);
    ctx.fill();

    // Destellos a lo largo de la línea sol → centro de la pantalla
    ctx.save();
    ctx.globalCompositeOperation = "lighter";
    const cx = w / 2;
    const cy = h / 2;
    for (const [k, r, a, c] of [
      [0.35, 0.05, 0.12, "255,220,160"],
      [0.62, 0.028, 0.16, "170,210,255"],
      [0.95, 0.07, 0.08, "255,190,140"],
      [1.35, 0.04, 0.1, "190,255,200"],
    ] as const) {
      const fx = sx + (cx - sx) * k;
      const fy = sy + (cy - sy) * k;
      const g = ctx.createRadialGradient(fx, fy, 0, fx, fy, h * r);
      g.addColorStop(0, `rgba(${c},${a * sunA})`);
      g.addColorStop(1, `rgba(${c},0)`);
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(fx, fy, h * r, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }
}
