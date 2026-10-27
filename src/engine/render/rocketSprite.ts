import { getPart } from "@/data/parts";
import type { Engine, Fin, FuelTank, NoseCone, RocketConfig } from "@/types";

/**
 * Dibuja el cohete horizontal en metros con el origen en su centro, nariz hacia +x.
 * El llamador aplica translate/rotate/scale.
 */
export function drawRocketSprite(ctx: CanvasRenderingContext2D, config: RocketConfig, chute: boolean) {
  const nose = getPart<NoseCone>(config.noseId);
  const tanks = config.tankIds.map((id) => getPart<FuelTank>(id));
  const engine = getPart<Engine>(config.engineId);
  const fin = getPart<Fin>(config.finId);
  const L = nose.length + engine.length + tanks.reduce((s, t) => s + t.length, 0);
  const R = 0.3;
  let x = -L / 2;

  // Aletas (detrás)
  ctx.fillStyle = "#244b8f";
  const finSpan = (fin.diameter - 0.6) / 2 + R;
  for (const d of [-1, 1]) {
    ctx.beginPath();
    ctx.moveTo(x + fin.length, d * R);
    ctx.lineTo(x - fin.length * 0.1, d * finSpan);
    ctx.lineTo(x, d * R);
    ctx.fill();
  }

  // Motor
  ctx.fillStyle = "#31363e";
  ctx.beginPath();
  ctx.moveTo(x, -R * 0.55);
  ctx.lineTo(x + engine.length * 0.4, -R * 0.35);
  ctx.lineTo(x + engine.length, -R * 0.7);
  ctx.lineTo(x + engine.length, R * 0.7);
  ctx.lineTo(x + engine.length * 0.4, R * 0.35);
  ctx.lineTo(x, R * 0.55);
  ctx.fill();
  x += engine.length;

  // Tanques
  tanks.forEach((t, i) => {
    ctx.fillStyle = i % 2 ? "#d52b32" : "#b8242a";
    ctx.fillRect(x, -R, t.length, 2 * R);
    ctx.fillStyle = "rgba(10,12,15,0.4)";
    ctx.fillRect(x + t.length - 0.04, -R, 0.04, 2 * R);
    x += t.length;
  });

  // Ojiva
  const blunt = nose.cd > 0.5;
  ctx.fillStyle = "#f9f9f7";
  ctx.beginPath();
  ctx.moveTo(x, -R);
  ctx.quadraticCurveTo(x + nose.length * (blunt ? 0.9 : 0.5), -R, x + nose.length, 0);
  ctx.quadraticCurveTo(x + nose.length * (blunt ? 0.9 : 0.5), R, x, R);
  ctx.fill();

  if (chute) {
    ctx.strokeStyle = "#f9f9f7";
    ctx.lineWidth = 0.05;
    ctx.beginPath();
    ctx.moveTo(L / 2, 0);
    ctx.lineTo(L / 2 + 4, -2.5);
    ctx.moveTo(L / 2, 0);
    ctx.lineTo(L / 2 + 4, 2.5);
    ctx.stroke();
    ctx.fillStyle = "#d52b32";
    ctx.beginPath();
    ctx.ellipse(L / 2 + 5, 0, 1.2, 3.2, 0, 0, Math.PI * 2);
    ctx.fill();
  }
}
