import type { FlightInput, FlightState, PhysicsRocket } from "@/types/flight";
import { dragForce, stabilityRate, wrapAngle } from "./aerodynamics";
import { airDensity } from "./atmosphere";
import { G0 } from "./constants";
import { CHUTE_CD, SAFE_LANDING_SPEED } from "./rocketModel";

/** Paso fijo de simulación (s) */
export const PHYSICS_DT = 1 / 120;

/**
 * Un paso de Euler semi-implícito (velocidad primero, luego posición). Muta `s`.
 * Unidades SI; y = 0 es el suelo, y > 0 altitud.
 */
export function updatePhysics(s: FlightState, r: PhysicsRocket, input: FlightInput, dt: number): void {
  if (s.status === "landed" || s.status === "crashed" || s.status === "prelaunch") return;

  // 1. Empuje y pérdida de masa
  let thrust = 0;
  if (s.engineOn && s.propellant > 0) {
    const burned = Math.min(r.massFlow * dt, s.propellant);
    s.propellant -= burned;
    s.mass -= burned;
    thrust = r.thrust * (burned / (r.massFlow * dt));
    if (s.propellant <= 0) s.engineOn = false;
  }
  s.thrustNow = thrust;

  // 2. Orientación: piloto + estabilización aerodinámica (con el viento relativo)
  const speed = Math.hypot(s.vx, s.vy);
  const rho = airDensity(s.y);
  if (!s.chuteDeployed) s.theta += input.pitch * r.pitchRate * dt;
  if (s.airborne && speed > 5) {
    const flightAngle = Math.atan2(s.vy, s.vx);
    s.theta += stabilityRate(r.stabilityFactor, rho, speed) * wrapAngle(flightAngle - s.theta) * dt;
  }
  s.theta = wrapAngle(s.theta);

  // 3. Arrastre (el paracaídas aporta Cd·A propios)
  const cdA = s.chuteDeployed ? CHUTE_CD * r.chuteArea + r.cd * r.area : r.cd * r.area;
  const drag = speed > 1e-6 ? dragForce(rho, speed, 1, cdA) : 0;
  const dragX = speed > 1e-6 ? (-drag * s.vx) / speed : 0;
  const dragY = speed > 1e-6 ? (-drag * s.vy) / speed : 0;

  // 4. Fuerzas netas (sin gravedad → aceleración propia)
  const fx = thrust * Math.cos(s.theta) + dragX;
  const fy = thrust * Math.sin(s.theta) + dragY;
  s.accelG = Math.hypot(fx, fy) / s.mass / G0;
  if (s.accelG > s.maxAccelG) s.maxAccelG = s.accelG;

  // 5. Euler semi-implícito
  s.vx += (fx / s.mass) * dt;
  s.vy += (fy / s.mass) * dt - G0 * dt;
  s.x += s.vx * dt;
  s.y += s.vy * dt;
  s.t += dt;

  // 6. Estadísticas
  const v = Math.hypot(s.vx, s.vy);
  if (v > s.maxSpeed) s.maxSpeed = v;
  if (s.y > s.apogee) s.apogee = s.y;
  if (!s.airborne && s.y > 0.5) s.airborne = true;

  // 7. Suelo
  if (s.y <= 0) {
    s.y = 0;
    if (!s.airborne) {
      // Sobre la plataforma: no se hunde ni se desliza hacia atrás
      if (s.vy < 0) s.vy = 0;
      if (s.vy === 0) s.vx = 0;
    } else {
      s.status = v <= SAFE_LANDING_SPEED ? "landed" : "crashed";
      s.vx = 0;
      s.vy = 0;
      s.engineOn = false;
      s.thrustNow = 0;
      return;
    }
  }

  // 8. Fase de vuelo
  if (s.airborne) {
    if (s.propellant > 0 && s.engineOn) s.status = "boosting";
    else s.status = s.vy < 0 ? "descending" : "coasting";
  }
}
