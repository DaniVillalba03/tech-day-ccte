"use client";

import { useState } from "react";
import { submitEntry } from "@/lib/leaderboardClient";
import type { FlightResult } from "@/types/flight";
import type { RocketConfig } from "@/types";

const MAX_NAME = 30;

export function SaveRecordForm({ config, result }: { config: RocketConfig; result: FlightResult }) {
  const [pilot, setPilot] = useState("");
  const [rocket, setRocket] = useState(config.name);
  const [state, setState] = useState<"idle" | "saving" | "saved" | "local">("idle");

  const valid = pilot.trim().length > 0 && rocket.trim().length > 0;

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!valid || state === "saving" || state === "saved" || state === "local") return;
    setState("saving");
    const { remote } = await submitEntry({
      pilotName: pilot.trim(),
      rocketName: rocket.trim(),
      apogee: Math.round(result.apogee * 10) / 10,
      distance: Math.round(result.distance * 10) / 10,
      parts: { noseId: config.noseId, tankIds: config.tankIds, engineId: config.engineId, finId: config.finId },
      launchAngleDeg: config.launchAngleDeg,
    });
    setState(remote ? "saved" : "local");
  }

  const done = state === "saved" || state === "local";
  const input =
    "panel w-full px-3 py-2 text-sm outline-none focus:border-bone disabled:opacity-50";

  return (
    <form onSubmit={onSubmit} className="grid gap-3 sm:grid-cols-[1fr_1fr_auto] sm:items-end">
      <label className="block">
        <span className="label mb-1 block">Nombre del piloto</span>
        <input
          required
          maxLength={MAX_NAME}
          value={pilot}
          disabled={done}
          onChange={(e) => setPilot(e.target.value)}
          className={input}
        />
      </label>
      <label className="block">
        <span className="label mb-1 block">Nombre del cohete</span>
        <input
          required
          maxLength={MAX_NAME}
          value={rocket}
          disabled={done}
          onChange={(e) => setRocket(e.target.value)}
          className={input}
        />
      </label>
      <button type="submit" disabled={!valid || state === "saving" || done} className="btn btn-light">
        {state === "saving" ? "Guardando…" : done ? "Guardado ✓" : "Guardar marca"}
      </button>
      {state === "local" && (
        <p className="text-xs text-muted sm:col-span-3">
          Marca guardada localmente (la API de ranking aún no está disponible).
        </p>
      )}
    </form>
  );
}
