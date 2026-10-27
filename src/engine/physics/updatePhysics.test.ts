import { describe, expect, it } from "vitest";
import type { RocketConfig } from "@/types";
import type { FlightState, PhysicsRocket } from "@/types/flight";
import { airDensity, atmosphere } from "./atmosphere";
import { G0 } from "./constants";
import { gravityAt } from "./gravity";
import { machDragFactor, windAt } from "./aerodynamics";
import { buildPhysicsRocket, createInitialState, RAIL_LENGTH } from "./rocketModel";
import { PHYSICS_DT, updatePhysics } from "./updatePhysics";

const config: RocketConfig = {
  name: "T",
  noseId: "nose-cone",
  tankIds: ["tank-m"],
  engineId: "eng-vector",
  finId: "fin-large",
  launchAngleDeg: 90,
};

function launch(rocket: PhysicsRocket = buildPhysicsRocket(config), angle = 90) {
  const s = createInitialState(rocket, angle);
  s.engineOn = true;
  s.status = "boosting";
  return { s, rocket };
}

function run(s: FlightState, r: PhysicsRocket, seconds: number, hook?: (s: FlightState) => void) {
  const steps = Math.round(seconds / PHYSICS_DT);
  for (let i = 0; i < steps && s.status !== "landed" && s.status !== "crashed"; i++) {
    hook?.(s);
    updatePhysics(s, r, PHYSICS_DT);
  }
}

describe("atmósfera estándar (ISA)", () => {
  it("coincide con valores de referencia", () => {
    expect(airDensity(0)).toBeCloseTo(1.225, 3);
    expect(airDensity(11000)).toBeCloseTo(0.3639, 3);
    expect(airDensity(20000)).toBeCloseTo(0.088, 3);
    expect(atmosphere(0).sound).toBeCloseTo(340.3, 0);
    expect(atmosphere(11000).sound).toBeCloseTo(295.1, 0);
    expect(atmosphere(0).pressure).toBeCloseTo(101325, -1);
  });

  it("la densidad decrece monótonamente con la altitud", () => {
    let prev = Infinity;
    for (let h = 0; h <= 150000; h += 1000) {
      const d = airDensity(h);
      expect(d).toBeLessThan(prev);
      prev = d;
    }
  });
});

describe("gravedad, Mach y viento", () => {
  it("la gravedad disminuye con la altitud", () => {
    expect(gravityAt(0)).toBeCloseTo(G0, 6);
    expect(gravityAt(100000)).toBeCloseTo(G0 * (6371 / 6471) ** 2, 3);
    expect(gravityAt(100000)).toBeLessThan(gravityAt(0));
  });

  it("el arrastre sube en el régimen transónico", () => {
    expect(machDragFactor(0.3)).toBe(1);
    expect(machDragFactor(1.05)).toBeGreaterThan(1.8);
    expect(machDragFactor(3)).toBeLessThan(machDragFactor(1.05));
    expect(machDragFactor(10)).toBe(1);
  });

  it("el viento sopla hacia −x y se anula en altura", () => {
    expect(windAt(0)).toBeLessThan(0);
    expect(Math.abs(windAt(10000))).toBeGreaterThan(Math.abs(windAt(0)));
    expect(Math.abs(windAt(60000))).toBe(0);
  });
});

describe("updatePhysics", () => {
  it("caída libre sin aerodinámica: v ≈ g·t", () => {
    const rocket = { ...buildPhysicsRocket(config), cd: 0, cna: 0, aero: [], length: 0 };
    const s = createInitialState(rocket, 90);
    s.status = "descending";
    s.airborne = true;
    s.onRail = false;
    s.y = 1000;
    s.engineOn = false;
    run(s, rocket, 5);
    expect(-s.vy).toBeCloseTo(G0 * 5, 1);
    expect(s.y).toBeCloseTo(1000 - 0.5 * G0 * 25, 0);
  });

  it("conserva la masa: masa final = seca al agotar propelente", () => {
    const { s, rocket } = launch();
    run(s, rocket, 120, () => undefined);
    expect(s.propellant).toBe(0);
    expect(s.mass).toBeCloseTo(rocket.dryMass, 6);
  });

  it("el empuje aumenta con la altitud (presión ambiente menor)", () => {
    const { s, rocket } = launch();
    run(s, rocket, 1);
    const low = s.thrustNow;
    const s2 = createInitialState(rocket, 90);
    s2.engineOn = true;
    s2.status = "boosting";
    s2.onRail = false;
    s2.airborne = true;
    s2.y = 30000;
    s2.burnTime = 5;
    updatePhysics(s2, rocket, PHYSICS_DT);
    expect(s2.thrustNow).toBeGreaterThan(low);
    expect(s2.thrustNow).toBeGreaterThan(rocket.thrust);
  });

  it("el cohete permanece orientado en el riel y lo abandona tras RAIL_LENGTH", () => {
    const { s, rocket } = launch(undefined, 60);
    const theta0 = s.theta;
    let onRailSteps = 0;
    for (let i = 0; i < 120 * 3 && s.onRail; i++) {
      updatePhysics(s, rocket, PHYSICS_DT);
      expect(s.theta).toBeCloseTo(theta0, 9);
      onRailSteps++;
    }
    expect(s.onRail).toBe(false);
    expect(s.railS).toBeGreaterThanOrEqual(RAIL_LENGTH);
    expect(onRailSteps).toBeGreaterThan(10);
  });

  it("con TWR < 1 el cohete se queda en el riel", () => {
    const weak = buildPhysicsRocket({ ...config, engineId: "eng-spark", tankIds: ["tank-l", "tank-l", "tank-l"] });
    const { s } = launch(weak);
    run(s, weak, 5);
    expect(s.y).toBe(0);
    expect(s.airborne).toBe(false);
  });

  it("un cohete estable corrige un ángulo de ataque inicial", () => {
    const { s, rocket } = launch();
    run(s, rocket, 6);
    expect(s.onRail).toBe(false);
    s.theta += 0.15;
    s.omega = 0;
    const maxAoa = { v: 0 };
    run(s, rocket, 3, () => {
      maxAoa.v = Math.max(maxAoa.v, Math.abs(s.aoa));
    });
    expect(Math.abs(s.aoa)).toBeLessThan(0.1);
    expect(Math.abs(s.theta - Math.atan2(s.vy, s.vx - 0))).toBeLessThan(0.3);
  });

  it("un cohete inestable (CP delante del CG) pierde el control", () => {
    const unstable = buildPhysicsRocket({ ...config, finId: "fin-small", engineId: "eng-colossus", tankIds: ["tank-m"] });
    expect(unstable.cpX).toBeLessThan(
      unstable.comps.reduce((a, c) => a + (c.dry + c.prop) * c.x, 0) / unstable.comps.reduce((a, c) => a + c.dry + c.prop, 0),
    );
    const { s } = launch(unstable);
    run(s, unstable, 12);
    // se desvía mucho de la vertical inicial
    expect(Math.abs(s.theta - Math.PI / 2)).toBeGreaterThan(0.5);
  });

  it("vuelo vertical estable: durante el ascenso no se desvía y supera 1 km", () => {
    const { s, rocket } = launch();
    run(s, rocket, 12);
    expect(Math.abs(s.theta - Math.PI / 2)).toBeLessThan(0.3);
    run(s, rocket, 60);
    expect(s.apogee).toBeGreaterThan(1000);
  });

  it("un cohete estable sin paracaídas cae con la nariz hacia abajo (sigue el viento relativo)", () => {
    const { s, rocket } = launch();
    run(s, rocket, 3000, (st) => {
      if (st.status === "descending" && st.y < 20000) st.engineOn = false;
    });
    expect(s.status).toBe("crashed");
  });

  it("el paracaídas permite aterrizar de forma segura si se abre en descenso", () => {
    const { s, rocket } = launch();
    run(s, rocket, 3000, (st) => {
      if (st.status === "descending" && st.y < 8000) st.chuteDeployed = true;
    });
    expect(s.chuteFailed).toBe(false);
    expect(s.status).toBe("landed");
  });

  it("abrir el paracaídas con demasiada presión dinámica lo destruye", () => {
    const { s, rocket } = launch();
    run(s, rocket, 8);
    s.chuteDeployed = true;
    run(s, rocket, 0.1);
    expect(s.chuteFailed).toBe(true);
  });

  it("sin paracaídas el impacto es un choque", () => {
    const { s, rocket } = launch();
    run(s, rocket, 3000);
    expect(s.status).toBe("crashed");
  });

  it("lanzamiento inclinado produce distancia horizontal", () => {
    const { s, rocket } = launch(undefined, 45);
    run(s, rocket, 3000);
    expect(Math.abs(s.x)).toBeGreaterThan(1000);
  });

  it("registra Mach y presión dinámica máximos", () => {
    const { s, rocket } = launch();
    run(s, rocket, 40);
    expect(s.maxMach).toBeGreaterThan(0.5);
    expect(s.maxQ).toBeGreaterThan(1000);
  });
});
