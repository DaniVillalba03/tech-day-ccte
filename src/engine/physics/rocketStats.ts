import { getPart } from "@/data/parts";
import { KNSB } from "@/data/propellant";
import type { Engine, Fin, FuelTank, NoseCone, RocketConfig, RocketStats } from "@/types";
import { G0, P0 } from "./constants";
import { buildMassModel, staticMargin } from "./massProperties";
import { nozzleExitRadius } from "./rocketModel";

/** Cálculos estáticos del cohete ensamblado (SI). */
export function computeRocketStats(config: RocketConfig): RocketStats {
  const nose = getPart<NoseCone>(config.noseId);
  const tanks = config.tankIds.map((id) => getPart<FuelTank>(id));
  const engine = getPart<Engine>(config.engineId);
  const fin = getPart<Fin>(config.finId);

  const dryMass =
    nose.dryMass + engine.dryMass + fin.dryMass + tanks.reduce((s, t) => s + t.dryMass, 0);
  const propellantMass = tanks.reduce((s, t) => s + t.propellantMass, 0);
  const wetMass = dryMass + propellantMass;

  const massFlow = engine.thrust / (KNSB.isp * G0);
  const burnTime = massFlow > 0 ? propellantMass / massFlow : 0;
  const twr = engine.thrust / (wetMass * G0);
  const deltaV = propellantMass > 0 ? KNSB.isp * G0 * Math.log(wetMass / dryMass) : 0;

  const totalLength =
    nose.length + engine.length + tanks.reduce((s, t) => s + t.length, 0);
  const diameter = Math.max(nose.diameter, engine.diameter, ...tanks.map((t) => t.diameter));

  const model = buildMassModel(config);
  const exitArea = Math.PI * nozzleExitRadius(engine) ** 2;

  return {
    wetMass,
    dryMass,
    propellantMass,
    thrust: engine.thrust,
    massFlow,
    twr,
    burnTime,
    deltaV,
    cd: nose.cd + fin.cdPenalty,
    staticMarginLaunch: staticMargin(model, 1),
    staticMarginBurnout: staticMargin(model, 0),
    vacuumThrust: engine.thrust + P0 * exitArea,
    totalLength,
    diameter,
  };
}
