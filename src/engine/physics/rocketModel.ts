import { getPart } from "@/data/parts";
import { KNSB } from "@/data/propellant";
import type { Engine, Fin, NoseCone, RocketConfig } from "@/types";
import type { FlightState, PhysicsRocket } from "@/types/flight";
import { G0 } from "./constants";
import { buildMassModel } from "./massProperties";

export const CHUTE_CD = 1.5;
/** Velocidad máxima de contacto (m/s) para considerar un aterrizaje seguro */
export const SAFE_LANDING_SPEED = 10;
/** Presión dinámica máxima (Pa) a la que el paracaídas puede abrirse sin destruirse (~120 m/s a nivel del mar) */
export const CHUTE_MAX_Q = 9000;
/** Tiempo de apertura del paracaídas (s) */
export const CHUTE_OPEN_TIME = 1.8;
/** Longitud del riel de lanzamiento (m): durante este tramo la orientación es fija */
export const RAIL_LENGTH = 6;

/** Radio de salida de la tobera (m): crece con el empuje */
export function nozzleExitRadius(e: Engine): number {
  return 0.3 * (0.52 + 0.4 * Math.min(1, e.thrust / 110000));
}

export function buildPhysicsRocket(config: RocketConfig): PhysicsRocket {
  const m = buildMassModel(config);
  const engine = getPart<Engine>(config.engineId);
  const dry = m.comps.reduce((a, c) => a + c.dry, 0);
  const prop = m.comps.reduce((a, c) => a + c.prop, 0);
  // Arrastre: ojiva + penalización de aletas (misma fórmula que las estadísticas estáticas)
  const cd = cdOf(config);
  return {
    dryMass: dry,
    propellantMass: prop,
    thrust: engine.thrust,
    massFlow: engine.thrust / (KNSB.isp * G0),
    cd,
    area: Math.PI * (m.diameter / 2) ** 2,
    chuteArea: 0.3 * dry,
    length: m.length,
    diameter: m.diameter,
    exitArea: Math.PI * nozzleExitRadius(engine) ** 2,
    comps: m.comps,
    aero: m.aero,
    cna: m.cna,
    cpX: m.cpX,
  };
}

function cdOf(config: RocketConfig): number {
  const nose = getPart<NoseCone>(config.noseId);
  const fin = getPart<Fin>(config.finId);
  return nose.cd + fin.cdPenalty;
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
    omega: 0,
    burnTime: 0,
    onRail: true,
    railS: 0,
    chuteTime: -1,
    chuteFailed: false,
    mach: 0,
    dynPressure: 0,
    aoa: 0,
    maxQ: 0,
    maxMach: 0,
    thrustNow: 0,
    status: "prelaunch",
  };
}
