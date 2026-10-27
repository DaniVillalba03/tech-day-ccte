import { describe, expect, it } from "vitest";
import type { RocketConfig } from "@/types";
import type { FlightInput } from "@/types/flight";
import { G0 } from "./constants";
import { airDensity } from "./atmosphere";
import { buildPhysicsRocket, createInitialState } from "./rocketModel";
import { PHYSICS_DT, updatePhysics } from "./updatePhysics";

const config: RocketConfig = {
  name: "T",
  noseId: "nose-cone",
  tankIds: ["tank-m"],
  engineId: "eng-vector",
  finId: "fin-medium",
  launchAngleDeg: 90,
};
const idle: FlightInput = { pitch: 0 };

function launch(rocket = buildPhysicsRocket(config), angle = 90) {
  const s = createInitialState(rocket, angle);
  s.engineOn = true;
  s.status = "boosting";
  return { s, rocket };
}

describe("atmósfera", () => {
  it("ρ(0)=1.225 y decae exponencialmente", () => {
    expect(airDensity(0)).toBeCloseTo(1.225, 6);
    expect(airDensity(8500)).toBeCloseTo(1.225 / Math.E, 6);
  });
});

describe("updatePhysics", () => {
  it("caída libre sin arrastre: v = g·t", () => {
    const rocket = { ...buildPhysicsRocket(config), cd: 0 };
    const s = createInitialState(rocket, 90);
    s.status = "descending";
    s.airborne = true;
    s.y = 1000;
    s.engineOn = false;
    for (let i = 0; i < 120 * 5; i++) updatePhysics(s, rocket, idle, PHYSICS_DT);
    expect(-s.vy).toBeCloseTo(G0 * 5, 1);
    expect(s.y).toBeCloseTo(1000 - 0.5 * G0 * 25, 0);
  });

  it("conserva la masa: masa final = seca al agotar propelente", () => {
    const { s, rocket } = launch();
    for (let i = 0; i < 120 * 120 && s.propellant > 0; i++) updatePhysics(s, rocket, idle, PHYSICS_DT);
    expect(s.propellant).toBe(0);
    expect(s.mass).toBeCloseTo(rocket.dryMass, 6);
  });

  it("apogeo vertical ≈ solución analítica (sin arrastre)", () => {
    const rocket = { ...buildPhysicsRocket(config), cd: 0 };
    const { s } = launch(rocket);
    for (let i = 0; i < 120 * 600 && s.status !== "landed" && s.status !== "crashed"; i++) {
      updatePhysics(s, rocket, idle, PHYSICS_DT);
      if (s.status === "descending" && s.y < s.apogee - 10) break;
    }
    const m0 = rocket.dryMass + rocket.propellantMass;
    const mf = rocket.dryMass;
    const ve = rocket.thrust / rocket.massFlow;
    const tb = rocket.propellantMass / rocket.massFlow;
    const vb = ve * Math.log(m0 / mf) - G0 * tb;
    const hb = ve * (tb - (mf / rocket.massFlow) * Math.log(m0 / mf)) - 0.5 * G0 * tb * tb;
    const expected = hb + (vb * vb) / (2 * G0);
    expect(Math.abs(s.apogee - expected) / expected).toBeLessThan(0.01);
  });

  it("con TWR < 1 el cohete se queda en la plataforma", () => {
    const weak = { ...buildPhysicsRocket({ ...config, engineId: "eng-spark", tankIds: ["tank-l", "tank-l", "tank-l"] }) };
    const { s } = launch(weak);
    for (let i = 0; i < 120 * 5; i++) updatePhysics(s, weak, idle, PHYSICS_DT);
    expect(s.y).toBe(0);
    expect(s.airborne).toBe(false);
  });

  it("el arrastre reduce el apogeo respecto al vacío", () => {
    const withDrag = launch();
    const vacuumRocket = { ...buildPhysicsRocket(config), cd: 0 };
    const vacuum = launch(vacuumRocket);
    for (let i = 0; i < 120 * 400; i++) {
      updatePhysics(withDrag.s, withDrag.rocket, idle, PHYSICS_DT);
      updatePhysics(vacuum.s, vacuumRocket, idle, PHYSICS_DT);
    }
    expect(withDrag.s.apogee).toBeLessThan(vacuum.s.apogee);
  });

  it("el paracaídas permite aterrizar de forma segura", () => {
    const { s, rocket } = launch();
    for (let i = 0; i < 120 * 3000 && s.status !== "landed" && s.status !== "crashed"; i++) {
      if (s.status === "descending") s.chuteDeployed = true;
      updatePhysics(s, rocket, idle, PHYSICS_DT);
    }
    expect(s.status).toBe("landed");
  });

  it("sin paracaídas el impacto es un choque", () => {
    const { s, rocket } = launch();
    for (let i = 0; i < 120 * 3000 && s.status !== "landed" && s.status !== "crashed"; i++)
      updatePhysics(s, rocket, idle, PHYSICS_DT);
    expect(s.status).toBe("crashed");
  });

  it("lanzamiento inclinado produce distancia horizontal", () => {
    const { s, rocket } = launch(undefined, 45);
    for (let i = 0; i < 120 * 3000 && s.status !== "landed" && s.status !== "crashed"; i++)
      updatePhysics(s, rocket, idle, PHYSICS_DT);
    expect(s.x).toBeGreaterThan(1000);
  });
});
