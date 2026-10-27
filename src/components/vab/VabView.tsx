"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { ENGINES, FINS, NOSES, TANKS, MAX_TANKS } from "@/data/parts";
import { KNSB } from "@/data/propellant";
import { computeRocketStats } from "@/engine/physics/rocketStats";
import { moveItem } from "@/lib/listOps";
import { useMounted } from "@/lib/useMounted";
import { useRocketStore } from "@/store/rocketStore";
import type { Part, PartCategory } from "@/types";
import { AssemblyList } from "./AssemblyList";
import { PartCard } from "./PartCard";
import { RocketPreview } from "./RocketPreview";
import { type Selection, type Zone } from "./rocketLayout";
import { StatsPanel } from "./StatsPanel";

const TABS: { category: PartCategory; label: string; parts: Part[] }[] = [
  { category: "nose", label: "Ojivas", parts: NOSES },
  { category: "tank", label: "Cuerpos KNSB", parts: TANKS },
  { category: "engine", label: "Motores", parts: ENGINES },
  { category: "fin", label: "Aletas", parts: FINS },
];

const SINGULAR: Record<PartCategory, string> = { nose: "La ojiva", tank: "El cuerpo", engine: "El motor", fin: "Las aletas" };

function describe(p: Part): string {
  switch (p.category) {
    case "nose":
      return `${p.dryMass} kg · Cd ${p.cd}`;
    case "tank":
      return `${p.dryMass} kg seca · ${p.propellantMass} kg KNSB · ${p.length} m`;
    case "engine":
      return `${(p.thrust / 1000).toFixed(0)} kN · ${p.dryMass} kg`;
    case "fin":
      return `Envergadura ${((p.diameter - 0.6) / 2).toFixed(2)} m · Cuerda ${p.length} m`;
  }
}

export function VabView() {
  const store = useRocketStore();
  const { config } = store;
  const mounted = useMounted();
  const [tab, setTab] = useState<PartCategory>("nose");
  const [dragging, setDragging] = useState<Part | null>(null);
  const [selection, setSelection] = useState<Selection | null>(null);

  const stats = useMemo(() => computeRocketStats(config), [config]);

  const removeTank = (index: number) => {
    if (config.tankIds.length <= 1) return;
    store.removeTank(index);
    setSelection((s) => {
      if (s?.kind !== "tank") return s;
      if (s.index === index) return null;
      return s.index > index ? { ...s, index: s.index - 1 } : s;
    });
  };

  const moveTank = (from: number, to: number) => {
    const last = config.tankIds.length - 1;
    const target = Math.max(0, Math.min(to, last));
    if (from === target) return;
    store.moveTank(from, target);
    // La selección sigue a la pieza que cambió de lugar
    setSelection((s) => {
      if (s?.kind !== "tank") return s;
      const order = moveItem(
        config.tankIds.map((_, i) => i),
        from,
        target,
      );
      return { ...s, index: order.indexOf(s.index) };
    });
  };

  // Suprimir/Retroceso quitan el cuerpo seleccionado (salvo al escribir en un campo)
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Delete" && e.key !== "Backspace") return;
      const t = e.target as HTMLElement | null;
      if (t && (t.tagName === "INPUT" || t.tagName === "TEXTAREA")) return;
      if (selection?.kind === "tank") {
        e.preventDefault();
        removeTank(selection.index);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  if (!mounted) return null;

  /** Equipa una pieza del catálogo: reemplaza la seleccionada o la ranura única; añade un cuerpo si no hay uno seleccionado. */
  const equip = (part: Part) => {
    switch (part.category) {
      case "nose":
        store.setNose(part.id);
        break;
      case "engine":
        store.setEngine(part.id);
        break;
      case "fin":
        store.setFin(part.id);
        break;
      case "tank":
        if (selection?.kind === "tank") store.replaceTank(selection.index, part.id);
        else store.addTank(part.id);
    }
  };

  const select = (s: Selection | null) => {
    setSelection(s);
    if (s) setTab(s.kind);
  };

  const dropOnRocket = (part: Part, zone: Zone | null) => {
    setDragging(null);
    if (part.category === "tank") {
      if (zone?.kind === "tank") {
        store.replaceTank(zone.index, part.id);
        setSelection({ kind: "tank", index: zone.index });
      } else store.addTank(part.id);
    } else equip(part);
  };

  const isSelected = (p: Part) =>
    (p.category === "nose" && config.noseId === p.id) ||
    (p.category === "engine" && config.engineId === p.id) ||
    (p.category === "fin" && config.finId === p.id) ||
    (p.category === "tank" && selection?.kind === "tank" && config.tankIds[selection.index] === p.id);

  const current = TABS.find((t) => t.category === tab)!;
  const selectedHere = selection?.kind === tab;
  const selectedLabel = selection?.kind === "tank" ? `Cuerpo ${selection.index + 1}` : selection ? SINGULAR[selection.kind].replace(/^(La|El|Las|Los) /, "") : "";

  return (
    <main className="shell grid flex-1 gap-8 py-8 lg:grid-cols-[360px_1fr_300px]">
      {/* Ensamblaje */}
      <div className="flex flex-col items-center gap-3">
        <RocketPreview config={config} selection={selection} dragging={dragging} onSelect={select} onDropPart={dropOnRocket} />

        <input
          aria-label="Nombre del cohete"
          value={config.name}
          maxLength={30}
          onChange={(e) => store.setName(e.target.value)}
          className="panel w-full px-3 py-2 text-center text-sm font-semibold uppercase tracking-[0.1em] outline-none focus:border-bone"
        />

        <AssemblyList
          config={config}
          selection={selection}
          dragging={dragging}
          onSelect={select}
          onChange={(kind, index) => select({ kind, index })}
          onRemoveTank={removeTank}
          onMoveTank={moveTank}
          onReplaceTank={(i, id) => {
            store.replaceTank(i, id);
            setSelection({ kind: "tank", index: i });
            setDragging(null);
          }}
          onAddTank={(id) => {
            store.addTank(id);
            setDragging(null);
          }}
          onAddBody={() => {
            setSelection(null);
            setTab("tank");
          }}
        />
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

        {selectedHere ? (
          <div className="flex flex-wrap items-center justify-between gap-3 border border-cobalt bg-[#18202c] px-4 py-3 text-sm">
            <p>
              <span className="font-semibold">{selectedLabel}</span> seleccionado: elige una pieza del catálogo para{" "}
              <span className="font-semibold">reemplazarlo</span>.
            </p>
            <div className="flex gap-2">
              {selection?.kind === "tank" && (
                <button
                  type="button"
                  className="btn btn-outline !px-3 !py-1.5"
                  disabled={config.tankIds.length >= MAX_TANKS}
                  onClick={() => setSelection(null)}
                >
                  Añadir uno nuevo
                </button>
              )}
              <button type="button" className="btn btn-outline !px-3 !py-1.5" onClick={() => setSelection(null)}>
                Cancelar
              </button>
            </div>
          </div>
        ) : (
          tab === "tank" && (
            <p className="text-sm text-muted">
              Haz clic en un cuerpo para añadirlo al cohete ({config.tankIds.length}/{MAX_TANKS}).
            </p>
          )
        )}

        <div className="grid gap-px border border-line bg-line sm:grid-cols-2 xl:grid-cols-3">
          {current.parts.map((p) => (
            <PartCard
              key={p.id}
              part={p}
              selected={isSelected(p)}
              stats={describe(p)}
              onClick={() => equip(p)}
              onDragStart={setDragging}
              onDragEnd={() => setDragging(null)}
            />
          ))}
        </div>

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
