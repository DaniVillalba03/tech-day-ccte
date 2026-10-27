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
  /** Empuje aplicado en el último paso (N), para partículas */
  thrustNow: number;
  status: FlightStatus;
}

export interface FlightInput {
  /** +1 = A / ←  (aumenta theta), -1 = D / → */
  pitch: -1 | 0 | 1;
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
  stabilityFactor: number;
  pitchRate: number;
  /** Área del paracaídas en m² (dimensionada para ~6 m/s de velocidad terminal) */
  chuteArea: number;
  /** Longitud total en m */
  length: number;
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
  duration: number;
  samples: TelemetrySample[];
}
