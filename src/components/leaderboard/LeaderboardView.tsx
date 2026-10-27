"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { getPart } from "@/data/parts";
import type { LeaderboardEntry, LeaderboardType } from "@/types/leaderboard";

const TABS: { type: LeaderboardType; label: string; hint: string }[] = [
  { type: "apogee", label: "Mayor apogeo", hint: "Premia el diseño y el lanzamiento vertical óptimo." },
  { type: "distance", label: "Mayor distancia", hint: "Premia la trayectoria balística y el giro gravitacional." },
];
const LIMITS = [10, 50] as const;

const fmt = (n: number) => n.toLocaleString("es-ES", { maximumFractionDigits: 0 });
const partName = (id: string) => {
  try {
    return getPart(id).name;
  } catch {
    return id;
  }
};
const partsLabel = (p: LeaderboardEntry["parts"]) =>
  [partName(p.noseId), p.tankIds.map(partName).join(" + "), partName(p.engineId), partName(p.finId)].join(" · ");

type State = { status: "loading" } | { status: "error"; message: string } | { status: "ok"; entries: LeaderboardEntry[] };

export function LeaderboardView() {
  const [type, setType] = useState<LeaderboardType>("apogee");
  const [limit, setLimit] = useState<(typeof LIMITS)[number]>(10);
  const [state, setState] = useState<State>({ status: "loading" });

  useEffect(() => {
    const ctrl = new AbortController();
    fetch(`/api/leaderboard?type=${type}&limit=${limit}`, { signal: ctrl.signal, cache: "no-store" })
      .then(async (res) => {
        if (!res.ok) throw new Error((await res.json().catch(() => null))?.error ?? `Error ${res.status}`);
        return (await res.json()) as LeaderboardEntry[];
      })
      .then((entries) => setState({ status: "ok", entries }))
      .catch((e: Error) => {
        if (e.name !== "AbortError") setState({ status: "error", message: e.message });
      });
    return () => ctrl.abort();
  }, [type, limit]);

  const select = (next: () => void) => {
    setState({ status: "loading" });
    next();
  };
  const tab = TABS.find((t) => t.type === type)!;

  return (
    <main className="shell flex-1 py-8">
      <p className="eyebrow mb-3">Clasificación</p>
      <h1 className="text-4xl font-semibold tracking-tight">Ranking</h1>

      <div className="mt-6 flex flex-wrap items-end justify-between gap-4 border-b border-line">
        <div role="tablist" aria-label="Tipo de ranking" className="flex">
          {TABS.map((t) => (
            <button
              key={t.type}
              role="tab"
              type="button"
              aria-selected={type === t.type}
              onClick={() => select(() => setType(t.type))}
              className={`border-b-2 px-5 py-3 text-[0.72rem] font-semibold uppercase tracking-[0.14em] transition ${
                type === t.type ? "border-signal text-bone" : "border-transparent text-muted hover:text-bone"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
        <div className="mb-2 flex items-center gap-1" role="group" aria-label="Cantidad">
          {LIMITS.map((l) => (
            <button
              key={l}
              type="button"
              aria-pressed={limit === l}
              onClick={() => select(() => setLimit(l))}
              className={`btn ${limit === l ? "btn-light" : "btn-outline"} !px-4 !py-2`}
            >
              Top {l}
            </button>
          ))}
        </div>
      </div>
      <p className="mt-3 text-sm text-muted">{tab.hint}</p>

      <div className="mt-5 overflow-x-auto border border-line">
        <table className="w-full min-w-[720px] text-left text-sm">
          <thead className="bg-graphite">
            <tr className="label">
              {["#", "Piloto", "Cohete", "Apogeo (m)", "Distancia (m)", "Ángulo", "Piezas", "Fecha"].map((h) => (
                <th key={h} scope="col" className="px-4 py-3 font-semibold">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {state.status === "ok" &&
              state.entries.map((e, i) => (
                <tr key={e.id} className="border-t border-line">
                  <td className={`px-4 py-3 font-mono ${i === 0 ? "text-signal" : "text-muted"}`}>{i + 1}</td>
                  <td className="px-4 py-3 font-semibold">{e.pilotName}</td>
                  <td className="px-4 py-3">{e.rocketName}</td>
                  <td className={`px-4 py-3 font-mono ${type === "apogee" ? "text-bone" : "text-muted"}`}>{fmt(e.apogee)}</td>
                  <td className={`px-4 py-3 font-mono ${type === "distance" ? "text-bone" : "text-muted"}`}>{fmt(e.distance)}</td>
                  <td className="px-4 py-3 font-mono text-muted">{e.launchAngleDeg}°</td>
                  <td className="px-4 py-3 text-xs text-muted">{partsLabel(e.parts)}</td>
                  <td className="whitespace-nowrap px-4 py-3 font-mono text-xs text-muted">
                    {new Date(e.createdAt).toLocaleDateString("es-ES")}
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
        {state.status === "loading" && <p className="p-6 text-center text-sm text-muted">Cargando…</p>}
        {state.status === "error" && (
          <p role="alert" className="p-6 text-center text-sm text-signal">
            {state.message}
          </p>
        )}
        {state.status === "ok" && state.entries.length === 0 && (
          <p className="p-6 text-center text-sm text-muted">Aún no hay marcas. ¡Sé el primero en lanzar!</p>
        )}
      </div>

      <div className="mt-6">
        <Link href="/vab" className="btn btn-light">
          Diseñar y lanzar <span aria-hidden>→</span>
        </Link>
      </div>
    </main>
  );
}
