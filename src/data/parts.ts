import type { Engine, Fin, FuelTank, NoseCone, Part } from "@/types";

/** Máximo de tanques apilables */
export const MAX_TANKS = 4;

export const NOSES: NoseCone[] = [
  { id: "nose-cone", name: "Ojiva cónica", category: "nose", dryMass: 25, length: 1.2, diameter: 0.6, cd: 0.3 },
  { id: "nose-ogive", name: "Ojiva ojival", category: "nose", dryMass: 35, length: 1.5, diameter: 0.6, cd: 0.22 },
  { id: "nose-blunt", name: "Ojiva roma", category: "nose", dryMass: 15, length: 0.6, diameter: 0.6, cd: 0.6 },
];

export const TANKS: FuelTank[] = [
  { id: "tank-s", name: "Tanque S", category: "tank", dryMass: 50, propellantMass: 150, length: 1.5, diameter: 0.6 },
  { id: "tank-m", name: "Tanque M", category: "tank", dryMass: 100, propellantMass: 350, length: 2.5, diameter: 0.6 },
  { id: "tank-l", name: "Tanque L", category: "tank", dryMass: 200, propellantMass: 800, length: 4, diameter: 0.6 },
];

export const ENGINES: Engine[] = [
  { id: "eng-spark", name: "Spark", category: "engine", dryMass: 80, thrust: 18000, isp: 110, length: 1, diameter: 0.6 },
  { id: "eng-vector", name: "Vector", category: "engine", dryMass: 150, thrust: 35000, isp: 130, length: 1.2, diameter: 0.6 },
  { id: "eng-titan", name: "Titán", category: "engine", dryMass: 300, thrust: 70000, isp: 150, length: 1.5, diameter: 0.6 },
];

export const FINS: Fin[] = [
  { id: "fin-small", name: "Aletas pequeñas", category: "fin", dryMass: 15, stabilityFactor: 0.5, pitchRate: 0.9, cdPenalty: 0.02, length: 0.8, diameter: 1.0 },
  { id: "fin-medium", name: "Aletas medianas", category: "fin", dryMass: 30, stabilityFactor: 1.0, pitchRate: 0.6, cdPenalty: 0.05, length: 1.0, diameter: 1.3 },
  { id: "fin-large", name: "Aletas grandes", category: "fin", dryMass: 50, stabilityFactor: 1.6, pitchRate: 0.35, cdPenalty: 0.1, length: 1.3, diameter: 1.7 },
];

export const ALL_PARTS: Part[] = [...NOSES, ...TANKS, ...ENGINES, ...FINS];

const byId = new Map<string, Part>(ALL_PARTS.map((p) => [p.id, p]));

export function getPart<T extends Part>(id: string): T {
  const part = byId.get(id);
  if (!part) throw new Error(`Pieza desconocida: ${id}`);
  return part as T;
}
