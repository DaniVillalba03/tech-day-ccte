import type { Engine, Fin, FuelTank, NoseCone, Part } from "@/types";

/** Máximo de cuerpos de propelente apilables (cohete de una sola etapa) */
export const MAX_TANKS = 4;

export const NOSES: NoseCone[] = [
  { id: "nose-cone", name: "Ojiva cónica", category: "nose", shape: "conical", dryMass: 25, length: 1.2, diameter: 0.6, cd: 0.3 },
  { id: "nose-ogive", name: "Ojiva ojival", category: "nose", shape: "ogive", dryMass: 35, length: 1.5, diameter: 0.6, cd: 0.22 },
  { id: "nose-parabolic", name: "Ojiva parabólica", category: "nose", shape: "parabolic", dryMass: 30, length: 1.4, diameter: 0.6, cd: 0.25 },
  { id: "nose-elliptic", name: "Ojiva elíptica", category: "nose", shape: "elliptical", dryMass: 28, length: 1.0, diameter: 0.6, cd: 0.35 },
  { id: "nose-blunt", name: "Ojiva roma", category: "nose", shape: "blunt", dryMass: 15, length: 0.6, diameter: 0.6, cd: 0.6 },
];

export const TANKS: FuelTank[] = [
  { id: "tank-xs", name: "Cuerpo KNSB XS", category: "tank", dryMass: 30, propellantMass: 80, length: 1.0, diameter: 0.6 },
  { id: "tank-s", name: "Cuerpo KNSB S", category: "tank", dryMass: 50, propellantMass: 150, length: 1.5, diameter: 0.6 },
  { id: "tank-m", name: "Cuerpo KNSB M", category: "tank", dryMass: 100, propellantMass: 350, length: 2.5, diameter: 0.6 },
  { id: "tank-l", name: "Cuerpo KNSB L", category: "tank", dryMass: 200, propellantMass: 800, length: 4, diameter: 0.6 },
  { id: "tank-xl", name: "Cuerpo KNSB XL", category: "tank", dryMass: 320, propellantMass: 1400, length: 5, diameter: 0.6 },
];

export const ENGINES: Engine[] = [
  { id: "eng-needle", name: "Aguja", category: "engine", dryMass: 40, thrust: 9000, length: 0.8, diameter: 0.6 },
  { id: "eng-spark", name: "Spark", category: "engine", dryMass: 80, thrust: 18000, length: 1, diameter: 0.6 },
  { id: "eng-vector", name: "Vector", category: "engine", dryMass: 150, thrust: 35000, length: 1.2, diameter: 0.6 },
  { id: "eng-pulsar", name: "Pulsar", category: "engine", dryMass: 220, thrust: 50000, length: 1.3, diameter: 0.6 },
  { id: "eng-titan", name: "Titán", category: "engine", dryMass: 300, thrust: 70000, length: 1.5, diameter: 0.6 },
  { id: "eng-colossus", name: "Coloso", category: "engine", dryMass: 450, thrust: 110000, length: 1.8, diameter: 0.6 },
];

export const FINS: Fin[] = [
  { id: "fin-small", name: "Aletas rectas", category: "fin", shape: "rect", dryMass: 15, stabilityFactor: 0.5, pitchRate: 0.9, cdPenalty: 0.02, length: 0.8, diameter: 1.0 },
  { id: "fin-clipped", name: "Aletas recortadas", category: "fin", shape: "clipped", dryMass: 25, stabilityFactor: 0.8, pitchRate: 0.75, cdPenalty: 0.04, length: 1.0, diameter: 1.2 },
  { id: "fin-medium", name: "Aletas trapezoidales", category: "fin", shape: "trapezoid", dryMass: 30, stabilityFactor: 1.0, pitchRate: 0.6, cdPenalty: 0.05, length: 1.0, diameter: 1.3 },
  { id: "fin-delta", name: "Aletas delta", category: "fin", shape: "delta", dryMass: 35, stabilityFactor: 1.2, pitchRate: 0.5, cdPenalty: 0.07, length: 1.4, diameter: 1.5 },
  { id: "fin-large", name: "Aletas en flecha", category: "fin", shape: "swept", dryMass: 50, stabilityFactor: 1.6, pitchRate: 0.35, cdPenalty: 0.1, length: 1.3, diameter: 1.7 },
];

export const ALL_PARTS: Part[] = [...NOSES, ...TANKS, ...ENGINES, ...FINS];

const byId = new Map<string, Part>(ALL_PARTS.map((p) => [p.id, p]));

export function getPart<T extends Part>(id: string): T {
  const part = byId.get(id);
  if (!part) throw new Error(`Pieza desconocida: ${id}`);
  return part as T;
}
