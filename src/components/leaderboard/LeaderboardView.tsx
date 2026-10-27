"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { getPart } from "@/data/parts";
import { useMounted } from "@/lib/useMounted";
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

const ADMIN_KEY_STORAGE = "lb-admin-key";

function readStoredKey(): string | null {
  try {
    return sessionStorage.getItem(ADMIN_KEY_STORAGE);
  } catch {
    return null;
  }
}

type State = { status: "loading" } | { status: "error"; message: string } | { status: "ok"; entries: LeaderboardEntry[] };

export function LeaderboardView() {
  const [type, setType] = useState<LeaderboardType>("apogee");
  const [limit, setLimit] = useState<(typeof LIMITS)[number]>(10);
  const [state, setState] = useState<State>({ status: "loading" });
  const [reload, setReload] = useState(0);
  const mounted = useMounted();
  // undefined = sin decisión explícita: se toma de la sesión; la clave solo vive en esta pestaña
  const [override, setOverride] = useState<string | null | undefined>(undefined);
  const adminKey = override !== undefined ? override : mounted ? readStoredKey() : null;
  const [showLogin, setShowLogin] = useState(false);
  const [pwd, setPwd] = useState("");
  const [adminMsg, setAdminMsg] = useState<string | null>(null);

  async function login(e: React.FormEvent) {
    e.preventDefault();
    setAdminMsg(null);
    const res = await fetch("/api/leaderboard/admin", { headers: { "x-admin-key": pwd } });
    if (res.status === 204) {
      setOverride(pwd);
      try {
        sessionStorage.setItem(ADMIN_KEY_STORAGE, pwd);
      } catch {
        /* sin almacenamiento */
      }
      setShowLogin(false);
      setPwd("");
    } else if (res.status === 503) {
      setAdminMsg("La administración no está configurada en el servidor.");
    } else {
      setAdminMsg("Clave incorrecta.");
    }
  }

  function logout() {
    setOverride(null);
    try {
      sessionStorage.removeItem(ADMIN_KEY_STORAGE);
    } catch {
      /* sin almacenamiento */
    }
  }

  async function remove(entry: LeaderboardEntry) {
    if (!adminKey) return;
    if (!window.confirm(`¿Eliminar la marca de ${entry.pilotName} (${entry.rocketName}) del ranking?`)) return;
    const res = await fetch(`/api/leaderboard?id=${entry.id}`, { method: "DELETE", headers: { "x-admin-key": adminKey } });
    if (res.status === 204 || res.status === 404) {
      setReload((n) => n + 1);
    } else if (res.status === 401) {
      logout();
      setAdminMsg("La clave ya no es válida. Vuelve a iniciar sesión.");
    } else {
      setAdminMsg("No se pudo eliminar la marca.");
    }
  }

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
  }, [type, limit, reload]);

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
        <div className="mb-2 flex flex-wrap items-center gap-1" role="group" aria-label="Cantidad">
          {adminKey ? (
            <button type="button" className="btn btn-outline !px-4 !py-2" onClick={logout}>
              Salir de administración
            </button>
          ) : (
            <button type="button" className="btn btn-outline !px-4 !py-2" onClick={() => setShowLogin((v) => !v)}>
              Administrar
            </button>
          )}
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
      {showLogin && !adminKey && (
        <form onSubmit={login} className="panel mt-4 flex flex-wrap items-end gap-3 p-4">
          <label className="block">
            <span className="label mb-1 block">Clave de administrador</span>
            <input
              type="password"
              autoComplete="off"
              value={pwd}
              onChange={(e) => setPwd(e.target.value)}
              className="panel w-64 px-3 py-2 text-sm outline-none focus:border-bone"
            />
          </label>
          <button type="submit" disabled={!pwd} className="btn btn-light">
            Entrar
          </button>
        </form>
      )}
      {adminMsg && (
        <p role="alert" className="mt-3 text-sm text-signal">
          {adminMsg}
        </p>
      )}
      {adminKey && <p className="mt-3 text-xs text-muted">Modo administrador: puedes eliminar marcas.</p>}
      <p className="mt-3 text-sm text-muted">{tab.hint}</p>

      <div className="mt-5 overflow-x-auto border border-line">
        <table className="w-full min-w-[720px] text-left text-sm">
          <thead className="bg-graphite">
            <tr className="label">
              {["#", "Piloto", "Cohete", "Apogeo (m)", "Distancia (m)", "Ángulo", "Piezas", "Fecha", ...(adminKey ? ["Acción"] : [])].map((h) => (
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
                  {adminKey && (
                    <td className="px-4 py-3">
                      <button
                        type="button"
                        onClick={() => remove(e)}
                        aria-label={`Eliminar la marca de ${e.pilotName}`}
                        className="border border-signal/70 px-3 py-1 text-[0.65rem] font-semibold uppercase tracking-[0.12em] text-signal transition hover:bg-signal hover:text-bone"
                      >
                        Eliminar
                      </button>
                    </td>
                  )}
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
