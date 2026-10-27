import { getPart } from "@/data/parts";
import type { Fin, RocketConfig } from "@/types";
import type { FlightState, PhysicsRocket } from "@/types/flight";
import { computeRocketStats } from "./rocketStats";

export const CHUTE_CD = 1.5;
/** Velocidad máxima de contacto (m/s) para considerar un aterrizaje seguro */
export const SAFE_LANDING_SPEED = 10;

export function buildPhysicsRocket(config: RocketConfig): PhysicsRocket {
  const s = computeRocketStats(config);
  const fin = getPart<Fin>(config.finId);
  return {
    dryMass: s.dryMass,
    propellantMass: s.propellantMass,
    thrust: s.thrust,
    massFlow: s.massFlow,
    cd: s.cd,
    area: Math.PI * (s.diameter / 2) ** 2,
    stabilityFactor: fin.stabilityFactor,
    pitchRate: fin.pitchRate,
    chuteArea: 0.3 * s.dryMass,
    length: s.totalLength,
  };
}

export function createInitialState(rocket: PhysicsRocket, launchAngleDeg: number): FlightState {
  return {
    t: 0,
    x: 0,
    y: 0,
    vx: 0,
    vy: 0,
    theta: (launchAngleDeg * Math.PI) / 180,
    mass: rocket.dryMass + rocket.propellantMass,
    propellant: rocket.propellantMass,
    propellantMax: rocket.propellantMass,
    engineOn: false,
    chuteDeployed: false,
    airborne: false,
    apogee: 0,
    maxSpeed: 0,
    accelG: 0,
    maxAccelG: 0,
    thrustNow: 0,
    status: "prelaunch",
  };
}
