import type { FlightState, PhysicsRocket } from "@/types/flight";
import { machDragFactor, windAt, wrapAngle } from "./aerodynamics";
import { atmosphere } from "./atmosphere";
import { G0, P0 } from "./constants";
import { gravityAt } from "./gravity";
import { massState } from "./massProperties";
import { CHUTE_CD, CHUTE_MAX_Q, CHUTE_OPEN_TIME, RAIL_LENGTH, SAFE_LANDING_SPEED } from "./rocketModel";

/** Paso fijo de simulación (s) */
export const PHYSICS_DT = 1 / 120;

/** Rampa de encendido del motor (s) y fracción final de propelente con empuje decreciente */
const IGNITION_RAMP = 0.25;
const TAIL_OFF_FRACTION = 0.06;
/** Coeficiente de arrastre de flujo cruzado (cuerpo cilíndrico de lado) */
const CROSSFLOW_CD = 0.9;
const MAX_OMEGA = 25;

const smoothstep = (t: number) => {
  const x = Math.min(1, Math.max(0, t));
  return x * x * (3 - 2 * x);
};

/**
 * Un paso de Euler semi-implícito (velocidades primero, luego posiciones). Muta `s`.
 * SI: y = 0 es el suelo, x horizontal, theta desde la horizontal.
 *
 * Modelo: atmósfera estándar, gravedad variable con la altitud, empuje según la presión ambiente,
 * arrastre dependiente del Mach, viento, fuerza normal y momento aerodinámico (Barrowman) con
 * dinámica de rotación respecto al centro de gravedad, riel de lanzamiento y paracaídas con apertura gradual.
 */
export function updatePhysics(s: FlightState, r: PhysicsRocket, dt: number): void {
  if (s.status === "landed" || s.status === "crashed" || s.status === "prelaunch") return;

  const h = Math.max(s.y, 0);
  const atm = atmosphere(h);
  const g = gravityAt(h);

  // 1. Empuje: rampa de encendido, cola de combustión y corrección por presión ambiente
  let thrust = 0;
  if (s.engineOn && s.propellant > 0) {
    s.burnTime += dt;
    const fracNow = s.propellant / s.propellantMax;
    const ramp = Math.min(1, s.burnTime / IGNITION_RAMP);
    const tail = fracNow < TAIL_OFF_FRACTION ? Math.max(0.2, fracNow / TAIL_OFF_FRACTION) : 1;
    const mult = ramp * tail;
    const want = r.massFlow * mult * dt;
    const burned = Math.min(want, s.propellant);
    s.propellant -= burned;
    s.mass -= burned;
    thrust = Math.max(0, r.thrust + (P0 - atm.pressure) * r.exitArea) * mult * (want > 0 ? burned / want : 0);
    if (s.propellant <= 1e-9) {
      s.propellant = 0;
      s.engineOn = false;
    }
  }
  s.thrustNow = thrust;

  // 2. Aire relativo (con viento), Mach, presión dinámica y ángulo de ataque
  const frac = s.propellantMax > 0 ? s.propellant / s.propellantMax : 0;
  const mp = massState(r.comps, frac);
  const wind = windAt(h);
  const rvx = s.vx - wind;
  const rvy = s.vy;
  const vrel = Math.hypot(rvx, rvy);
  const q = 0.5 * atm.density * vrel * vrel;
  const mach = vrel / atm.sound;
  const ex = Math.cos(s.theta);
  const ey = Math.sin(s.theta);
  const nx = -ey;
  const ny = ex;
  const vAx = rvx * ex + rvy * ey;
  const vN = rvx * nx + rvy * ny;
  const alpha = vrel > 0.5 ? Math.atan2(vN, vAx) : 0;
  const sa = Math.sin(alpha);
  const ca = Math.cos(alpha);

  // 3. Paracaídas: se destruye si se abre con demasiada presión dinámica; apertura gradual
  let chuteCdA = 0;
  if (s.chuteDeployed && !s.chuteFailed) {
    if (s.chuteTime < 0) {
      s.chuteTime = s.t;
      if (q > CHUTE_MAX_Q) s.chuteFailed = true;
    }
    if (!s.chuteFailed) chuteCdA = CHUTE_CD * r.chuteArea * smoothstep((s.t - s.chuteTime) / CHUTE_OPEN_TIME);
  }
  const chuteActive = s.chuteDeployed && !s.chuteFailed;

  // 4. Fuerzas: arrastre (axial con Mach + flujo cruzado), normal restauradora y empuje
  const cdMach = r.cd * machDragFactor(mach);
  const drag = q * (r.area * cdMach * ca * ca + CROSSFLOW_CD * r.length * r.diameter * sa * sa + chuteCdA);
  const inv = vrel > 1e-6 ? 1 / vrel : 0;
  const fn = -q * r.area * r.cna * sa;
  const fx = thrust * ex - drag * rvx * inv + fn * nx;
  const fy = thrust * ey - drag * rvy * inv + fn * ny;
  s.accelG = Math.hypot(fx, fy) / mp.mass / G0;
  if (s.accelG > s.maxAccelG) s.maxAccelG = s.accelG;

  if (s.onRail) {
    // Sobre el riel: orientación fija y movimiento solo a lo largo del eje
    const a = (fx * ex + fy * ey) / s.mass - g * ey;
    const vPar = Math.max(0, s.vx * ex + s.vy * ey + a * dt);
    s.vx = vPar * ex;
    s.vy = vPar * ey;
    s.x += s.vx * dt;
    s.y += s.vy * dt;
    s.railS += vPar * dt;
    s.omega = 0;
    if (s.railS >= RAIL_LENGTH) {
      s.onRail = false;
      s.airborne = true;
    }
  } else {
    // 5. Rotación respecto al CG: momento restaurador (CP detrás del CG) y amortiguamiento aerodinámico
    let torque: number;
    if (chuteActive) {
      // Bajo el paracaídas el cohete cuelga con la nariz hacia el dosel
      const target = Math.atan2(-rvy, -rvx);
      torque = mp.inertia * (-6 * wrapAngle(s.theta - target) - 3 * s.omega);
    } else {
      const margin = r.cpX - mp.cg;
      let damp = 0;
      for (const p of r.aero) damp += p.cna * (p.x - mp.cg) ** 2;
      damp *= 0.5 * atm.density * vrel * r.area;
      torque = margin * q * r.area * r.cna * sa - damp * s.omega;
    }
    s.omega += (torque / mp.inertia) * dt;
    s.omega = Math.max(-MAX_OMEGA, Math.min(MAX_OMEGA, s.omega));
    s.theta = wrapAngle(s.theta + s.omega * dt);

    // 6. Euler semi-implícito
    s.vx += (fx / s.mass) * dt;
    s.vy += (fy / s.mass - g) * dt;
    s.x += s.vx * dt;
    s.y += s.vy * dt;
  }
  s.t += dt;

  // 7. Estadísticas
  const v = Math.hypot(s.vx, s.vy);
  if (v > s.maxSpeed) s.maxSpeed = v;
  if (s.y > s.apogee) s.apogee = s.y;
  s.mach = mach;
  s.dynPressure = q;
  s.aoa = alpha;
  if (q > s.maxQ) s.maxQ = q;
  if (mach > s.maxMach) s.maxMach = mach;

  // 8. Suelo
  if (!s.onRail && s.y <= 0) {
    s.y = 0;
    s.status = v <= SAFE_LANDING_SPEED ? "landed" : "crashed";
    s.vx = 0;
    s.vy = 0;
    s.omega = 0;
    s.engineOn = false;
    s.thrustNow = 0;
    return;
  }

  // 9. Fase de vuelo
  if (s.airborne) {
    if (s.propellant > 0 && s.engineOn) s.status = "boosting";
    else s.status = s.vy < 0 ? "descending" : "coasting";
  }
}
