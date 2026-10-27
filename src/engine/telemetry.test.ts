import { describe, expect, it } from "vitest";
import type { FlightState } from "@/types/flight";
import { TelemetryRecorder } from "./telemetry";

const state = (t: number): FlightState =>
  ({ t, y: t * 10, vx: 3, vy: 4 }) as FlightState;

describe("TelemetryRecorder", () => {
  it("muestrea cada 0.1 s de simulación", () => {
    const r = new TelemetryRecorder();
    for (let i = 0; i <= 120; i++) r.record(state(i / 120));
    expect(r.samples.length).toBeGreaterThanOrEqual(10);
    expect(r.samples.length).toBeLessThanOrEqual(12);
    expect(r.samples[1].speed).toBe(5);
  });

  it("decima y no supera el máximo en vuelos largos", () => {
    const r = new TelemetryRecorder();
    for (let i = 0; i < 120 * 3000; i++) r.record(state(i / 120));
    expect(r.samples.length).toBeLessThanOrEqual(1500);
    expect(r.samples[r.samples.length - 1].t).toBeGreaterThan(2900);
  });
});
