import type { Camera } from "./camera";

const STEPS = [10, 50, 100, 500, 1000, 5000, 10000, 50000, 100000];

/** Línea de costa: a partir de aquí (hacia +x) está el océano Atlántico */
export const COAST_X = 2400;
const BEACH_W = 220;

function fmtDist(m: number) {
  return m >= 1000 ? `${m / 1000} km` : `${m} m`;
}

/** Suelo: terreno costero, playa y océano, más marcadores de distancia horizontal. */
export function drawGround(ctx: CanvasRenderingContext2D, cam: Camera) {
  const groundY = cam.toScreenY(0);
  if (groundY >= cam.height) return;
  const h = cam.height - groundY;
  const coastSx = cam.toScreenX(COAST_X);
  const beachEnd = cam.toScreenX(COAST_X + BEACH_W);

  // Terreno: vegetación baja que se oscurece con la profundidad
  const land = ctx.createLinearGradient(0, groundY, 0, cam.height);
  land.addColorStop(0, "#4b6b3a");
  land.addColorStop(0.35, "#34502a");
  land.addColorStop(1, "#18241a");
  ctx.fillStyle = land;
  ctx.fillRect(0, groundY, Math.min(cam.width, coastSx), h);

  // Playa
  if (coastSx < cam.width) {
    const sand = ctx.createLinearGradient(0, groundY, 0, cam.height);
    sand.addColorStop(0, "#e3d3a6");
    sand.addColorStop(1, "#9c8c63");
    ctx.fillStyle = sand;
    ctx.fillRect(Math.max(0, coastSx), groundY, Math.max(0, Math.min(cam.width, beachEnd) - Math.max(0, coastSx)), h);
  }

  // Océano con brillos
  if (beachEnd < cam.width) {
    const x0 = Math.max(0, beachEnd);
    const sea = ctx.createLinearGradient(0, groundY, 0, cam.height);
    sea.addColorStop(0, "#5fa2c9");
    sea.addColorStop(0.25, "#256f9f");
    sea.addColorStop(1, "#0b2f4d");
    ctx.fillStyle = sea;
    ctx.fillRect(x0, groundY, cam.width - x0, h);
    // Destellos del sol sobre el agua (posiciones deterministas en el mundo)
    ctx.fillStyle = "rgba(255,240,200,0.55)";
    const cell = 140;
    const left = cam.x - cam.width / 2 / cam.scale;
    const right = cam.x + cam.width / 2 / cam.scale;
    for (let c = Math.max(Math.floor(left / cell), Math.ceil((COAST_X + BEACH_W) / cell)); c <= right / cell && c < 20000; c++) {
      const r1 = Math.abs(Math.sin(c * 12.9898) * 43758.5453) % 1;
      const r2 = Math.abs(Math.sin(c * 78.233) * 12345.678) % 1;
      const sy = groundY + (4 + r2 * 0.35 * h);
      if (sy < cam.height) ctx.fillRect(cam.toScreenX(c * cell + r1 * cell), sy, 6 + r1 * 14, 1.5);
    }
  }

  // Línea del suelo
  ctx.fillStyle = "rgba(249,249,247,0.9)";
  ctx.fillRect(0, groundY, cam.width, 1.5);

  // Marcadores cada N metros (N elegido para que haya ≥ 90 px entre ellos)
  const step = STEPS.find((s) => s * cam.scale >= 90) ?? STEPS[STEPS.length - 1];
  const left = cam.x - cam.width / 2 / cam.scale;
  const right = cam.x + cam.width / 2 / cam.scale;
  ctx.font = "11px var(--font-plex-mono), monospace";
  ctx.textAlign = "center";
  for (let m = Math.floor(left / step) * step; m <= right; m += step) {
    const sx = cam.toScreenX(m);
    ctx.fillStyle = m === 0 ? "#d52b32" : "#f9f9f7";
    ctx.fillRect(sx - 1, groundY, 2, m === 0 ? 14 : 10);
    if (groundY + 28 < cam.height) {
      ctx.fillStyle = "rgba(10,12,15,0.55)";
      const label = m === 0 ? "PLATAFORMA" : fmtDist(m);
      const tw = ctx.measureText(label).width + 8;
      ctx.fillRect(sx - tw / 2, groundY + 17, tw, 16);
      ctx.fillStyle = m === 0 ? "#ff6b72" : "#e6e8ec";
      ctx.fillText(label, sx, groundY + 29);
    }
  }
}
