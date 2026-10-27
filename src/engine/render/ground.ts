import { EARTH_RADIUS } from "@/engine/physics/constants";
import type { Camera } from "./camera";

const STEPS = [10, 50, 100, 500, 1000, 5000, 10000, 50000, 100000];

/** Línea de costa: a partir de aquí (hacia +x) está el océano Atlántico */
export const COAST_X = 2400;
const BEACH_W = 220;
const SEA_LEVEL = -0.7;
/** Espesor visible de la atmósfera (m) para el halo del horizonte */
const ATMOSPHERE_H = 90_000;

const hash = (n: number) => {
  const v = Math.sin(n * 127.1 + 311.7) * 43758.5453;
  return v - Math.floor(v);
};

function fmtDist(m: number) {
  return m >= 1000 ? `${m / 1000} km` : `${m} m`;
}

/**
 * Caída de la superficie por la curvatura terrestre a una distancia x del origen (m). Con la altitud se
 * exagera para imitar el gran angular de las cámaras reales y que la curvatura sea visible.
 */
let curvatureBoost = 1;
export const curvatureDrop = (x: number) => (x * x * curvatureBoost) / (2 * EARTH_RADIUS);

/** Relieve (m): plano alrededor de la plataforma, dunas suaves lejos, playa y mar. */
export function terrainHeight(x: number): number {
  if (x >= COAST_X + BEACH_W) return SEA_LEVEL;
  const amp = Math.min(1, Math.max(0, (Math.abs(x) - 250) / 500)) * 1.1;
  const dunes = amp * (Math.sin(x * 0.013) * 0.5 + Math.sin(x * 0.047 + 1.3) * 0.3 + Math.sin(x * 0.19) * 0.15);
  if (x > COAST_X) {
    const t = (x - COAST_X) / BEACH_W;
    return dunes * (1 - t) + SEA_LEVEL * t * t;
  }
  return dunes;
}

/**
 * Superficie terrestre: terreno con vegetación, playa y océano con oleaje; sigue la curvatura de la Tierra
 * (visible al subir), con el halo azul de la atmósfera en el horizonte. También dibuja los marcadores de distancia.
 */
export function drawGround(ctx: CanvasRenderingContext2D, cam: Camera, altitude: number, time: number) {
  const { width: W, height: H, scale } = cam;
  const hh = Math.min(1, Math.max(0, altitude / 60000));
  curvatureBoost = 1 + 18 * hh * hh * (3 - 2 * hh);
  const left = cam.x - W / 2 / scale;

  // Borde superior de la superficie
  const stepPx = scale > 1.5 ? 3 : 6;
  const pts: [number, number][] = [];
  let minY = Infinity;
  for (let sx = -stepPx; sx <= W + stepPx; sx += stepPx) {
    const wx = left + (sx + stepPx) / scale;
    let wy = terrainHeight(wx) - curvatureDrop(wx);
    if (wx > COAST_X + BEACH_W && scale > 0.4) wy += 0.22 * Math.sin(wx * 0.45 + time * 1.7) + 0.1 * Math.sin(wx * 1.3 - time * 2.3);
    const sy = cam.toScreenY(wy);
    pts.push([sx, sy]);
    if (sy < minY) minY = sy;
  }
  if (minY > H + 4) return;

  const trace = () => {
    ctx.beginPath();
    ctx.moveTo(pts[0][0], H + 10);
    for (const [x, y] of pts) ctx.lineTo(x, y);
    ctx.lineTo(pts[pts.length - 1][0], H + 10);
    ctx.closePath();
  };

  const coastSx = cam.toScreenX(COAST_X - curvatureDrop(0));
  const beachSx = cam.toScreenX(COAST_X + BEACH_W);
  const top = Math.max(0, minY - 4);

  // Halo atmosférico alrededor del horizonte (se nota desde gran altura): trazos apilados que se
  // desvanecen suavemente siguiendo la curvatura
  const glow = Math.min(1, Math.max(0, (altitude - 6000) / 40000));
  if (glow > 0.01) {
    const bandPx = Math.min(H * 0.5, ATMOSPHERE_H * scale);
    ctx.save();
    ctx.globalCompositeOperation = "lighter";
    ctx.lineJoin = "round";
    const N = 40;
    for (let i = 0; i < N; i++) {
      const f = (i + 1) / N;
      ctx.lineWidth = bandPx * 2 * f;
      const a = (0.9 * glow) / N * (1.4 - f);
      ctx.strokeStyle = f < 0.35 ? `rgba(170,215,255,${a * 1.6})` : `rgba(70,140,235,${a})`;
      ctx.beginPath();
      pts.forEach(([x, y], k) => {
        if (k) ctx.lineTo(x, y);
        else ctx.moveTo(x, y);
      });
      ctx.stroke();
    }
    ctx.restore();
  }

  ctx.save();
  trace();
  ctx.clip();

  // Terreno
  const land = ctx.createLinearGradient(0, top, 0, H);
  land.addColorStop(0, "#5f8243");
  land.addColorStop(0.08, "#456a33");
  land.addColorStop(0.3, "#25391f");
  land.addColorStop(1, "#0b130d");
  ctx.fillStyle = land;
  ctx.fillRect(0, top, Math.min(W, Math.max(0, coastSx)), H - top);

  // Playa
  if (coastSx < W) {
    const sand = ctx.createLinearGradient(0, top, 0, H);
    sand.addColorStop(0, "#eadcb2");
    sand.addColorStop(1, "#8f7f58");
    ctx.fillStyle = sand;
    const x0 = Math.max(0, coastSx);
    ctx.fillRect(x0, top, Math.max(0, Math.min(W, beachSx) - x0), H - top);
  }

  // Océano
  if (beachSx < W) {
    const x0 = Math.max(0, beachSx);
    const sea = ctx.createLinearGradient(0, top, 0, H);
    sea.addColorStop(0, "#7cb9d6");
    sea.addColorStop(0.15, "#2c7ba8");
    sea.addColorStop(1, "#08283f");
    ctx.fillStyle = sea;
    ctx.fillRect(x0, top, W - x0, H - top);
    if (scale > 0.02) {
      // Reflejos del sol y crestas de espuma
      ctx.fillStyle = "rgba(255,240,205,0.5)";
      const cell = scale > 1 ? 14 : 140;
      const right = left + W / scale;
      for (let c = Math.max(Math.floor(left / cell), Math.ceil((COAST_X + BEACH_W) / cell)); c <= right / cell && c < 60000; c++) {
        const r1 = hash(c);
        const r2 = hash(c + 91);
        const sy = minY + 3 + r2 * Math.min(H - minY, 160) * 0.5;
        const wob = Math.sin(time * 1.4 + c) * 3;
        ctx.fillRect(cam.toScreenX(c * cell + r1 * cell) + wob, sy, 5 + r1 * 16, 1.4);
      }
    }
    // Espuma en la orilla
    if (scale > 0.2) {
      ctx.fillStyle = "rgba(255,255,255,0.7)";
      const fx = cam.toScreenX(COAST_X + BEACH_W) + Math.sin(time * 1.1) * 4;
      ctx.fillRect(fx - 6, minY + 1, 12 + Math.sin(time * 2) * 3, 2);
    }
  }

  // Textura de vegetación y estratos del suelo (solo cuando se ve de cerca)
  if (scale > 0.5) {
    const edgeAt = (sx: number) => pts[Math.min(pts.length - 1, Math.max(0, Math.round((sx + stepPx) / stepPx)))][1];
    const landEnd = Math.min(W, coastSx);
    // Estratos
    ctx.strokeStyle = "rgba(10,18,10,0.28)";
    ctx.lineWidth = 1;
    for (let k = 1; k <= 5; k++) {
      ctx.beginPath();
      for (let sx = 0; sx <= landEnd; sx += 12) {
        const y = edgeAt(sx) + k * 14 * Math.min(1, scale / 3) + Math.sin(sx * 0.02 + k) * 2;
        if (sx === 0) ctx.moveTo(sx, y);
        else ctx.lineTo(sx, y);
      }
      ctx.stroke();
    }
    // Hierba y arbustos
    if (scale > 1.2) {
      for (let sx = 0; sx <= landEnd; sx += 3) {
        const wx = Math.floor(left + sx / scale);
        const r = hash(wx * 0.37 + 5);
        const hgt = (2 + r * 8) * Math.min(1.5, scale / 6);
        const y = edgeAt(sx);
        ctx.strokeStyle = r > 0.6 ? "#7ea24f" : r > 0.3 ? "#4f7a35" : "#35572a";
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        ctx.moveTo(sx, y + 1);
        ctx.lineTo(sx + (r - 0.5) * 4, y - hgt);
        ctx.stroke();
      }
    }
  }
  ctx.restore();

  // Brillo de la superficie en el borde
  ctx.strokeStyle = "rgba(255,248,230,0.35)";
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  pts.forEach(([x, y], i) => {
    if (i) ctx.lineTo(x, y);
    else ctx.moveTo(x, y);
  });
  ctx.stroke();

  // Marcadores de distancia horizontal
  if (scale > 0.05) {
    const step = STEPS.find((s) => s * scale >= 90) ?? STEPS[STEPS.length - 1];
    const right = left + W / scale;
    ctx.font = "11px var(--font-plex-mono), monospace";
    ctx.textAlign = "center";
    for (let m = Math.floor(left / step) * step; m <= right; m += step) {
      const sx = cam.toScreenX(m);
      const gy = cam.toScreenY(terrainHeight(m) - curvatureDrop(m));
      ctx.fillStyle = m === 0 ? "#d52b32" : "#f9f9f7";
      ctx.fillRect(sx - 1, gy, 2, m === 0 ? 14 : 10);
      if (gy + 28 < H) {
        const label = m === 0 ? "PLATAFORMA" : fmtDist(m);
        const tw = ctx.measureText(label).width + 8;
        ctx.fillStyle = "rgba(10,12,15,0.6)";
        ctx.fillRect(sx - tw / 2, gy + 17, tw, 16);
        ctx.fillStyle = m === 0 ? "#ff6b72" : "#e6e8ec";
        ctx.fillText(label, sx, gy + 29);
      }
    }
  }
}
