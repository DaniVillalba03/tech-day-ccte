import { getPart } from "@/data/parts";
import type { Engine, Fin, FinShape, FuelTank, NoseCone, NoseShape, RocketConfig } from "@/types";

/**
 * Propiedades de masa y aerodinámicas del cohete (modelo de Barrowman).
 * Todas las posiciones `x` se miden desde la punta de la ojiva hacia la cola (m).
 */

export interface MassComp {
  dry: number;
  /** Propelente inicial en este componente (kg) */
  prop: number;
  /** Posición del centro del componente */
  x: number;
  len: number;
}

export interface AeroPoint {
  /** Pendiente de la fuerza normal, CNα (por rad) */
  cna: number;
  /** Posición del centro de presión de este elemento */
  x: number;
}

/** Geometría de cada forma de aleta relativa a la cuerda de raíz: cuerda de punta y retroceso del borde de ataque. */
export const FIN_GEOMETRY: Record<FinShape, { tip: number; sweep: number }> = {
  rect: { tip: 1, sweep: 0 },
  trapezoid: { tip: 0.58, sweep: 0.3 },
  swept: { tip: 0.4, sweep: 0.6 },
  delta: { tip: 0.02, sweep: 0.98 },
  clipped: { tip: 0.4, sweep: 0.5 },
};

/** Posición del CP de la ojiva como fracción de su longitud */
const NOSE_CP: Record<NoseShape, number> = { conical: 0.666, ogive: 0.466, parabolic: 0.5, elliptical: 0.333, blunt: 0.4 };

const N_FINS = 4;

export interface MassModel {
  comps: MassComp[];
  aero: AeroPoint[];
  cna: number;
  cpX: number;
  length: number;
  diameter: number;
  /** Envergadura de las aletas (m) */
  finSpan: number;
}

export function buildMassModel(config: RocketConfig): MassModel {
  const nose = getPart<NoseCone>(config.noseId);
  const tanks = config.tankIds.map((id) => getPart<FuelTank>(id));
  const engine = getPart<Engine>(config.engineId);
  const fin = getPart<Fin>(config.finId);

  const comps: MassComp[] = [];
  let x = 0;
  comps.push({ dry: nose.dryMass, prop: 0, x: x + nose.length * 0.6, len: nose.length });
  x += nose.length;
  for (const t of tanks) {
    comps.push({ dry: t.dryMass, prop: t.propellantMass, x: x + t.length / 2, len: t.length });
    x += t.length;
  }
  comps.push({ dry: engine.dryMass, prop: 0, x: x + engine.length / 2, len: engine.length });
  x += engine.length;
  const length = x;
  const diameter = Math.max(nose.diameter, engine.diameter, ...tanks.map((t) => t.diameter));

  // Aletas: el borde de fuga de la raíz queda 0.3 veces la longitud del motor por delante de la cola
  const g = FIN_GEOMETRY[fin.shape];
  const cr = fin.length;
  const ct = cr * g.tip;
  const xm = cr * g.sweep;
  const span = (fin.diameter - diameter) / 2;
  const xLead = length - engine.length * 0.3 - cr;
  comps.push({ dry: fin.dryMass, prop: 0, x: xLead + cr * 0.55, len: cr });

  // Barrowman: ojiva + aletas (el tubo cilíndrico aporta ~0)
  const aero: AeroPoint[] = [{ cna: 2, x: nose.length * NOSE_CP[nose.shape] }];
  const midChord = Math.hypot(span, xm + (ct - cr) / 2);
  const finCna =
    ((4 * N_FINS * (span / diameter) ** 2) / (1 + Math.sqrt(1 + ((2 * midChord) / (cr + ct)) ** 2))) *
    (1 + diameter / 2 / (span + diameter / 2));
  const finCp = xLead + (xm / 3) * ((cr + 2 * ct) / (cr + ct)) + (1 / 6) * (cr + ct - (cr * ct) / (cr + ct));
  aero.push({ cna: finCna, x: finCp });

  const cna = aero.reduce((a, p) => a + p.cna, 0);
  const cpX = aero.reduce((a, p) => a + p.cna * p.x, 0) / cna;
  return { comps, aero, cna, cpX, length, diameter, finSpan: span };
}

export interface MassState {
  mass: number;
  /** Centro de gravedad desde la nariz (m) */
  cg: number;
  /** Momento de inercia respecto al CG (kg·m²) */
  inertia: number;
}

/** Masa, CG e inercia con una fracción `propFrac` (0..1) del propelente restante, repartido uniformemente. */
export function massState(comps: MassComp[], propFrac: number): MassState {
  let m = 0;
  let mx = 0;
  for (const c of comps) {
    const cm = c.dry + c.prop * propFrac;
    m += cm;
    mx += cm * c.x;
  }
  const cg = mx / m;
  let inertia = 0;
  for (const c of comps) {
    const cm = c.dry + c.prop * propFrac;
    inertia += cm * ((c.len * c.len) / 12 + (c.x - cg) ** 2);
  }
  return { mass: m, cg, inertia };
}

/** Margen estático en calibres: (CP − CG) / diámetro. > 1 estable, < 0 inestable. */
export function staticMargin(model: MassModel, propFrac: number): number {
  const { cg } = massState(model.comps, propFrac);
  return (model.cpX - cg) / model.diameter;
}
