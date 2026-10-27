/** Sprites procedurales (se generan una vez en canvas fuera de pantalla). */

export interface Sprites {
  clouds: HTMLCanvasElement[];
  smoke: HTMLCanvasElement;
  dust: HTMLCanvasElement;
  glowWarm: HTMLCanvasElement;
  glowWhite: HTMLCanvasElement;
}

/** Generador pseudoaleatorio determinista (mulberry32) */
function rng(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function makeCanvas(size: number): [HTMLCanvasElement, CanvasRenderingContext2D] {
  const c = document.createElement("canvas");
  c.width = c.height = size;
  return [c, c.getContext("2d")!];
}

function blob(ctx: CanvasRenderingContext2D, x: number, y: number, r: number, rgb: string, a: number) {
  const g = ctx.createRadialGradient(x, y, 0, x, y, r);
  g.addColorStop(0, `rgba(${rgb},${a})`);
  g.addColorStop(0.65, `rgba(${rgb},${a * 0.85})`);
  g.addColorStop(0.88, `rgba(${rgb},${a * 0.35})`);
  g.addColorStop(1, `rgba(${rgb},0)`);
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fill();
}

/** Nube cúmulo: muchas manchas suaves con luz arriba y base sombreada, con borde de luz del sol. */
function makeCloud(seed: number): HTMLCanvasElement {
  const size = 384;
  const [c, ctx] = makeCanvas(size);
  const rand = rng(seed);
  for (let i = 0; i < 90; i++) {
    const a = rand() * Math.PI * 2;
    const d = Math.sqrt(rand()) * size * 0.32;
    const x = size / 2 + Math.cos(a) * d * 1.3;
    const y = size * 0.58 + Math.sin(a) * d * 0.55 - Math.max(0, 1 - Math.abs(Math.cos(a)) * 1.4) * size * 0.1;
    blob(ctx, x, y, size * (0.05 + rand() * 0.13), "255,253,248", 0.7 + rand() * 0.3);
  }
  // Sombreado: base azulada y cálida arriba (luz del amanecer)
  ctx.globalCompositeOperation = "source-atop";
  const g = ctx.createLinearGradient(0, size * 0.2, 0, size * 0.85);
  g.addColorStop(0, "rgba(255,238,212,0.3)");
  g.addColorStop(0.5, "rgba(255,255,255,0)");
  g.addColorStop(1, "rgba(112,130,168,0.78)");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, size, size);
  return c;
}

function makeSmoke(rgb: string, seed: number): HTMLCanvasElement {
  const size = 128;
  const [c, ctx] = makeCanvas(size);
  const rand = rng(seed);
  for (let i = 0; i < 16; i++) {
    const a = rand() * Math.PI * 2;
    const d = Math.sqrt(rand()) * size * 0.22;
    blob(ctx, size / 2 + Math.cos(a) * d, size / 2 + Math.sin(a) * d, size * (0.14 + rand() * 0.16), rgb, 0.5 + rand() * 0.35);
  }
  return c;
}

function makeGlow(rgb: string): HTMLCanvasElement {
  const size = 128;
  const [c, ctx] = makeCanvas(size);
  const g = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
  g.addColorStop(0, `rgba(${rgb},1)`);
  g.addColorStop(0.25, `rgba(${rgb},0.55)`);
  g.addColorStop(0.6, `rgba(${rgb},0.15)`);
  g.addColorStop(1, `rgba(${rgb},0)`);
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, size, size);
  return c;
}

let cache: Sprites | null = null;

export function getSprites(): Sprites {
  if (!cache) {
    cache = {
      clouds: [makeCloud(7), makeCloud(19), makeCloud(41)],
      smoke: makeSmoke("238,238,240", 11),
      dust: makeSmoke("196,176,140", 23),
      glowWarm: makeGlow("255,170,70"),
      glowWhite: makeGlow("255,244,220"),
    };
  }
  return cache;
}
