import type { Camera } from "./camera";
import { spaceFraction } from "./sky";
import type { Sprites } from "./textures";

/** Escenario inspirado en un complejo de lanzamiento costero (tipo Cabo Cañaveral). Todo dibujado en vectores. */

const hash = (n: number) => {
  const v = Math.sin(n * 127.1 + 311.7) * 43758.5453;
  return v - Math.floor(v);
};

/**
 * Nubes volumétricas en el mundo (m): cúmulos bajos, nubes medias y cirros. Devuelve qué tan dentro
 * de una nube está la cámara (0..1) para simular la niebla al atravesarla.
 */
function drawClouds(ctx: CanvasRenderingContext2D, cam: Camera, altitude: number, sprites: Sprites): number {
  const fade = 1 - Math.min(1, Math.max(0, (altitude - 14000) / 16000));
  if (fade <= 0) return 0;
  const left = cam.x - cam.width / 2 / cam.scale;
  const right = cam.x + cam.width / 2 / cam.scale;
  let inside = 0;

  // [altitud base, rango, tamaño mín., rango de tamaño, ancho de celda, probabilidad, alfa, estirado]
  const layers: [number, number, number, number, number, number, number, number][] = [
    [1100, 1200, 420, 620, 2300, 0.55, 0.95, 1.25],
    [4300, 1700, 380, 460, 3200, 0.42, 0.7, 1.7],
    [9500, 1400, 500, 520, 4200, 0.5, 0.3, 3.4],
  ];
  layers.forEach(([base, range, minSize, sizeRange, cell, prob, alpha, stretch], layer) => {
    const c0 = Math.floor(left / cell) - 1;
    const c1 = Math.min(Math.ceil(right / cell) + 1, c0 + 300);
    for (let c = c0; c <= c1; c++) {
      const seed = c * 7 + layer * 131;
      if (hash(seed) > prob) continue;
      const wx = c * cell + hash(seed + 1) * cell;
      const wy = base + hash(seed + 2) * range;
      const size = minSize + hash(seed + 3) * sizeRange;
      const sx = cam.toScreenX(wx);
      const sy = cam.toScreenY(wy);
      const w = size * 2 * cam.scale * stretch;
      const h = size * 2 * cam.scale * (stretch > 2 ? 0.28 : 0.78);
      if (w < 3 || sx + w < 0 || sx - w > cam.width || sy + h < 0 || sy - h > cam.height) continue;
      ctx.globalAlpha = alpha * fade;
      const sprite = sprites.clouds[Math.floor(hash(seed + 4) * sprites.clouds.length)];
      if (hash(seed + 5) < 0.5) {
        ctx.save();
        ctx.translate(sx, sy);
        ctx.scale(-1, 1);
        ctx.drawImage(sprite, -w / 2, -h / 2, w, h);
        ctx.restore();
      } else ctx.drawImage(sprite, sx - w / 2, sy - h / 2, w, h);
      // ¿La cámara está dentro de esta nube?
      const dx = (cam.x - wx) / (size * stretch);
      const dy = (cam.y - wy) / (size * 0.78);
      const d = Math.hypot(dx, dy);
      if (d < 0.7) inside = Math.max(inside, (1 - d / 0.7) * alpha);
    }
  });
  ctx.globalAlpha = 1;
  return inside * fade;
}

/** Fondo lejano con paralaje: línea de árboles y edificios en el horizonte. */
function drawSkyline(ctx: CanvasRenderingContext2D, cam: Camera) {
  const groundY = cam.toScreenY(0);
  if (groundY <= 0 || groundY > cam.height + 200) return;
  const bs = Math.max(0.4, Math.min(1, 0.4 + cam.scale / 20));
  const par = cam.x * cam.scale * 0.06;

  // Bruma en el horizonte
  const haze = ctx.createLinearGradient(0, groundY - 90 * bs, 0, groundY);
  haze.addColorStop(0, "rgba(240,215,185,0)");
  haze.addColorStop(1, "rgba(240,215,185,0.45)");
  ctx.fillStyle = haze;
  ctx.fillRect(0, groundY - 90 * bs, cam.width, 90 * bs);

  // Árboles lejanos
  ctx.fillStyle = "#2b4a30";
  ctx.beginPath();
  ctx.moveTo(0, groundY);
  for (let x = 0; x <= cam.width; x += 6) {
    const wx = Math.floor((x + par) / 6);
    const hgt = (5 + hash(wx) * 9 + hash(Math.floor(wx / 7)) * 10) * bs;
    ctx.lineTo(x, groundY - hgt);
  }
  ctx.lineTo(cam.width, groundY);
  ctx.closePath();
  ctx.fill();

  // Edificios lejanos (pocos, azulados por la distancia)
  ctx.fillStyle = "#5d7185";
  for (let i = -2; i < 8; i++) {
    const bx = i * 520 - (par % 520) + hash(i + Math.floor(par / 520)) * 120;
    const bw = (38 + hash(i * 3) * 50) * bs;
    const bh = (14 + hash(i * 5) * 30) * bs;
    if (hash(i + Math.floor(par / 520) * 2) > 0.55) ctx.fillRect(bx, groundY - bh - 2, bw, bh);
  }
}

export function drawBackdrop(ctx: CanvasRenderingContext2D, cam: Camera, altitude: number, sprites: Sprites) {
  let inside = 0;
  if (spaceFraction(altitude) < 0.98) inside = drawClouds(ctx, cam, altitude, sprites);
  if (altitude < 4000) drawSkyline(ctx, cam);
  return inside;
}

function box(ctx: CanvasRenderingContext2D, cam: Camera, x0: number, y0: number, x1: number, y1: number) {
  ctx.fillRect(cam.toScreenX(x0), cam.toScreenY(y1), (x1 - x0) * cam.scale, (y1 - y0) * cam.scale);
}

function line(ctx: CanvasRenderingContext2D, cam: Camera, x0: number, y0: number, x1: number, y1: number, w: number) {
  ctx.lineWidth = Math.max(1, w * cam.scale);
  ctx.beginPath();
  ctx.moveTo(cam.toScreenX(x0), cam.toScreenY(y0));
  ctx.lineTo(cam.toScreenX(x1), cam.toScreenY(y1));
  ctx.stroke();
}

const visible = (cam: Camera, x0: number, x1: number, h: number) =>
  cam.toScreenX(x1) > -50 && cam.toScreenX(x0) < cam.width + 50 && cam.toScreenY(h) < cam.height && cam.scale * h > 2;

/** Torre de servicio con brazos de acceso que se retiran al despegar. */
function drawTower(ctx: CanvasRenderingContext2D, cam: Camera, armsOut: boolean) {
  const cx = -22;
  const H = 62;
  const half = 4;
  if (!visible(cam, cx - 20, cx + 10, H)) return;

  ctx.strokeStyle = "#b9bdc4";
  ctx.lineCap = "butt";
  line(ctx, cam, cx - half, 0, cx - half, H, 0.7);
  line(ctx, cam, cx + half, 0, cx + half, H, 0.7);
  ctx.strokeStyle = "#8a9099";
  for (let y = 0; y < H; y += 6) {
    line(ctx, cam, cx - half, y, cx + half, y + 6, 0.25);
    line(ctx, cam, cx + half, y, cx - half, y + 6, 0.25);
    line(ctx, cam, cx - half, y + 6, cx + half, y + 6, 0.3);
  }

  // Plataformas y grúa superior
  ctx.fillStyle = "#6d737c";
  for (const y of [14, 30, 46, H]) box(ctx, cam, cx - half - 1.5, y - 0.5, cx + half + 1.5, y + 0.5);
  ctx.strokeStyle = "#d52b32";
  line(ctx, cam, cx - half, H, cx + 12, H + 4, 0.5);
  ctx.fillStyle = "#d52b32";
  box(ctx, cam, cx - half - 1.5, H + 0.5, cx + half + 1.5, H + 1.5);

  // Brazos de acceso hacia el cohete
  if (armsOut) {
    ctx.fillStyle = "#c9cdd3";
    for (const y of [14, 30, 46]) box(ctx, cam, cx + half, y - 0.6, -1.2, y + 0.6);
  }
}

function drawLightningMast(ctx: CanvasRenderingContext2D, cam: Camera, x: number, h: number) {
  ctx.strokeStyle = "#9aa0a8";
  line(ctx, cam, x, 0, x, h, 0.35);
  ctx.fillStyle = "#d52b32";
  ctx.beginPath();
  ctx.arc(cam.toScreenX(x), cam.toScreenY(h), Math.max(1.5, 0.6 * cam.scale), 0, Math.PI * 2);
  ctx.fill();
}

function drawWaterTank(ctx: CanvasRenderingContext2D, cam: Camera, x: number) {
  const H = 34;
  const r = 7;
  if (!visible(cam, x - 10, x + 10, H + r)) return;
  ctx.strokeStyle = "#8a9099";
  for (const dx of [-4.5, 4.5]) line(ctx, cam, x + dx, 0, x + dx * 0.5, H, 0.5);
  line(ctx, cam, x - 4.5, 12, x + 4.5, 22, 0.25);
  line(ctx, cam, x + 4.5, 12, x - 4.5, 22, 0.25);
  const sx = cam.toScreenX(x);
  const sy = cam.toScreenY(H + r * 0.7);
  const rr = r * cam.scale;
  const g = ctx.createRadialGradient(sx - rr * 0.35, sy - rr * 0.35, rr * 0.1, sx, sy, rr);
  g.addColorStop(0, "#ffffff");
  g.addColorStop(1, "#aeb4bd");
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.arc(sx, sy, rr, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#d52b32";
  ctx.fillRect(sx - rr, sy - rr * 0.12, rr * 2, rr * 0.24);
}

/** Edificio de ensamblaje con mural de la bandera de Paraguay. */
function drawAssemblyBuilding(ctx: CanvasRenderingContext2D, cam: Camera, x: number) {
  const W = 230;
  const H = 150;
  if (!visible(cam, x, x + W, H)) return;
  const g = ctx.createLinearGradient(cam.toScreenX(x), 0, cam.toScreenX(x + W), 0);
  g.addColorStop(0, "#cfd3d9");
  g.addColorStop(1, "#9ea4ad");
  ctx.fillStyle = g;
  box(ctx, cam, x, -4, x + W, H);
  ctx.fillStyle = "rgba(20,30,45,0.35)";
  for (let i = 1; i < 8; i++) box(ctx, cam, x + (W / 8) * i - 0.5, 0, x + (W / 8) * i + 0.5, H);
  ctx.fillStyle = "#1c2430";
  box(ctx, cam, x + W * 0.38, 0, x + W * 0.62, 118);
  // Mural: rojo / blanco / azul
  const mx = x + 18;
  const my = H - 52;
  ctx.fillStyle = "#d52b32";
  box(ctx, cam, mx, my + 22, mx + 66, my + 34);
  ctx.fillStyle = "#f4f3ee";
  box(ctx, cam, mx, my + 11, mx + 66, my + 22);
  ctx.fillStyle = "#244b8f";
  box(ctx, cam, mx, my, mx + 66, my + 11);
}

function drawPalm(ctx: CanvasRenderingContext2D, cam: Camera, x: number, h: number, lean: number) {
  if (!visible(cam, x - 8, x + 8, h + 4)) return;
  const sx = cam.toScreenX(x);
  const base = cam.toScreenY(0);
  const tx = sx + lean * h * cam.scale * 0.2;
  const ty = cam.toScreenY(h);
  ctx.strokeStyle = "#6b4c2e";
  ctx.lineWidth = Math.max(1.5, 0.45 * cam.scale);
  ctx.beginPath();
  ctx.moveTo(sx, base);
  ctx.quadraticCurveTo(sx + lean * h * cam.scale * 0.02, (base + ty) / 2, tx, ty);
  ctx.stroke();
  ctx.strokeStyle = "#2f6b34";
  ctx.lineWidth = Math.max(1.5, 0.35 * cam.scale);
  ctx.lineCap = "round";
  const L = h * 0.5 * cam.scale;
  for (let i = 0; i < 7; i++) {
    const a = Math.PI + (i / 6) * Math.PI;
    ctx.beginPath();
    ctx.moveTo(tx, ty);
    ctx.quadraticCurveTo(tx + Math.cos(a) * L * 0.6, ty - Math.abs(Math.sin(a)) * L * 0.5 - L * 0.1, tx + Math.cos(a) * L, ty + Math.abs(Math.sin(a)) * L * 0.3 + L * 0.2);
    ctx.stroke();
  }
  ctx.lineCap = "butt";
}

/** Plataforma, torre, pararrayos, tanque de agua, edificio y palmeras. */
export function drawStructures(ctx: CanvasRenderingContext2D, cam: Camera, armsOut: boolean) {
  const groundY = cam.toScreenY(0);
  if (groundY > cam.height + 50) return;
  drawAssemblyBuilding(ctx, cam, -1500);
  drawWaterTank(ctx, cam, 150);
  for (const x of [-95, -60, 85, 110]) drawLightningMast(ctx, cam, x, 85);
  for (const [x, h, lean] of [[-260, 11, -0.6], [-230, 9, 0.5], [210, 12, 0.7], [300, 10, -0.4], [380, 9, 0.6]] as const) drawPalm(ctx, cam, x, h, lean);
  drawTower(ctx, cam, armsOut);

  // Plataforma de concreto con foso de llamas
  if (visible(cam, -25, 25, 3)) {
    ctx.fillStyle = "#b4b8be";
    box(ctx, cam, -16, 0, 16, 0.5);
    ctx.fillStyle = "#7d828a";
    box(ctx, cam, -16, 0, 16, 0.14);
    ctx.fillStyle = "#2a2d33";
    box(ctx, cam, -3.5, 0, 3.5, 0.5);
  }
}
