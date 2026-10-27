"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { ALL_PARTS, ENGINES, FINS, MAX_TANKS, NOSES, TANKS, getPart } from "@/data/parts";
import { KNSB } from "@/data/propellant";
import { computeRocketStats } from "@/engine/physics/rocketStats";
import { useMounted } from "@/lib/useMounted";
import { useRocketStore } from "@/store/rocketStore";
import type { FuelTank, Part, PartCategory } from "@/types";
import { PartCard } from "./PartCard";
import { RocketPreview } from "./RocketPreview";
import { StatsPanel } from "./StatsPanel";

const TABS: { category: PartCategory; label: string; parts: Part[] }[] = [
  { category: "nose", label: "Ojivas", parts: NOSES },
  { category: "tank", label: "Cuerpos KNSB", parts: TANKS },
  { category: "engine", label: "Motores", parts: ENGINES },
  { category: "fin", label: "Aletas", parts: FINS },
];

function describe(p: Part): string {
  switch (p.category) {
    case "nose":
      return `${p.dryMass} kg · Cd ${p.cd}`;
    case "tank":
      return `${p.dryMass} kg seca · ${p.propellantMass} kg KNSB · ${p.length} m`;
    case "engine":
      return `${(p.thrust / 1000).toFixed(0)} kN · ${p.dryMass} kg`;
    case "fin":
      return `Estab. ${p.stabilityFactor} · Giro máx. ${p.pitchRate} rad/s`;
  }
}

export function VabView() {
  const store = useRocketStore();
  const { config } = store;
  const mounted = useMounted();
  const [tab, setTab] = useState<PartCategory>("nose");
  const [dragging, setDragging] = useState<Part | null>(null);
  const [over, setOver] = useState(false);

  const stats = useMemo(() => computeRocketStats(config), [config]);
  if (!mounted) return null;

  /** Equipa la pieza: las ojivas, motores y aletas reemplazan; los cuerpos se apilan (máx. 4). */
  const equip = (part: Part) => {
    switch (part.category) {
      case "nose":
        store.setNose(part.id);
        break;
      case "tank":
        store.addTank(part.id);
        break;
      case "engine":
        store.setEngine(part.id);
        break;
      case "fin":
        store.setFin(part.id);
        break;
    }
  };

  const isSelected = (p: Part) =>
    (p.category === "nose" && config.noseId === p.id) ||
    (p.category === "engine" && config.engineId === p.id) ||
    (p.category === "fin" && config.finId === p.id);

  const current = TABS.find((t) => t.category === tab)!;

  return (
    <main className="shell grid flex-1 gap-8 py-8 lg:grid-cols-[280px_1fr_300px]">
      {/* Ensamblaje */}
      <div className="flex flex-col items-center gap-3">
        <div
          className="w-full"
          onDragOver={(e) => {
            if (!dragging) return;
            e.preventDefault();
            e.dataTransfer.dropEffect = "copy";
            setOver(true);
          }}
          onDragLeave={() => setOver(false)}
          onDrop={(e) => {
            e.preventDefault();
            setOver(false);
            const id = e.dataTransfer.getData("application/x-part");
            const part = ALL_PARTS.find((p) => p.id === id);
            if (part) equip(part);
            setDragging(null);
          }}
        >
          <RocketPreview config={config} highlight={dragging?.category ?? null} over={over} />
        </div>

        <input
          aria-label="Nombre del cohete"
          value={config.name}
          maxLength={30}
          onChange={(e) => store.setName(e.target.value)}
          className="panel w-full px-3 py-2 text-center text-sm font-semibold uppercase tracking-[0.1em] outline-none focus:border-bone"
        />

        <div className="w-full">
          <p className="label mb-2">
            Cuerpos ({config.tankIds.length}/{MAX_TANKS})
          </p>
          <ul className="flex flex-wrap gap-2">
            {config.tankIds.map((id, i) => (
              <li key={i} className="panel flex items-center gap-2 px-3 py-1 text-sm">
                {getPart<FuelTank>(id).name.replace("Cuerpo KNSB ", "")}
                <button
                  type="button"
                  aria-label={`Quitar cuerpo ${i + 1}`}
                  disabled={config.tankIds.length <= 1}
                  onClick={() => store.removeTank(i)}
                  className="text-signal disabled:opacity-30"
                >
                  ✕
                </button>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Catálogo */}
      <div className="min-w-0 space-y-5">
        <div>
          <p className="eyebrow mb-3">Hangar de ensamblaje · VAB</p>
          <h1 className="text-4xl font-semibold tracking-tight">Taller de ensamblaje</h1>
          <p className="mt-2 max-w-xl text-sm text-muted">
            Cohete de una sola etapa. Arrastra una pieza hasta el cohete o haz clic para seleccionarla.
          </p>
        </div>

        <div role="tablist" aria-label="Categorías" className="flex flex-wrap border-b border-line">
          {TABS.map((t) => (
            <button
              key={t.category}
              role="tab"
              type="button"
              aria-selected={tab === t.category}
              onClick={() => setTab(t.category)}
              className={`border-b-2 px-5 py-3 text-[0.72rem] font-semibold uppercase tracking-[0.14em] transition ${
                tab === t.category ? "border-signal text-bone" : "border-transparent text-muted hover:text-bone"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        <div className="grid gap-px border border-line bg-line sm:grid-cols-2 xl:grid-cols-3">
          {current.parts.map((p) => (
            <PartCard
              key={p.id}
              part={p}
              selected={isSelected(p)}
              stats={describe(p)}
              onClick={() => equip(p)}
              onDragStart={setDragging}
              onDragEnd={() => {
                setDragging(null);
                setOver(false);
              }}
            />
          ))}
        </div>

        <section>
          <h3 className="eyebrow mb-3">Ángulo inicial de lanzamiento · <span className="font-mono text-bone">{config.launchAngleDeg}°</span></h3>
          <input
            type="range"
            min={15}
            max={90}
            step={1}
            value={config.launchAngleDeg}
            onChange={(e) => store.setLaunchAngle(Number(e.target.value))}
            className="w-full accent-[#d52b32]"
            aria-label="Ángulo inicial de lanzamiento"
          />
          <div className="label mt-1 flex justify-between">
            <span>15° (horizontal)</span>
            <span>90° (vertical)</span>
          </div>
        </section>
      </div>

      {/* Cálculos */}
      <aside className="space-y-4">
        <div className="panel border-l-2 border-l-signal p-4">
          <p className="label">Propelente único</p>
          <p className="mt-1 text-lg font-semibold">{KNSB.name}</p>
          <p className="text-xs text-muted">
            {KNSB.fullName} · Isp {KNSB.isp} s · igual para todos los cohetes
          </p>
        </div>
        <StatsPanel stats={stats} />
        <Link href="/flight" className="btn btn-light w-full">
          Ir a la plataforma <span aria-hidden>→</span>
        </Link>
      </aside>
    </main>
  );
}
