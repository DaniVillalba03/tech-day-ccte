import type { Engine, Fin, FinShape, FuelTank, NoseCone, NoseShape, Part } from "@/types";

/**
 * Arte vectorial de las piezas, con estética de simulador espacial (estilo KSP):
 * cascos de colores con anillos metálicos y pernos, paneles biselados, franjas de advertencia,
 * toberas con brillo interior y aletas angulosas.
 * Coordenadas en metros: eje x hacia la nariz, radio R, luz desde arriba (y < 0).
 */
export const R = 0.3;

const PAL = {
  hull: "#e9e7df",
  orange: "#e0771c",
  grey: "#8d949c",
  steel: "#5d646d",
  dark: "#262a31",
  black: "#14161a",
  yellow: "#f2c230",
  red: "#d52b32",
  blue: "#244b8f",
  copper: "#c0793a",
  glow: "#ffa040",
};

function shade(hex: string, amount: number): string {
  const n = parseInt(hex.slice(1), 16);
  const ch = (v: number) => Math.round(Math.max(0, Math.min(255, amount >= 0 ? v + (255 - v) * amount : v * (1 + amount))));
  return `rgb(${ch((n >> 16) & 255)},${ch((n >> 8) & 255)},${ch(n & 255)})`;
}

/** Superposición de volumen cilíndrico: brillo especular arriba y sombra abajo. */
function volumeOverlay(ctx: CanvasRenderingContext2D, r: number): CanvasGradient {
  const g = ctx.createLinearGradient(0, -r, 0, r);
  g.addColorStop(0, "rgba(0,0,0,0.5)");
  g.addColorStop(0.14, "rgba(255,255,255,0.34)");
  g.addColorStop(0.3, "rgba(255,255,255,0.1)");
  g.addColorStop(0.55, "rgba(0,0,0,0)");
  g.addColorStop(0.82, "rgba(0,0,0,0.3)");
  g.addColorStop(1, "rgba(0,0,0,0.65)");
  return g;
}

/** Rellena el trazado actual con un color plano y le da volumen. */
function fillVolume(ctx: CanvasRenderingContext2D, color: string, r: number) {
  ctx.fillStyle = color;
  ctx.fill();
  ctx.save();
  ctx.clip();
  ctx.fillStyle = volumeOverlay(ctx, r);
  ctx.fillRect(-1e3, -r, 2e3, 2 * r);
  ctx.restore();
}

function outline(ctx: CanvasRenderingContext2D, w = 0.014) {
  ctx.strokeStyle = "rgba(6,8,12,0.7)";
  ctx.lineWidth = w;
  ctx.lineJoin = "round";
  ctx.stroke();
}

function rectVolume(ctx: CanvasRenderingContext2D, x: number, w: number, color: string, r = R) {
  ctx.beginPath();
  ctx.rect(x, -r, w, 2 * r);
  fillVolume(ctx, color, r);
}

/** Anillo metálico con bisel y pernos. */
function ring(ctx: CanvasRenderingContext2D, x: number, w: number, color = PAL.grey, r = R) {
  rectVolume(ctx, x, w, color, r);
  ctx.fillStyle = "rgba(255,255,255,0.35)";
  ctx.fillRect(x, -r, 0.012, 2 * r);
  ctx.fillStyle = "rgba(0,0,0,0.45)";
  ctx.fillRect(x + w - 0.012, -r, 0.012, 2 * r);
  ctx.fillStyle = "rgba(8,10,14,0.75)";
  for (const y of [-0.66 * r, 0, 0.66 * r]) {
    ctx.beginPath();
    ctx.arc(x + w / 2, y, 0.011, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.beginPath();
  ctx.rect(x, -r, w, 2 * r);
  outline(ctx, 0.012);
}

/** Franja de advertencia amarilla y negra. */
function hazard(ctx: CanvasRenderingContext2D, x: number, w: number) {
  ctx.save();
  ctx.beginPath();
  ctx.rect(x, -R, w, 2 * R);
  ctx.clip();
  ctx.fillStyle = PAL.yellow;
  ctx.fillRect(x, -R, w, 2 * R);
  ctx.fillStyle = PAL.black;
  const step = 0.09;
  for (let k = -8; k < w / step + 8; k++) {
    const bx = x + k * step;
    ctx.beginPath();
    ctx.moveTo(bx, -R);
    ctx.lineTo(bx + step / 2, -R);
    ctx.lineTo(bx + step / 2 + 0.2, R);
    ctx.lineTo(bx + 0.2, R);
    ctx.closePath();
    ctx.fill();
  }
  ctx.fillStyle = volumeOverlay(ctx, R);
  ctx.fillRect(x, -R, w, 2 * R);
  ctx.restore();
  ctx.beginPath();
  ctx.rect(x, -R, w, 2 * R);
  outline(ctx, 0.01);
}

/** Franja de la bandera de Paraguay (rojo, blanco, azul) como librea. */
function flagStripe(ctx: CanvasRenderingContext2D, x: number, w: number) {
  const t = w / 3;
  rectVolume(ctx, x, t, PAL.red);
  rectVolume(ctx, x + t, t, "#f4f3ee");
  rectVolume(ctx, x + 2 * t, t, PAL.blue);
}

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

/** Perfil de radio normalizado (0..1) de la ojiva; t = 0 en la base y 1 en la punta. */
const NOSE_PROFILE: Record<NoseShape, (t: number) => number> = {
  conical: (t) => 1 - t,
  ogive: (t) => Math.pow(1 - Math.pow(t, 1.7), 0.8),
  parabolic: (t) => 1 - t * t,
  elliptical: (t) => Math.sqrt(1 - t * t),
  blunt: (t) => Math.pow(1 - Math.pow(t, 4), 0.5),
};

function nosePath(ctx: CanvasRenderingContext2D, n: NoseCone, x0: number) {
  const f = NOSE_PROFILE[n.shape];
  const steps = 32;
  ctx.beginPath();
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    if (i) ctx.lineTo(x0 + t * n.length, -R * f(t));
    else ctx.moveTo(x0, -R * f(0));
  }
  for (let i = steps; i >= 0; i--) ctx.lineTo(x0 + (i / steps) * n.length, R * f(i / steps));
  ctx.closePath();
}

export function drawNose(ctx: CanvasRenderingContext2D, n: NoseCone, x0: number) {
  const L = n.length;
  const baseRing = 0.09;

  // Casco blanco con librea; el perfil se escala para ocupar L - baseRing
  ctx.save();
  ctx.translate(x0 + baseRing, 0);
  ctx.scale((L - baseRing) / L, 1);
  nosePath(ctx, n, 0);
  fillVolume(ctx, PAL.hull, R);
  ctx.save();
  ctx.clip();
  // Costuras y banda naranja
  ctx.fillStyle = PAL.orange;
  ctx.fillRect(L * 0.08, -R, L * 0.07, 2 * R);
  ctx.fillStyle = volumeOverlay(ctx, R);
  ctx.fillRect(L * 0.08, -R, L * 0.07, 2 * R);
  ctx.fillStyle = "rgba(0,0,0,0.28)";
  ctx.fillRect(L * 0.5, -R, 0.011, 2 * R);
  ctx.fillRect(L * 0.75, -R, 0.011, 2 * R);
  ctx.restore();
  nosePath(ctx, n, 0);
  outline(ctx);
  ctx.restore();

  // Anillo metálico de unión
  ring(ctx, x0, baseRing, PAL.grey);

  // Punta oscura (sensor)
  if (n.shape !== "blunt") {
    ctx.beginPath();
    ctx.arc(x0 + L - 0.025, 0, 0.03, 0, Math.PI * 2);
    ctx.fillStyle = PAL.dark;
    ctx.fill();
    outline(ctx, 0.008);
  }
}

export function drawBody(ctx: CanvasRenderingContext2D, t: FuelTank, x0: number, index: number) {
  const L = t.length;
  const orange = index % 2 === 0;
  const hull = orange ? PAL.orange : PAL.hull;
  const cap = Math.min(0.12, L * 0.12);

  rectVolume(ctx, x0, L, hull);

  // Paneles biselados
  const panelX = x0 + cap + 0.06;
  const panelW = L - 2 * cap - 0.12;
  if (panelW > 0.2) {
    roundRect(ctx, panelX, -R * 0.62, panelW, R * 1.24, 0.03);
    ctx.fillStyle = "rgba(0,0,0,0.1)";
    ctx.fill();
    ctx.strokeStyle = "rgba(0,0,0,0.32)";
    ctx.lineWidth = 0.011;
    ctx.stroke();
    ctx.fillStyle = "rgba(10,12,16,0.55)";
    for (const [px, py] of [
      [panelX + 0.03, -R * 0.62 + 0.03],
      [panelX + panelW - 0.03, -R * 0.62 + 0.03],
      [panelX + 0.03, R * 0.62 - 0.03],
      [panelX + panelW - 0.03, R * 0.62 - 0.03],
    ]) {
      ctx.beginPath();
      ctx.arc(px, py, 0.009, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  // Librea: franja de advertencia en un extremo y bandera en el otro (cuerpos largos)
  if (L >= 1.2) {
    hazard(ctx, x0 + cap + 0.01, 0.14);
    flagStripe(ctx, x0 + L - cap - 0.2, 0.18);
  }

  // Rótulo
  if (L >= 1.2 && panelW > 0.5) {
    ctx.save();
    ctx.fillStyle = orange ? "rgba(20,22,26,0.8)" : "rgba(30,34,40,0.75)";
    ctx.font = "bold 0.12px sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("KNSB", x0 + L / 2, 0);
    ctx.restore();
  }

  // Anillos metálicos de extremo
  ring(ctx, x0, cap, PAL.grey);
  ring(ctx, x0 + L - cap, cap, PAL.grey);

  ctx.beginPath();
  ctx.rect(x0, -R, L, 2 * R);
  outline(ctx);
}

export function drawEngine(ctx: CanvasRenderingContext2D, e: Engine, x0: number) {
  const L = e.length;
  const nozzleL = L * 0.6;
  const throatX = x0 + nozzleL;
  const exitR = R * (0.52 + 0.4 * Math.min(1, e.thrust / 110000));
  const ctrlX = x0 + nozzleL * 0.42;

  // Campana de la tobera
  const bell = () => {
    ctx.beginPath();
    ctx.moveTo(throatX, -R * 0.36);
    ctx.quadraticCurveTo(ctrlX, -R * 0.42, x0, -exitR);
    ctx.lineTo(x0, exitR);
    ctx.quadraticCurveTo(ctrlX, R * 0.42, throatX, R * 0.36);
    ctx.closePath();
  };
  bell();
  fillVolume(ctx, PAL.steel, exitR);
  // Refuerzos de la campana
  ctx.save();
  bell();
  ctx.clip();
  ctx.strokeStyle = "rgba(0,0,0,0.4)";
  ctx.lineWidth = 0.014;
  for (const t of [0.3, 0.55, 0.8]) {
    const u = 1 - t;
    const x = u * u * throatX + 2 * u * t * ctrlX + t * t * x0;
    const y = u * u * R * 0.36 + 2 * u * t * R * 0.42 + t * t * exitR;
    ctx.beginPath();
    ctx.moveTo(x, -y);
    ctx.lineTo(x, y);
    ctx.stroke();
  }
  ctx.restore();
  bell();
  outline(ctx);

  // Boca incandescente
  const gl = ctx.createRadialGradient(x0 + 0.01, 0, 0, x0 + 0.01, 0, exitR);
  gl.addColorStop(0, PAL.glow);
  gl.addColorStop(0.55, "#8a2d10");
  gl.addColorStop(1, "#150a08");
  ctx.fillStyle = gl;
  ctx.beginPath();
  ctx.ellipse(x0, 0, 0.04, exitR * 0.93, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = shade(PAL.grey, 0.3);
  ctx.lineWidth = 0.022;
  ctx.stroke();

  // Cuerpo del motor: turbobomba con tuberías y placa de montaje
  const cx = throatX;
  const cl = L - nozzleL;
  rectVolume(ctx, cx, cl, PAL.dark, R * 0.95);
  ctx.strokeStyle = shade(PAL.grey, 0.15);
  ctx.lineWidth = 0.02;
  for (const s of [-1, 1]) {
    ctx.beginPath();
    ctx.moveTo(cx + 0.02, s * R * 0.78);
    ctx.quadraticCurveTo(cx + cl * 0.5, s * R * 0.98, cx + cl - 0.1, s * R * 0.6);
    ctx.stroke();
  }
  ctx.fillStyle = "rgba(255,255,255,0.08)";
  for (let x = cx + 0.1; x < cx + cl - 0.12; x += 0.07) ctx.fillRect(x, -R * 0.8, 0.02, R * 1.6);
  ring(ctx, cx + cl - 0.07, 0.07, PAL.steel, R);
  rectVolume(ctx, cx, 0.035, PAL.orange, R * 0.95);
  ctx.beginPath();
  ctx.rect(cx, -R * 0.95, cl - 0.07, R * 1.9);
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
  const pt = (u: number, v: number, side: number): [number, number] => [tailX + u * f.length, side * (R - 0.02 + v * span)];

  for (const side of [-1, 1]) {
    // Aleta: casco gris claro con degradado hacia la punta
    const g = ctx.createLinearGradient(0, side * R, 0, side * (R + span));
    g.addColorStop(0, shade(PAL.grey, -0.2));
    g.addColorStop(0.5, shade(PAL.hull, -0.1));
    g.addColorStop(1, PAL.hull);
    ctx.beginPath();
    poly.forEach(([u, v], i) => {
      const [x, y] = pt(u, v, side);
      if (i) ctx.lineTo(x, y);
      else ctx.moveTo(x, y);
    });
    ctx.closePath();
    ctx.fillStyle = g;
    ctx.fill();
    outline(ctx, 0.016);

    // Panel interior (inset) con línea de costura
    const cu = poly.reduce((a, p) => a + p[0], 0) / poly.length;
    const cv = poly.reduce((a, p) => a + p[1], 0) / poly.length;
    ctx.beginPath();
    poly.forEach(([u, v], i) => {
      const [x, y] = pt(cu + (u - cu) * 0.72, cv + (v - cv) * 0.72, side);
      if (i) ctx.lineTo(x, y);
      else ctx.moveTo(x, y);
    });
    ctx.closePath();
    ctx.strokeStyle = "rgba(20,24,30,0.4)";
    ctx.lineWidth = 0.011;
    ctx.stroke();

    // Borde de ataque naranja (los dos últimos segmentos del polígono hacia la raíz delantera)
    ctx.strokeStyle = PAL.orange;
    ctx.lineWidth = 0.03;
    ctx.lineCap = "round";
    ctx.beginPath();
    poly.slice(-3, -1).forEach(([u, v], i) => {
      const [x, y] = pt(u, v, side);
      if (i) ctx.lineTo(x, y);
      else ctx.moveTo(x, y);
    });
    ctx.stroke();
    ctx.lineCap = "butt";

    // Soporte de raíz
    ctx.fillStyle = PAL.dark;
    ctx.fillRect(tailX, side > 0 ? R - 0.03 : -R - 0.025, f.length, 0.055);
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
      ctx.beginPath();
      ctx.rect(-0.05, -R, part.length + 0.1, 2 * R);
      fillVolume(ctx, PAL.hull, R);
      drawFins(ctx, part, 0);
      break;
    }
  }
  ctx.restore();
}
