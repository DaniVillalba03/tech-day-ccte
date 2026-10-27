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

export type NoseShape = "conical" | "ogive" | "parabolic" | "elliptical" | "blunt";
export type FinShape = "rect" | "trapezoid" | "swept" | "delta" | "clipped";

export interface NoseCone extends PartBase {
  category: "nose";
  shape: NoseShape;
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
  /** Empuje en N. El impulso específico lo fija el propelente (KNSB). */
  thrust: number;
}

export interface Fin extends PartBase {
  category: "fin";
  shape: FinShape;
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
  /** Margen estático (calibres) al lanzamiento y con el propelente agotado */
  staticMarginLaunch: number;
  staticMarginBurnout: number;
  /** Empuje en el vacío (N) */
  vacuumThrust: number;
  totalLength: number;
  diameter: number;
}
