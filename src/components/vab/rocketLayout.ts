import { getPart } from "@/data/parts";
import { ROCKET_RADIUS, rocketLength } from "@/engine/render/rocketSprite";
import type { Engine, Fin, FuelTank, NoseCone, PartCategory, RocketConfig } from "@/types";

export const PREVIEW_W = 260;
export const PREVIEW_H = 520;

/** Pieza seleccionada en el cohete: `index` es la posición del cuerpo (0 = el más cercano a la ojiva). */
export interface Selection {
  kind: PartCategory;
  index: number;
}

export interface Zone extends Selection {
  /** Rectángulo en píxeles del canvas */
  x: number;
  y: number;
  w: number;
  h: number;
}

export const sameSelection = (a: Selection | null, b: Selection | null) =>
  !!a && !!b && a.kind === b.kind && a.index === b.index;

/** Disposición vertical del cohete (nariz arriba, cola abajo) usada para dibujar y para detectar clics. */
export function layoutRocket(config: RocketConfig) {
  const nose = getPart<NoseCone>(config.noseId);
  const engine = getPart<Engine>(config.engineId);
  const fin = getPart<Fin>(config.finId);
  const L = rocketLength(config);
  const s = Math.min((PREVIEW_H - 80) / L, 90);
  const cx = PREVIEW_W / 2;
  const top = (PREVIEW_H - L * s) / 2;
  const half = ROCKET_RADIUS * s;
  const pad = 6;
  const zones: Zone[] = [];

  let y = top;
  zones.push({ kind: "nose", index: 0, x: cx - half - pad, y, w: 2 * half + 2 * pad, h: nose.length * s });
  y += nose.length * s;
  config.tankIds.forEach((id, i) => {
    const h = getPart<FuelTank>(id).length * s;
    zones.push({ kind: "tank", index: i, x: cx - half - pad, y, w: 2 * half + 2 * pad, h });
    y += h;
  });
  zones.push({ kind: "engine", index: 0, x: cx - half - pad, y, w: 2 * half + 2 * pad, h: engine.length * s });

  const span = ((fin.diameter - 0.6) / 2 + 0.05) * s;
  const bottom = top + L * s;
  zones.push({
    kind: "fin",
    index: 0,
    x: cx - half - span - pad,
    y: bottom - engine.length * s * 0.3 - fin.length * s,
    w: 2 * (half + span) + 2 * pad,
    h: fin.length * s,
  });

  return { s, cx, top, bottom, half, zones };
}

/** Zona bajo el punto (px, py). Las aletas solo cuentan fuera del cuerpo, donde sobresalen. */
export function hitTest(zones: Zone[], px: number, py: number, cx: number, half: number): Zone | null {
  const inside = (z: Zone) => px >= z.x && px <= z.x + z.w && py >= z.y && py <= z.y + z.h;
  const fin = zones.find((z) => z.kind === "fin");
  if (fin && inside(fin) && Math.abs(px - cx) > half + 2) return fin;
  return zones.find((z) => z.kind !== "fin" && inside(z)) ?? null;
}
