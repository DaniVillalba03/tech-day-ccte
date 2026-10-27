import type { FlightSnapshot, FlightStatus } from "@/types/flight";
import { Navball } from "./Navball";

export const STATUS_LABEL: Record<FlightStatus, string> = {
  prelaunch: "En plataforma",
  boosting: "Propulsión",
  coasting: "Ascenso inercial",
  descending: "Descenso",
  landed: "Aterrizaje seguro",
  crashed: "Impacto",
};

const fmt = (n: number, d = 0) => n.toLocaleString("es-ES", { maximumFractionDigits: d, minimumFractionDigits: d });

function Stat({ label, value, unit }: { label: string; value: string; unit: string }) {
  return (
    <div>
      <dt className="label whitespace-nowrap">{label}</dt>
      <dd className="whitespace-nowrap font-mono text-xl font-medium leading-tight">
        {value} <span className="text-xs text-muted">{unit}</span>
      </dd>
    </div>
  );
}

/** HUD de telemetría en vuelo; se actualiza ~10 Hz desde el snapshot del store. */
export function Hud({ snap }: { snap: FlightSnapshot | null }) {
  const s: FlightSnapshot = snap ?? {
    t: 0,
    altitude: 0,
    apogee: 0,
    distance: 0,
    speed: 0,
    accelG: 0,
    fuelPct: 100,
    thetaDeg: 90,
    pathDeg: 90,
    status: "prelaunch",
    warp: 1,
    chuteDeployed: false,
    chuteFailed: false,
    mach: 0,
    dynPressure: 0,
    aoaDeg: 0,
    wind: 0,
    onRail: true,
  };
  const lowFuel = s.fuelPct < 15;

  return (
    <div className="panel absolute left-4 top-4 w-[24rem] border-t-2 border-t-cobalt p-4">
      <div className="mb-3 flex items-center justify-between">
        <p className="eyebrow">{STATUS_LABEL[s.status]}</p>
        <span className="font-mono text-xs text-muted">T+{fmt(s.t, 1)} s</span>
      </div>

      <div className="flex items-center gap-4">
        <dl className="grid flex-1 grid-cols-2 gap-x-5 gap-y-3">
          <Stat label="Altitud" value={fmt(s.altitude)} unit="m" />
          <Stat label="Apogeo" value={fmt(s.apogee)} unit="m" />
          <Stat label="Distancia" value={fmt(s.distance)} unit="m" />
          <Stat label="Velocidad" value={fmt(s.speed)} unit="m/s" />
          <Stat label="Mach" value={fmt(s.mach, 2)} unit="" />
          <Stat label="Aceleración" value={fmt(s.accelG, 1)} unit="G" />
          <Stat label="Presión din." value={fmt(s.dynPressure / 1000, 1)} unit="kPa" />
          <Stat label="Áng. ataque" value={fmt(s.aoaDeg, 1)} unit="°" />
          <Stat label="Pitch" value={fmt(s.thetaDeg)} unit="°" />
        </dl>
        <Navball thetaDeg={s.thetaDeg} pathDeg={s.pathDeg} showPath={s.speed > 5} />
      </div>

      <div className="mt-3 flex items-center justify-between border-t border-line pt-2 text-[0.7rem] text-muted">
        <span>
          Viento <span className="font-mono text-bone">{fmt(Math.abs(s.wind), 1)} m/s {s.wind < 0 ? "←" : s.wind > 0 ? "→" : ""}</span>
        </span>
        {s.chuteFailed ? (
          <span className="font-semibold text-signal">¡Paracaídas destruido!</span>
        ) : s.chuteDeployed ? (
          <span className="font-semibold text-bone">Paracaídas abierto</span>
        ) : s.onRail && s.status !== "prelaunch" ? (
          <span>En riel</span>
        ) : null}
      </div>

      <div className="mt-3">
        <div className="mb-1 flex justify-between">
          <span className="label">Combustible</span>
          <span className={`font-mono text-xs ${lowFuel ? "text-signal" : ""}`}>{fmt(s.fuelPct)} %</span>
        </div>
        <div
          className="h-2 bg-steel"
          role="progressbar"
          aria-label="Combustible restante"
          aria-valuenow={Math.round(s.fuelPct)}
          aria-valuemin={0}
          aria-valuemax={100}
        >
          <div className={`h-full ${lowFuel ? "bg-signal" : "bg-bone"}`} style={{ width: `${s.fuelPct}%` }} />
        </div>
      </div>
    </div>
  );
}
