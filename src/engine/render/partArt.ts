import type { Engine, Fin, FinShape, FuelTank, NoseCone, NoseShape, Part } from "@/types";

/**
 * Arte vectorial de las piezas, dibujado con gradientes, costuras, remaches y brillos.
 * Coordenadas en metros: eje x hacia la nariz, el radio del cuerpo es R, la luz viene de arriba (y < 0).
 */
export const R = 0.3;

const PAL = {
  white: "#eceae3",
  red: "#d52b32",
  cobalt: "#244b8f",
  steel: "#7a828c",
  dark: "#1c2027",
  copper: "#b9773c",
};

function shade(hex: string, amount: number): string {
  const n = parseInt(hex.slice(1), 16);
  const ch = (v: number) => Math.round(Math.max(0, Math.min(255, amount >= 0 ? v + (255 - v) * amount : v * (1 + amount))));
  return `rgb(${ch((n >> 16) & 255)},${ch((n >> 8) & 255)},${ch(n & 255)})`;
}

/** Gradiente cilíndrico: oscuro en los bordes, brillo especular cerca de la parte superior. */
function cylinder(ctx: CanvasRenderingContext2D, r: number, base: string): CanvasGradient {
  const g = ctx.createLinearGradient(0, -r, 0, r);
  g.addColorStop(0, shade(base, -0.45));
  g.addColorStop(0.22, shade(base, 0.35));
  g.addColorStop(0.4, shade(base, 0.08));
  g.addColorStop(0.75, shade(base, -0.28));
  g.addColorStop(1, shade(base, -0.6));
  return g;
}

function outline(ctx: CanvasRenderingContext2D) {
  ctx.strokeStyle = "rgba(8,10,14,0.55)";
  ctx.lineWidth = 0.014;
  ctx.lineJoin = "round";
  ctx.stroke();
}

/** Perfil de radio normalizado (0..1) de la ojiva; t = 0 en la base y 1 en la punta. */
const NOSE_PROFILE: Record<NoseShape, (t: number) => number> = {
  conical: (t) => 1 - t,
  ogive: (t) => Math.pow(1 - Math.pow(t, 1.7), 0.8),
  parabolic: (t) => 1 - t * t,
  elliptical: (t) => Math.sqrt(1 - t * t),
  blunt: (t) => Math.pow(1 - Math.pow(t, 4), 0.5),
};

export function drawNose(ctx: CanvasRenderingContext2D, n: NoseCone, x0: number) {
  const L = n.length;
  const f = NOSE_PROFILE[n.shape];
  const steps = 28;
  ctx.beginPath();
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    const x = x0 + t * L;
    const y = -R * f(t);
    if (i) ctx.lineTo(x, y);
    else ctx.moveTo(x, y);
  }
  for (let i = steps; i >= 0; i--) {
    const t = i / steps;
    ctx.lineTo(x0 + t * L, R * f(t));
  }
  ctx.closePath();
  ctx.fillStyle = cylinder(ctx, R, PAL.white);
  ctx.fill();

  // Banda roja en la base y reflejo
  ctx.save();
  ctx.clip();
  ctx.fillStyle = PAL.red;
  ctx.fillRect(x0, -R, L * 0.16, 2 * R);
  ctx.fillStyle = "rgba(0,0,0,0.3)";
  ctx.fillRect(x0 + L * 0.16, -R, 0.012, 2 * R);
  ctx.fillStyle = cylinder(ctx, R, PAL.red);
  ctx.globalCompositeOperation = "multiply";
  ctx.fillRect(x0, -R, L * 0.16, 2 * R);
  ctx.restore();

  ctx.beginPath();
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    const y = -R * f(t);
    if (i) ctx.lineTo(x0 + t * L, y);
    else ctx.moveTo(x0 + t * L, y);
  }
  for (let i = steps; i >= 0; i--) ctx.lineTo(x0 + (i / steps) * L, R * f(i / steps));
  ctx.closePath();
  outline(ctx);

  // Punta metálica
  if (n.shape !== "blunt") {
    ctx.fillStyle = shade(PAL.steel, 0.2);
    ctx.beginPath();
    ctx.arc(x0 + L - 0.02, 0, 0.026, 0, Math.PI * 2);
    ctx.fill();
  }
}

export function drawBody(ctx: CanvasRenderingContext2D, t: FuelTank, x0: number, index: number) {
  const L = t.length;
  const base = index % 2 === 0 ? PAL.white : PAL.red;

  ctx.fillStyle = cylinder(ctx, R, base);
  ctx.fillRect(x0, -R, L, 2 * R);

  // Bandas de unión
  ctx.fillStyle = cylinder(ctx, R, PAL.dark);
  for (const bx of [x0, x0 + L - 0.07]) ctx.fillRect(bx, -R, 0.07, 2 * R);
  ctx.fillStyle = cylinder(ctx, R, PAL.cobalt);
  ctx.fillRect(x0 + 0.1, -R, 0.045, 2 * R);

  // Remaches
  ctx.fillStyle = "rgba(10,12,16,0.45)";
  for (let x = x0 + 0.22; x < x0 + L - 0.18; x += 0.14) {
    for (const y of [-R + 0.045, R - 0.045]) {
      ctx.beginPath();
      ctx.arc(x, y, 0.009, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  // Rótulo KNSB
  if (L >= 1.2) {
    ctx.save();
    ctx.fillStyle = index % 2 === 0 ? PAL.red : PAL.white;
    ctx.font = "bold 0.13px sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("KNSB", x0 + L / 2, 0);
    ctx.restore();
  }

  ctx.beginPath();
  ctx.rect(x0, -R, L, 2 * R);
  outline(ctx);
}

export function drawEngine(ctx: CanvasRenderingContext2D, e: Engine, x0: number) {
  const L = e.length;
  const nozzleL = L * 0.58;
  const throatX = x0 + nozzleL;
  const exitR = R * (0.5 + 0.38 * Math.min(1, e.thrust / 110000));

  // Tobera: campana con gradiente cobrizo
  ctx.beginPath();
  ctx.moveTo(throatX, -R * 0.38);
  ctx.quadraticCurveTo(x0 + nozzleL * 0.45, -R * 0.45, x0, -exitR);
  ctx.lineTo(x0, exitR);
  ctx.quadraticCurveTo(x0 + nozzleL * 0.45, R * 0.45, throatX, R * 0.38);
  ctx.closePath();
  ctx.fillStyle = cylinder(ctx, exitR, PAL.copper);
  ctx.fill();
  outline(ctx);

  // Boca interior oscura
  ctx.fillStyle = "#0a0b0e";
  ctx.beginPath();
  ctx.ellipse(x0, 0, 0.035, exitR * 0.92, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = shade(PAL.copper, 0.35);
  ctx.lineWidth = 0.018;
  ctx.beginPath();
  ctx.ellipse(x0, 0, 0.035, exitR * 0.92, 0, 0, Math.PI * 2);
  ctx.stroke();

  // Carcasa del motor
  const cx = throatX;
  const cl = L - nozzleL;
  ctx.fillStyle = cylinder(ctx, R, PAL.steel);
  ctx.fillRect(cx, -R * 0.96, cl, R * 1.92);
  ctx.fillStyle = cylinder(ctx, R, PAL.dark);
  ctx.fillRect(cx, -R * 0.96, 0.06, R * 1.92);
  ctx.fillStyle = cylinder(ctx, R, PAL.red);
  ctx.fillRect(cx + cl - 0.1, -R * 0.96, 0.05, R * 1.92);
  ctx.strokeStyle = "rgba(0,0,0,0.35)";
  ctx.lineWidth = 0.012;
  for (let x = cx + 0.14; x < cx + cl - 0.14; x += 0.09) {
    ctx.beginPath();
    ctx.moveTo(x, -R * 0.96);
    ctx.lineTo(x, R * 0.96);
    ctx.stroke();
  }
  ctx.beginPath();
  ctx.rect(cx, -R * 0.96, cl, R * 1.92);
  outline(ctx);
}

/** Polígonos de aleta en (u, v): u = 0 en la cola → 1 hacia la nariz; v = 0 en la raíz → 1 en la punta. */
const FIN_POLY: Record<FinShape, [number, number][]> = {
  rect: [[0, 0], [0, 1], [1, 1], [1, 0]],
  trapezoid: [[0, 0], [0.12, 1], [0.7, 1], [1, 0]],
  swept: [[0, 0], [0, 1], [0.4, 1], [1, 0]],
  delta: [[0, 0], [0, 1], [1, 0]],
  clipped: [[0, 0], [0.1, 1], [0.5, 1], [1, 0.38], [1, 0]],
};

/** Aletas arriba y abajo (vista lateral); `tailX` es la posición x del extremo de cola de la raíz. */
export function drawFins(ctx: CanvasRenderingContext2D, f: Fin, tailX: number) {
  const span = (f.diameter - 0.6) / 2 + 0.05;
  const poly = FIN_POLY[f.shape];
  for (const side of [-1, 1]) {
    const g = ctx.createLinearGradient(0, side * R, 0, side * (R + span));
    g.addColorStop(0, shade(PAL.cobalt, -0.4));
    g.addColorStop(0.6, PAL.cobalt);
    g.addColorStop(1, shade(PAL.cobalt, 0.3));
    ctx.beginPath();
    poly.forEach(([u, v], i) => {
      const x = tailX + u * f.length;
      const y = side * (R - 0.02 + v * span);
      if (i) ctx.lineTo(x, y);
    else ctx.moveTo(x, y);
    });
    ctx.closePath();
    ctx.fillStyle = g;
    ctx.fill();
    outline(ctx);
    // Borde de ataque resaltado
    ctx.strokeStyle = "rgba(249,249,247,0.55)";
    ctx.lineWidth = 0.018;
    ctx.beginPath();
    poly.slice(-3).forEach(([u, v], i) => {
      const x = tailX + u * f.length;
      const y = side * (R - 0.02 + v * span);
      if (i) ctx.lineTo(x, y);
    else ctx.moveTo(x, y);
    });
    ctx.stroke();
  }
}

/** Dibuja una sola pieza (para miniaturas del catálogo): se ajusta al rectángulo w × h. */
export function drawPartThumb(ctx: CanvasRenderingContext2D, part: Part, w: number, h: number) {
  const span = part.category === "fin" ? (part.diameter - 0.6) / 2 + 0.05 : 0;
  const halfH = R + span;
  const lenM = part.length;
  const s = Math.min((w - 8) / (lenM + 0.1), (h - 8) / (2 * halfH));
  ctx.save();
  ctx.translate(w / 2 - (lenM / 2) * s, h / 2);
  ctx.scale(s, s);
  switch (part.category) {
    case "nose":
      drawNose(ctx, part, 0);
      break;
    case "tank":
      drawBody(ctx, part, 0, 0);
      break;
    case "engine":
      drawEngine(ctx, part, 0);
      break;
    case "fin": {
      // Un tramo de cuerpo para dar contexto a las aletas
      ctx.fillStyle = cylinder(ctx, R, PAL.white);
      ctx.fillRect(-0.05, -R, part.length + 0.1, 2 * R);
      drawFins(ctx, part, 0);
      break;
    }
  }
  ctx.restore();
}
