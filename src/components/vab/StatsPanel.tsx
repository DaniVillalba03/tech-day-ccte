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
    ["Margen estático", `${fmt(stats.staticMarginLaunch, 2)} → ${fmt(stats.staticMarginBurnout, 2)} cal`],
  ];
  const margin = Math.min(stats.staticMarginLaunch, stats.staticMarginBurnout);
  const stability =
    margin < 0
      ? { tone: "signal", text: "Inestable: el cohete girará sin control. Agrega aletas más grandes o más peso en la ojiva." }
      : margin < 0.5
        ? { tone: "amber", text: "Estabilidad marginal: puede cabecear con el viento. Mejor aletas más grandes o una ojiva más pesada." }
        : margin > 5
          ? { tone: "amber", text: "Sobreestable: tenderá a girar hacia el viento (weathercocking)." }
          : null;
  const lowTwr = stats.twr < 1;

  return (
    <section className={`panel border-t-2 p-5 ${lowTwr ? "border-t-signal" : "border-t-cobalt"}`}>
      <h2 className="label mb-4">Telemetría estática</h2>
      <dl className="text-sm">
        {rows.map(([k, v]) => (
          <div key={k} className="flex justify-between border-t border-line py-2 first:border-t-0">
            <dt className="label self-center">{k}</dt>
            <dd
              className={`font-mono font-medium ${
                (k === "TWR" && lowTwr) || (k === "Margen estático" && stability?.tone === "signal") ? "text-signal" : "text-bone"
              }`}
            >
              {v}
            </dd>
          </div>
        ))}
      </dl>
      {stability && (
        <p
          role="alert"
          className={`mt-4 border p-3 text-xs text-bone ${stability.tone === "signal" ? "border-signal/60 bg-signal/10" : "border-[#e0a21c]/60 bg-[#e0a21c]/10"}`}
        >
          {stability.text}
        </p>
      )}
      {lowTwr && (
        <p role="alert" className="mt-4 border border-signal/60 bg-signal/10 p-3 text-xs text-bone">
          TWR &lt; 1.0: el cohete no despegará. Usa un motor más potente o menos combustible.
        </p>
      )}
    </section>
  );
}
