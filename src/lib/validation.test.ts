import { describe, expect, it } from "vitest";
import { validateNewEntry } from "./validation";

const valid = {
  pilotName: " Ana ",
  rocketName: "Urutaú",
  apogee: 1234.5,
  distance: 800,
  parts: { noseId: "nose-cone", tankIds: ["tank-m"], engineId: "eng-vector", finId: "fin-medium" },
  launchAngleDeg: 80,
};

describe("validateNewEntry", () => {
  it("acepta un registro válido y recorta nombres", () => {
    const r = validateNewEntry(valid);
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.value.pilotName).toBe("Ana");
  });

  it.each([
    ["no objeto", null],
    ["piloto vacío", { ...valid, pilotName: "  " }],
    ["nombre largo", { ...valid, rocketName: "x".repeat(31) }],
    ["apogeo negativo", { ...valid, apogee: -1 }],
    ["apogeo NaN", { ...valid, apogee: Number.NaN }],
    ["apogeo absurdo", { ...valid, apogee: 1e9 }],
    ["ángulo fuera de rango", { ...valid, launchAngleDeg: 5 }],
    ["pieza desconocida", { ...valid, parts: { ...valid.parts, engineId: "hack" } }],
    ["sin tanques", { ...valid, parts: { ...valid.parts, tankIds: [] } }],
    ["demasiados tanques", { ...valid, parts: { ...valid.parts, tankIds: Array(5).fill("tank-s") } }],
    ["tanque que es motor", { ...valid, parts: { ...valid.parts, tankIds: ["eng-spark"] } }],
  ])("rechaza %s", (_n, body) => {
    expect(validateNewEntry(body).ok).toBe(false);
  });
});
