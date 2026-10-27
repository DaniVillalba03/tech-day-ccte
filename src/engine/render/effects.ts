import type { Sprites } from "./textures";

/**
 * Efectos dibujados en el sistema local del cohete (metros, origen en su centro, nariz hacia +x):
 * pluma del escape, cono de vapor transónico y paracaídas.
 */

const smoothstep = (t: number) => {
  const x = Math.min(1, Math.max(0, t));
  return x * x * (3 - 2 * x);
};

/**
 * Pluma de escape. A baja altitud es estrecha y muestra discos de choque; en aire enrarecido se
 * ensancha y alarga (pluma subexpandida).
 * @param thrustFrac empuje actual / empuje nominal
 * @param pressureRatio presión ambiente / presión a nivel del mar
 */
export function drawPlume(
  ctx: CanvasRenderingContext2D,
  L: number,
  thrustFrac: number,
  pressureRatio: number,
  exitR: number,
  time: number,
  sprites: Sprites,
) {
  if (thrustFrac <= 0.02) return;
  const flick = 1 + 0.07 * Math.sin(time * 71) + 0.04 * Math.sin(time * 113 + 1);
  const vac = 1 - Math.min(1, pressureRatio);
  const len = (6 + 14 * thrustFrac) * (1 + 2.4 * vac) * flick;
  const bulge = 0.5 + 5 * vac;
  const x0 = -L / 2;
  const steps = 26;

  const halfWidth = (u: number) => exitR * (1 + bulge * Math.sin(Math.min(1, u) * Math.PI * 0.55)) * (1 - Math.pow(u, 1.6) * 0.92);

  const body = (scale: number) => {
    ctx.beginPath();
    for (let i = 0; i <= steps; i++) {
      const u = i / steps;
      const x = x0 - u * len;
      const y = -halfWidth(u) * scale;
      if (i) ctx.lineTo(x, y);
      else ctx.moveTo(x, y);
    }
    for (let i = steps; i >= 0; i--) {
      const u = i / steps;
      ctx.lineTo(x0 - u * len, halfWidth(u) * scale);
    }
    ctx.closePath();
  };

  const g = ctx.createLinearGradient(x0, 0, x0 - len, 0);
  g.addColorStop(0, `rgba(255,250,235,${0.95 * thrustFrac})`);
  g.addColorStop(0.18, `rgba(255,214,130,${0.85 * thrustFrac})`);
  g.addColorStop(0.5, `rgba(255,128,44,${0.5 * thrustFrac})`);
  g.addColorStop(1, "rgba(255,90,30,0)");
  ctx.fillStyle = g;
  body(1);
  ctx.fill();

  // Núcleo caliente
  const core = ctx.createLinearGradient(x0, 0, x0 - len * 0.7, 0);
  core.addColorStop(0, `rgba(255,255,250,${0.95 * thrustFrac})`);
  core.addColorStop(1, "rgba(255,235,180,0)");
  ctx.fillStyle = core;
  body(0.42);
  ctx.fill();

  // Discos de choque (visibles con presión ambiente alta)
  if (pressureRatio > 0.2) {
    for (let i = 0; i < 5; i++) {
      const u = 0.07 + i * 0.11;
      ctx.fillStyle = `rgba(255,255,255,${0.75 * Math.min(1, pressureRatio * 1.3) * (1 - i * 0.18) * thrustFrac})`;
      ctx.beginPath();
      ctx.ellipse(x0 - u * len, 0, len * 0.028 * (1 - i * 0.1), halfWidth(u) * 0.5, 0, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  // Resplandor aditivo en la tobera
  ctx.save();
  ctx.globalCompositeOperation = "lighter";
  const r = (2.2 + 3.4 * thrustFrac) * flick;
  ctx.globalAlpha = 0.9 * thrustFrac;
  ctx.drawImage(sprites.glowWarm, x0 - r * 0.7, -r, r * 2, r * 2);
  ctx.globalAlpha = 0.6 * thrustFrac;
  const r2 = r * 0.45;
  ctx.drawImage(sprites.glowWhite, x0 - r2, -r2, r2 * 2, r2 * 2);
  ctx.restore();
}

/** Cono de condensación (Prandtl–Glauert) al atravesar Mach 1 en aire húmedo y denso. */
export function drawVaporCone(ctx: CanvasRenderingContext2D, L: number, mach: number, altitude: number) {
  const window = 1 - Math.min(1, Math.abs(mach - 1.0) / 0.16);
  const humid = 1 - smoothstep((altitude - 3000) / 7000);
  const a = smoothstep(window) * humid * 0.6;
  if (a < 0.03) return;
  const xs = L / 2 - 1.6;
  const g = ctx.createRadialGradient(xs - 1.2, 0, 0.1, xs - 1.2, 0, 2.6);
  g.addColorStop(0, `rgba(255,255,255,${a})`);
  g.addColorStop(0.6, `rgba(240,246,255,${a * 0.6})`);
  g.addColorStop(1, "rgba(240,246,255,0)");
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.moveTo(xs + 0.3, -0.32);
  ctx.quadraticCurveTo(xs - 0.4, -1.5, xs - 2.6, -0.9);
  ctx.quadraticCurveTo(xs - 3.2, 0, xs - 2.6, 0.9);
  ctx.quadraticCurveTo(xs - 0.4, 1.5, xs + 0.3, 0.32);
  ctx.closePath();
  ctx.fill();
}

/**
 * Paracaídas con gajos en los colores de Paraguay. `open` va de 0 (cerrado) a 1 (abierto);
 * `failed` dibuja los restos desgarrados.
 */
export function drawChute(ctx: CanvasRenderingContext2D, L: number, area: number, open: number, failed: boolean, time: number) {
  const D = 2 * Math.sqrt(area / Math.PI);
  const lineLen = D * 0.9;
  const o = failed ? 0.12 : Math.max(0.08, open);
  const nose = L / 2;
  const cx = nose + lineLen * (0.45 + 0.55 * o);
  const ry = (D / 2) * o;
  const rx = D * 0.32 * (0.3 + 0.7 * o);
  const sway = Math.sin(time * 1.6) * 0.04 * ry;

  // Líneas de suspensión
  ctx.strokeStyle = "rgba(240,240,236,0.8)";
  ctx.lineWidth = 0.07;
  for (const f of [-1, -0.5, 0, 0.5, 1]) {
    ctx.beginPath();
    ctx.moveTo(nose, 0);
    ctx.lineTo(cx - rx * 0.15, f * ry * 0.95 + sway);
    ctx.stroke();
  }

  if (failed) {
    // Restos de tela desgarrada ondeando
    ctx.fillStyle = "rgba(213,43,50,0.85)";
    for (let i = 0; i < 5; i++) {
      const y = (i - 2) * ry * 0.5;
      ctx.beginPath();
      ctx.moveTo(cx, y);
      ctx.lineTo(cx + 1.2 + Math.sin(time * 9 + i) * 0.5, y + 0.5);
      ctx.lineTo(cx + 0.4, y + 0.9);
      ctx.closePath();
      ctx.fill();
    }
    return;
  }

  // Dosel: media elipse con gajos rojo / blanco / azul
  ctx.save();
  ctx.beginPath();
  ctx.moveTo(cx - rx * 0.15, -ry + sway);
  ctx.ellipse(cx - rx * 0.15, sway, rx, ry, 0, -Math.PI / 2, Math.PI / 2, false);
  ctx.closePath();
  ctx.clip();
  const colors = ["#d52b32", "#f4f3ee", "#244b8f", "#f4f3ee"];
  const n = 8;
  for (let i = 0; i < n; i++) {
    ctx.fillStyle = colors[i % colors.length];
    ctx.fillRect(cx - rx * 1.2, -ry + (i * 2 * ry) / n + sway, rx * 2.4, (2 * ry) / n + 0.02);
  }
  const shade = ctx.createLinearGradient(cx - rx, 0, cx + rx, 0);
  shade.addColorStop(0, "rgba(0,0,0,0.25)");
  shade.addColorStop(0.5, "rgba(255,255,255,0.12)");
  shade.addColorStop(1, "rgba(0,0,0,0.35)");
  ctx.fillStyle = shade;
  ctx.fillRect(cx - rx * 1.2, -ry + sway, rx * 2.4, 2 * ry);
  ctx.restore();
  ctx.beginPath();
  ctx.ellipse(cx - rx * 0.15, sway, rx, ry, 0, -Math.PI / 2, Math.PI / 2, false);
  ctx.lineTo(cx - rx * 0.15, -ry + sway);
  ctx.strokeStyle = "rgba(10,12,15,0.5)";
  ctx.lineWidth = 0.06;
  ctx.stroke();
}
