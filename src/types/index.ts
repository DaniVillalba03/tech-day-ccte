export type PartCategory = "nose" | "tank" | "engine" | "fin";

interface PartBase {
  id: string;
  name: string;
  category: PartCategory;
  /** Masa seca en kg */
  dryMass: number;
  /** Longitud en m (para el preview) */
  length: number;
  /** Diámetro en m */
  diameter: number;
}

export interface NoseCone extends PartBase {
  category: "nose";
  /** Coeficiente de arrastre aportado */
  cd: number;
}

export interface FuelTank extends PartBase {
  category: "tank";
  /** Masa de propelente en kg */
  propellantMass: number;
}

export interface Engine extends PartBase {
  category: "engine";
  /** Empuje en N */
  thrust: number;
  /** Impulso específico en s */
  isp: number;
}

export interface Fin extends PartBase {
  category: "fin";
  /** Estabilidad aerodinámica (adimensional) */
  stabilityFactor: number;
  /** Velocidad de rotación (pitch) en rad/s */
  pitchRate: number;
  /** Arrastre extra que añaden las aletas */
  cdPenalty: number;
}

export type Part = NoseCone | FuelTank | Engine | Fin;

export interface RocketConfig {
  name: string;
  noseId: string;
  tankIds: string[];
  engineId: string;
  finId: string;
  /** 15–90 grados sobre la horizontal */
  launchAngleDeg: number;
}

export interface RocketStats {
  wetMass: number;
  dryMass: number;
  propellantMass: number;
  thrust: number;
  /** kg/s */
  massFlow: number;
  twr: number;
  burnTime: number;
  deltaV: number;
  cd: number;
  totalLength: number;
  diameter: number;
}
