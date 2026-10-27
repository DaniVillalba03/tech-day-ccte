import { getPart } from "@/data/parts";
import type { Engine, Fin, FuelTank, NoseCone, RocketConfig } from "@/types";
import { drawBody, drawEngine, drawFins, drawNose, R } from "./partArt";

export function rocketLength(config: RocketConfig): number {
  const nose = getPart<NoseCone>(config.noseId);
  const engine = getPart<Engine>(config.engineId);
  return nose.length + engine.length + config.tankIds.reduce((s, id) => s + getPart<FuelTank>(id).length, 0);
}

/**
 * Dibuja el cohete horizontal en metros con el origen en su centro, nariz hacia +x.
 * El llamador aplica translate/rotate/scale.
 */
export function drawRocketSprite(ctx: CanvasRenderingContext2D, config: RocketConfig) {
  const nose = getPart<NoseCone>(config.noseId);
  const tanks = config.tankIds.map((id) => getPart<FuelTank>(id));
  const engine = getPart<Engine>(config.engineId);
  const fin = getPart<Fin>(config.finId);
  const L = rocketLength(config);
  let x = -L / 2;

  // Las aletas van detrás del fuselaje
  drawFins(ctx, fin, x + engine.length * 0.3);

  drawEngine(ctx, engine, x);
  x += engine.length;
  // tankIds[0] es el cuerpo más cercano a la ojiva: se dibuja de cola a nariz en orden inverso
  for (let k = tanks.length - 1; k >= 0; k--) {
    drawBody(ctx, tanks[k], x, k);
    x += tanks[k].length;
  }
  drawNose(ctx, nose, x);

}

export { R as ROCKET_RADIUS };
