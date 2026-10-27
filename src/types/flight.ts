import type { AeroPoint, MassComp } from "@/engine/physics/massProperties";

export type FlightStatus = "prelaunch" | "boosting" | "coasting" | "descending" | "landed" | "crashed";

/** Estado de simulación en SI: x horizontal (m), y altitud (m, 0 = suelo), theta desde la horizontal (rad). */
export interface FlightState {
  t: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  theta: number;
  mass: number;
  propellant: number;
  propellantMax: number;
  engineOn: boolean;
  chuteDeployed: boolean;
  airborne: boolean;
  apogee: number;
  maxSpeed: number;
  /** Aceleración propia (sin gravedad) en G */
  accelG: number;
  maxAccelG: number;
  /** Velocidad angular de cabeceo (rad/s) */
  omega: number;
  /** Tiempo de combustión acumulado (s) */
  burnTime: number;
  /** En el riel de lanzamiento: orientación fija */
  onRail: boolean;
  /** Distancia recorrida por el riel (m) */
  railS: number;
  /** Instante de apertura del paracaídas (s), -1 si no se abrió */
  chuteTime: number;
  /** El paracaídas se abrió a demasiada presión dinámica y se destruyó */
  chuteFailed: boolean;
  mach: number;
  /** Presión dinámica (Pa) */
  dynPressure: number;
  /** Ángulo de ataque (rad) */
  aoa: number;
  maxQ: number;
  maxMach: number;
  /** Empuje aplicado en el último paso (N), para partículas */
  thrustNow: number;
  status: FlightStatus;
}

/** Parámetros físicos del cohete ya resueltos (SI). */
export interface PhysicsRocket {
  dryMass: number;
  propellantMass: number;
  thrust: number;
  massFlow: number;
  cd: number;
  /** Área frontal en m² */
  area: number;
  /** Área del paracaídas en m² (dimensionada para ~6 m/s de velocidad terminal) */
  chuteArea: number;
  /** Longitud total en m */
  length: number;
  diameter: number;
  /** Área de salida de la tobera (m²), para el empuje según la presión ambiente */
  exitArea: number;
  /** Componentes de masa y puntos aerodinámicos (modelo de Barrowman) */
  comps: MassComp[];
  aero: AeroPoint[];
  /** Pendiente total de la fuerza normal, CNα (por rad) */
  cna: number;
  /** Centro de presión (m desde la nariz) */
  cpX: number;
}

/** Datos mínimos que la UI lee a ~10 Hz. */
export interface FlightSnapshot {
  t: number;
  altitude: number;
  apogee: number;
  distance: number;
  speed: number;
  accelG: number;
  fuelPct: number;
  thetaDeg: number;
  /** Ángulo del vector velocidad (desde la horizontal) */
  pathDeg: number;
  status: FlightStatus;
  warp: number;
  chuteDeployed: boolean;
  chuteFailed: boolean;
  mach: number;
  /** Presión dinámica (Pa) */
  dynPressure: number;
  /** Ángulo de ataque (grados) */
  aoaDeg: number;
  /** Viento en x (m/s) */
  wind: number;
  onRail: boolean;
}

export interface TelemetrySample {
  t: number;
  altitude: number;
  speed: number;
}

/** Resultado final de un vuelo, para el resumen y el ranking. */
export interface FlightResult {
  status: "landed" | "crashed";
  apogee: number;
  distance: number;
  maxSpeed: number;
  maxAccelG: number;
  maxQ: number;
  maxMach: number;
  duration: number;
  samples: TelemetrySample[];
}
