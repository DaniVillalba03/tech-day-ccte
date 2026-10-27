"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { FlightSession, WARPS } from "@/engine/FlightSession";
import { useMounted } from "@/lib/useMounted";
import { useFlightStore } from "@/store/flightStore";
import { useRocketStore } from "@/store/rocketStore";
import { MissionSummaryModal } from "@/components/summary/MissionSummaryModal";
import { Hud } from "./Hud";

export function FlightView() {
  const mounted = useMounted();
  const config = useRocketStore((s) => s.config);
  const snap = useFlightStore((s) => s.snapshot);
  const result = useFlightStore((s) => s.result);
  const wrapRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const sessionRef = useRef<FlightSession | null>(null);
  const [warp, setWarp] = useState(1);

  useEffect(() => {
    if (!mounted) return;
    const canvas = canvasRef.current;
    const wrap = wrapRef.current;
    if (!canvas || !wrap) return;

    const session = new FlightSession(
      canvas,
      config,
      (s) => useFlightStore.getState().setSnapshot(s),
      (r) => useFlightStore.getState().setResult(r),
    );
    sessionRef.current = session;
    const ro = new ResizeObserver(([e]) => session.resize(e.contentRect.width, e.contentRect.height));
    ro.observe(wrap);
    session.resize(wrap.clientWidth, wrap.clientHeight);
    session.start();

    return () => {
      ro.disconnect();
      session.destroy();
      sessionRef.current = null;
      useFlightStore.getState().clear();
    };
  }, [mounted, config]);

  const ended = result !== null;
  const status = snap?.status ?? "prelaunch";

  const changeWarp = (w: number) => {
    setWarp(w);
    sessionRef.current?.setWarp(w);
  };

  return (
    <main className="flex flex-1 flex-col">
      <div ref={wrapRef} className="relative min-h-[420px] flex-1">
        <canvas ref={canvasRef} className="absolute inset-0 h-full w-full" />

        <Hud snap={snap} />

        {result && (
          <MissionSummaryModal
            result={result}
            config={config}
            onRestart={() => {
              sessionRef.current?.reset();
              useFlightStore.getState().clear();
              setWarp(1);
            }}
          />
        )}
      </div>

      <div className="border-t border-line bg-graphite">
        <div className="shell flex flex-wrap items-center gap-4 py-3">
          <button
            type="button"
            className="btn btn-light"
            disabled={status !== "prelaunch"}
            onClick={() => sessionRef.current?.launch()}
          >
            Lanzar (Enter) <span aria-hidden>→</span>
          </button>

          <div className="flex items-center gap-1" role="group" aria-label="Pitch">
            {([1, -1] as const).map((dir) => (
              <button
                key={dir}
                type="button"
                className="btn btn-outline"
                aria-label={dir === 1 ? "Inclinar a la izquierda" : "Inclinar a la derecha"}
                onPointerDown={() => sessionRef.current?.setPitch(dir)}
                onPointerUp={() => sessionRef.current?.setPitch(0)}
                onPointerLeave={() => sessionRef.current?.setPitch(0)}
              >
                {dir === 1 ? "← A" : "D →"}
              </button>
            ))}
          </div>

          <button
            type="button"
            className="btn btn-outline"
            disabled={status === "prelaunch" || ended || snap?.chuteDeployed}
            onClick={() => sessionRef.current?.deployChute()}
          >
            Paracaídas (Espacio)
          </button>

          <div className="flex items-center gap-1" role="group" aria-label="Time warp">
            <span className="label mr-2">Warp</span>
            {WARPS.map((w) => (
              <button
                key={w}
                type="button"
                aria-pressed={warp === w}
                className={`btn ${warp === w ? "btn-light" : "btn-outline"}`}
                onClick={() => changeWarp(w)}
              >
                {w}x
              </button>
            ))}
          </div>

          <div className="ml-auto flex gap-3">
            <button
              type="button"
              className="btn btn-outline"
              onClick={() => {
                sessionRef.current?.reset();
                useFlightStore.getState().clear();
                setWarp(1);
              }}
            >
              Reiniciar
            </button>
            <Link href="/vab" className="btn btn-outline">
              Taller
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
