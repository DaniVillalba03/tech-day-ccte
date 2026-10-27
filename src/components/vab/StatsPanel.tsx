import type { RocketStats } from "@/types";

const fmt = (n: number, d = 0) => n.toLocaleString("es-ES", { maximumFractionDigits: d, minimumFractionDigits: d });

export function StatsPanel({ stats }: { stats: RocketStats }) {
  const rows: [string, string][] = [
    ["Masa húmeda", `${fmt(stats.wetMass)} kg`],
    ["Masa seca", `${fmt(stats.dryMass)} kg`],
    ["Propelente", `${fmt(stats.propellantMass)} kg`],
    ["Empuje", `${fmt(stats.thrust)} N`],
    ["TWR", fmt(stats.twr, 2)],
    ["Tiempo de quemado", `${fmt(stats.burnTime, 1)} s`],
    ["Δv aproximado", `${fmt(stats.deltaV)} m/s`],
    ["Cd", fmt(stats.cd, 2)],
  ];
  const lowTwr = stats.twr < 1;

  return (
    <section className={`panel border-t-2 p-5 ${lowTwr ? "border-t-signal" : "border-t-cobalt"}`}>
      <h2 className="label mb-4">Telemetría estática</h2>
      <dl className="text-sm">
        {rows.map(([k, v]) => (
          <div key={k} className="flex justify-between border-t border-line py-2 first:border-t-0">
            <dt className="label self-center">{k}</dt>
            <dd className={`font-mono font-medium ${k === "TWR" && lowTwr ? "text-signal" : "text-bone"}`}>{v}</dd>
          </div>
        ))}
      </dl>
      {lowTwr && (
        <p role="alert" className="mt-4 border border-signal/60 bg-signal/10 p-3 text-xs text-bone">
          TWR &lt; 1.0: el cohete no despegará. Usa un motor más potente o menos combustible.
        </p>
      )}
    </section>
  );
}
