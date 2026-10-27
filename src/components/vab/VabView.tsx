"use client";

import { useMemo, useSyncExternalStore } from "react";
import Link from "next/link";
import { ENGINES, FINS, NOSES, TANKS, getPart } from "@/data/parts";
import { computeRocketStats } from "@/engine/physics/rocketStats";
import { MAX_TANKS, useRocketStore } from "@/store/rocketStore";
import type { Engine, Fin, FuelTank, NoseCone } from "@/types";
import { PartPicker } from "./PartPicker";
import { RocketPreview } from "./RocketPreview";
import { StatsPanel } from "./StatsPanel";

export function VabView() {
  const store = useRocketStore();
  const { config } = store;
  // Evita desajuste de hidratación: el store persistido solo existe en cliente.
  const mounted = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );

  const stats = useMemo(() => computeRocketStats(config), [config]);
  if (!mounted) return null;

  return (
    <main className="shell grid flex-1 gap-8 py-8 lg:grid-cols-[260px_1fr_300px]">
      <div className="flex flex-col items-center gap-3">
        <RocketPreview config={config} />
        <input
          aria-label="Nombre del cohete"
          value={config.name}
          maxLength={30}
          onChange={(e) => store.setName(e.target.value)}
          className="panel w-full px-3 py-2 text-center text-sm font-semibold uppercase tracking-[0.1em] outline-none focus:border-bone"
        />
      </div>

      <div className="space-y-6">
        <div>
          <p className="eyebrow mb-3">Hangar de ensamblaje · VAB</p>
          <h1 className="text-4xl font-semibold tracking-tight">Taller de ensamblaje</h1>
        </div>

        <PartPicker
          title="Ojiva"
          parts={NOSES}
          selectedId={config.noseId}
          onSelect={store.setNose}
          describe={(p) => `${(p as NoseCone).dryMass} kg · Cd ${(p as NoseCone).cd}`}
        />

        <section>
          <h3 className="eyebrow mb-3">
            Tanques ({config.tankIds.length}/{MAX_TANKS})
          </h3>
          <ul className="mb-2 flex flex-wrap gap-2">
            {config.tankIds.map((id, i) => (
              <li key={i} className="panel flex items-center gap-2 px-3 py-1 text-sm">
                {getPart<FuelTank>(id).name}
                <button
                  type="button"
                  aria-label={`Quitar tanque ${i + 1}`}
                  disabled={config.tankIds.length <= 1}
                  onClick={() => store.removeTank(i)}
                  className="text-signal disabled:opacity-30"
                >
                  ✕
                </button>
              </li>
            ))}
          </ul>
          <div className="grid gap-px border border-line bg-line sm:grid-cols-3">
            {TANKS.map((t) => (
              <button
                key={t.id}
                type="button"
                disabled={config.tankIds.length >= MAX_TANKS}
                onClick={() => store.addTank(t.id)}
                className="bg-ink p-4 text-left text-sm transition hover:bg-graphite disabled:opacity-40"
              >
                <div className="font-semibold">+ {t.name}</div>
                <div className="mt-1 font-mono text-xs text-muted">
                  {t.dryMass} kg seca · {t.propellantMass} kg propelente
                </div>
              </button>
            ))}
          </div>
        </section>

        <PartPicker
          title="Motor"
          parts={ENGINES}
          selectedId={config.engineId}
          onSelect={store.setEngine}
          describe={(p) => {
            const e = p as Engine;
            return `${(e.thrust / 1000).toFixed(0)} kN · Isp ${e.isp} s · ${e.dryMass} kg`;
          }}
        />

        <PartPicker
          title="Aletas"
          parts={FINS}
          selectedId={config.finId}
          onSelect={store.setFin}
          describe={(p) => {
            const f = p as Fin;
            return `Estabilidad ${f.stabilityFactor} · Giro ${f.pitchRate} rad/s`;
          }}
        />

        <section>
          <h3 className="eyebrow mb-3">
            Ángulo inicial de lanzamiento · <span className="font-mono text-bone">{config.launchAngleDeg}°</span>
          </h3>
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

      <aside className="space-y-4">
        <StatsPanel stats={stats} />
        <Link
          href="/flight"
          className="btn btn-light w-full"
        >
          Ir a la plataforma <span aria-hidden>→</span>
        </Link>
      </aside>
    </main>
  );
}
