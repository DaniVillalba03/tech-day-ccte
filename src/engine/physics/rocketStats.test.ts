import { describe, expect, it } from "vitest";
import type { RocketConfig } from "@/types";
import { G0 } from "./constants";
import { computeRocketStats } from "./rocketStats";

const base: RocketConfig = {
  name: "Test",
  noseId: "nose-cone",
  tankIds: ["tank-m"],
  engineId: "eng-vector",
  finId: "fin-medium",
  launchAngleDeg: 90,
};

describe("computeRocketStats", () => {
  it("suma masas seca y húmeda", () => {
    const s = computeRocketStats(base);
    expect(s.dryMass).toBe(25 + 100 + 150 + 30);
    expect(s.propellantMass).toBe(350);
    expect(s.wetMass).toBe(s.dryMass + 350);
  });

  it("calcula TWR, tiempo de quemado y Δv", () => {
    const s = computeRocketStats(base);
    expect(s.twr).toBeCloseTo(35000 / (s.wetMass * G0), 6);
    expect(s.massFlow).toBeCloseTo(35000 / (130 * G0), 6);
    expect(s.burnTime).toBeCloseTo(350 / s.massFlow, 6);
    expect(s.deltaV).toBeCloseTo(130 * G0 * Math.log(s.wetMass / s.dryMass), 6);
  });

  it("TWR < 1 con motor débil y muchos tanques", () => {
    const s = computeRocketStats({ ...base, engineId: "eng-spark", tankIds: ["tank-l", "tank-l", "tank-l"] });
    expect(s.twr).toBeLessThan(1);
  });
});
