import { P0 } from "./constants";

export interface Atmosphere {
  /** kg/m³ */
  density: number;
  /** Pa */
  pressure: number;
  /** K */
  temperature: number;
  /** Velocidad del sonido (m/s) */
  sound: number;
}

const R_AIR = 287.053;
const G_STD = 9.80665;
const GAMMA = 1.4;

/** Atmósfera estándar internacional (ISA): [altitud base (m), temperatura base (K), gradiente (K/m)] */
const LAYERS: [number, number, number][] = [
  [0, 288.15, -0.0065],
  [11000, 216.65, 0],
  [20000, 216.65, 0.001],
  [32000, 228.65, 0.0028],
  [47000, 270.65, 0],
  [51000, 270.65, -0.0028],
  [71000, 214.65, -0.002],
];
const TOP = 86000;

/** Presión en la base de cada capa, calculada una vez */
const BASE_P: number[] = [P0];
for (let i = 1; i < LAYERS.length; i++) {
  const [h0, t0, l0] = LAYERS[i - 1];
  const dh = LAYERS[i][0] - h0;
  const p0 = BASE_P[i - 1];
  BASE_P.push(l0 === 0 ? p0 * Math.exp((-G_STD * dh) / (R_AIR * t0)) : p0 * Math.pow((t0 + l0 * dh) / t0, -G_STD / (R_AIR * l0)));
}

function layerState(h: number): { p: number; t: number } {
  let i = LAYERS.length - 1;
  while (i > 0 && h < LAYERS[i][0]) i--;
  const [h0, t0, l0] = LAYERS[i];
  const dh = h - h0;
  if (l0 === 0) return { p: BASE_P[i] * Math.exp((-G_STD * dh) / (R_AIR * t0)), t: t0 };
  const t = t0 + l0 * dh;
  return { p: BASE_P[i] * Math.pow(t / t0, -G_STD / (R_AIR * l0)), t };
}

const TOP_STATE = layerState(TOP);
const TOP_DENSITY = TOP_STATE.p / (R_AIR * TOP_STATE.t);

/** Atmósfera estándar ISA hasta 86 km; por encima, decaimiento exponencial. */
export function atmosphere(altitude: number): Atmosphere {
  const h = Math.max(altitude, 0);
  if (h <= TOP) {
    const { p, t } = layerState(h);
    return { density: p / (R_AIR * t), pressure: p, temperature: t, sound: Math.sqrt(GAMMA * R_AIR * t) };
  }
  const k = Math.exp(-(h - TOP) / 6000);
  const t = TOP_STATE.t;
  return {
    density: TOP_DENSITY * k,
    pressure: TOP_STATE.p * k,
    temperature: t,
    sound: Math.sqrt(GAMMA * R_AIR * t),
  };
}

export function airDensity(altitude: number): number {
  return atmosphere(altitude).density;
}
