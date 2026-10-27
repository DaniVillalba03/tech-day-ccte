"use client";

import Link from "next/link";
import { useMemo } from "react";
import type { RocketConfig } from "@/types";
import type { FlightResult } from "@/types/flight";
import { LineChartCanvas } from "./LineChartCanvas";
import { SaveRecordForm } from "./SaveRecordForm";

const fmt = (n: number, d = 0) => n.toLocaleString("es-ES", { maximumFractionDigits: d, minimumFractionDigits: d });

interface Props {
  result: FlightResult;
  config: RocketConfig;
  onRestart: () => void;
}

export function MissionSummaryModal({ result, config, onRestart }: Props) {
  const altitude = useMemo(() => result.samples.map((s) => [s.t, s.altitude] as [number, number]), [result]);
  const speed = useMemo(() => result.samples.map((s) => [s.t, s.speed] as [number, number]), [result]);
  const ok = result.status === "landed";

  const stats: [string, string][] = [
    ["Apogeo", `${fmt(result.apogee)} m`],
    ["Distancia horizontal", `${fmt(result.distance)} m`],
    ["Velocidad máx.", `${fmt(result.maxSpeed)} m/s`],
    ["Aceleración máx.", `${fmt(result.maxAccelG, 1)} G`],
    ["Duración", `${fmt(result.duration, 1)} s`],
  ];

  return (
    <div className="absolute inset-0 z-10 overflow-y-auto bg-ink/80 p-4 backdrop-blur-sm">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="mission-title"
        className={`panel mx-auto my-4 max-w-4xl border-t-2 bg-graphite p-6 ${ok ? "border-t-cobalt" : "border-t-signal"}`}
      >
        <p className="eyebrow">Fin de misión · {ok ? "Aterrizaje seguro" : "Impacto"}</p>
        <h2 id="mission-title" className="mt-2 text-3xl font-semibold tracking-tight">
          {config.name}
        </h2>

        <dl className="mt-5 grid grid-cols-2 gap-px border border-line bg-line sm:grid-cols-5">
          {stats.map(([k, v]) => (
            <div key={k} className="bg-graphite p-3">
              <dt className="label">{k}</dt>
              <dd className="mt-1 font-mono text-lg">{v}</dd>
            </div>
          ))}
        </dl>

        <div className="mt-6 grid gap-6 md:grid-cols-2">
          <LineChartCanvas title="Altitud vs. tiempo" points={altitude} xLabel="t (s)" yLabel="Altitud (m)" color="#6f9bec" />
          <LineChartCanvas title="Velocidad vs. tiempo" points={speed} xLabel="t (s)" yLabel="Velocidad (m/s)" color="#d52b32" />
        </div>

        <div className="mt-6 border-t border-line pt-5">
          <h3 className="eyebrow mb-3">Guardar marca</h3>
          <SaveRecordForm config={config} result={result} />
        </div>

        <div className="mt-6 flex flex-wrap gap-3">
          <button type="button" className="btn btn-outline" onClick={onRestart}>
            Volver a lanzar
          </button>
          <Link href="/vab" className="btn btn-outline">
            Rediseñar en el taller
          </Link>
          <Link href="/leaderboard" className="btn btn-outline">
            Ver ranking
          </Link>
        </div>
      </div>
    </div>
  );
}
